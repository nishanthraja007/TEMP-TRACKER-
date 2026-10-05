"""U-Net Segmentation for Extreme Weather Anomaly Masks with Dice + Focal Loss."""

import argparse
import json
import logging
from pathlib import Path
from typing import Any, Dict
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset
import xarray as xr

from src.anomaly.baseline import compute_binary_metrics
from src.config import DEFAULT_CONFIG_PATH, get_device, load_config

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class DiceFocalLoss(nn.Module):
    """Combined Dice and Focal Loss designed for highly imbalanced anomaly segmentation."""
    
    def __init__(self, alpha: float = 0.8, gamma: float = 2.0, dice_weight: float = 0.5, focal_weight: float = 0.5):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.dice_weight = dice_weight
        self.focal_weight = focal_weight
        
    def forward(self, logits: torch.Tensor, targets: torch.Tensor, smooth: float = 1.0) -> torch.Tensor:
        probs = torch.sigmoid(logits)
        
        # Flatten
        probs_flat = probs.reshape(-1)
        targets_flat = targets.reshape(-1)
        
        # Dice Loss
        intersection = (probs_flat * targets_flat).sum()
        dice_loss = 1.0 - (2.0 * intersection + smooth) / (probs_flat.sum() + targets_flat.sum() + smooth)
        
        # Focal Loss
        bce = F.binary_cross_entropy_with_logits(logits.reshape(-1), targets_flat, reduction="none")
        p_t = probs_flat * targets_flat + (1 - probs_flat) * (1 - targets_flat)
        alpha_t = self.alpha * targets_flat + (1 - self.alpha) * (1 - targets_flat)
        focal_loss = (alpha_t * (1.0 - p_t) ** self.gamma * bce).mean()
        
        return self.dice_weight * dice_loss + self.focal_weight * focal_loss


class ConvBlock(nn.Module):
    def __init__(self, in_c: int, out_c: int):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_c, out_c, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_c),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_c, out_c, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_c),
            nn.ReLU(inplace=True),
        )
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.conv(x)


class UNet(nn.Module):
    """2D U-Net for multi-channel weather field segmentation."""
    def __init__(self, in_channels: int = 6, out_channels: int = 1, base_dim: int = 32):
        super().__init__()
        self.enc1 = ConvBlock(in_channels, base_dim)
        self.pool1 = nn.MaxPool2d(2)
        
        self.enc2 = ConvBlock(base_dim, base_dim * 2)
        self.pool2 = nn.MaxPool2d(2)
        
        self.bottleneck = ConvBlock(base_dim * 2, base_dim * 4)
        
        self.up2 = nn.ConvTranspose2d(base_dim * 4, base_dim * 2, kernel_size=2, stride=2)
        self.dec2 = ConvBlock(base_dim * 4, base_dim * 2)
        
        self.up1 = nn.ConvTranspose2d(base_dim * 2, base_dim, kernel_size=2, stride=2)
        self.dec1 = ConvBlock(base_dim * 2, base_dim)
        
        self.out_conv = nn.Conv2d(base_dim, out_channels, kernel_size=1)
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        orig_h, orig_w = x.shape[2], x.shape[3]
        
        # Pad if needed to multiples of 4
        pad_h = (4 - orig_h % 4) % 4
        pad_w = (4 - orig_w % 4) % 4
        if pad_h > 0 or pad_w > 0:
            x = F.pad(x, (0, pad_w, 0, pad_h), mode="reflect")
            
        e1 = self.enc1(x)
        p1 = self.pool1(e1)
        
        e2 = self.enc2(p1)
        p2 = self.pool2(e2)
        
        b = self.bottleneck(p2)
        
        d2 = self.up2(b)
        if d2.shape != e2.shape:
            d2 = F.interpolate(d2, size=e2.shape[2:], mode="bilinear", align_corners=False)
        d2 = torch.cat([d2, e2], dim=1)
        d2 = self.dec2(d2)
        
        d1 = self.up1(d2)
        if d1.shape != e1.shape:
            d1 = F.interpolate(d1, size=e1.shape[2:], mode="bilinear", align_corners=False)
        d1 = torch.cat([d1, e1], dim=1)
        d1 = self.dec1(d1)
        
        out = self.out_conv(d1)
        
        # Unpad back to original dimensions
        if pad_h > 0 or pad_w > 0:
            out = out[:, :, :orig_h, :orig_w]
            
        return out.contiguous()


def train_unet(
    config: Dict[str, Any],
    input_file: str | Path | None = None,
    output_dir: str | Path | None = None,
    epochs: int | None = None,
    seed: int = 42,
) -> Dict[str, Any]:
    """Train U-Net to segment extreme weather masks using Dice + Focal loss."""
    torch.manual_seed(seed)
    np.random.seed(seed)
    device = get_device(config.get("project", {}).get("device", "auto"))
    logger.info(f"Using device: {device}")
    
    in_path = Path(input_file) if input_file else Path(config["data"]["processed_dir"]) / "processed_weather.nc"
    out_dir = Path(output_dir) if output_dir else Path(config["data"]["results_dir"])
    out_dir.mkdir(parents=True, exist_ok=True)
    
    ds = xr.open_dataset(in_path)
    variables = config["data"]["variables"]
    
    # Features: multi-variable zscores (time, C, H, W)
    var_arrays = [ds[f"{v}_zscore"].values if f"{v}_zscore" in ds else ds[v].values for v in variables]
    X_arr = np.stack(var_arrays, axis=1).astype(np.float32)
    
    # Target: Ground truth masks or percentile pseudo-labels
    if "label_heatwave" in ds and "label_rainfall" in ds:
        gt_mask = (ds["label_heatwave"].values | ds["label_rainfall"].values).astype(np.float32)
        if "label_cyclone" in ds:
            gt_mask = (gt_mask > 0 | (ds["label_cyclone"].values > 0)).astype(np.float32)
    else:
        # Fallback to percentile pseudo-labels (t2m_z > 2.0 or tp_z > 2.0)
        gt_mask = ((ds["t2m_zscore"].values > 2.0) | (ds["tp_zscore"].values > 2.0)).astype(np.float32)
        
    Y_arr = gt_mask[:, np.newaxis, :, :] # (time, 1, H, W)
    
    with open(Path(config["data"]["processed_dir"]) / "time_splits.json", "r", encoding="utf-8") as f:
        splits = json.load(f)
        
    train_end = splits["train"]["slice"][1]
    val_end = splits["val"]["slice"][1]
    
    X_train, Y_train = torch.from_numpy(X_arr[:train_end]), torch.from_numpy(Y_arr[:train_end])
    X_val, Y_val = torch.from_numpy(X_arr[train_end:val_end]), torch.from_numpy(Y_arr[train_end:val_end])
    X_test, Y_test = torch.from_numpy(X_arr[val_end:]), torch.from_numpy(Y_arr[val_end:])
    
    train_loader = DataLoader(TensorDataset(X_train, Y_train), batch_size=config["detection"]["unet"].get("batch_size", 16), shuffle=True)
    val_loader = DataLoader(TensorDataset(X_val, Y_val), batch_size=config["detection"]["unet"].get("batch_size", 16), shuffle=False)
    
    model = UNet(in_channels=len(variables), out_channels=1, base_dim=32).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=config["detection"]["unet"].get("learning_rate", 0.001))
    criterion = DiceFocalLoss(
        dice_weight=config["detection"]["unet"].get("dice_weight", 0.5),
        focal_weight=config["detection"]["unet"].get("focal_weight", 0.5),
    )
    
    n_epochs = epochs or config["detection"]["unet"].get("epochs", 3)
    best_val_loss = float("inf")
    checkpoint_path = out_dir / "unet_checkpoint.pt"
    
    logger.info(f"Training U-Net for {n_epochs} epochs...")
    for epoch in range(1, n_epochs + 1):
        model.train()
        train_loss = 0.0
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            optimizer.zero_grad()
            logits = model(batch_x)
            loss = criterion(logits, batch_y)
            loss.backward()
            optimizer.step()
            train_loss += float(loss.item()) * len(batch_x)
            
        train_loss /= len(X_train)
        
        # Validation
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                logits = model(batch_x)
                loss = criterion(logits, batch_y)
                val_loss += float(loss.item()) * len(batch_x)
        val_loss /= len(X_val)
        
        logger.info(f"Epoch {epoch}/{n_epochs} - Train Loss: {train_loss:.5f}, Val Loss: {val_loss:.5f}")
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "val_loss": val_loss,
            }, checkpoint_path)
            
    logger.info(f"Saved best U-Net checkpoint to {checkpoint_path}")
    
    # Full dataset inference
    chk = torch.load(checkpoint_path, map_location=device, weights_only=False)
    model.load_state_dict(chk["model_state_dict"])
    model.eval()
    
    all_loader = DataLoader(TensorDataset(torch.from_numpy(X_arr)), batch_size=16, shuffle=False)
    all_preds = []
    with torch.no_grad():
        for (batch_x,) in all_loader:
            batch_x = batch_x.to(device)
            logits = model(batch_x)
            probs = torch.sigmoid(logits).squeeze(1).cpu().numpy()
            all_preds.append(probs)
            
    pred_probs = np.concatenate(all_preds, axis=0) # (time, H, W)
    unet_mask = (pred_probs > 0.5).astype(np.int8)
    
    # Evaluate
    test_slice = slice(val_end, len(X_arr))
    test_metrics = compute_binary_metrics(
        unet_mask[test_slice],
        Y_arr[test_slice, 0]
    )
    overall_metrics = compute_binary_metrics(unet_mask, Y_arr[:, 0])
    
    metrics = {
        "best_val_loss": round(float(best_val_loss), 5),
        "overall": overall_metrics,
        "test_split": test_metrics,
    }
    logger.info(f"U-Net Test Metrics: Precision={test_metrics['precision']}, Recall={test_metrics['recall']}, F1={test_metrics['f1']}, IoU={test_metrics['iou']}")
    
    # Save NetCDF masks
    res_ds = xr.Dataset(
        data_vars={
            "unet_mask": (["time", "latitude", "longitude"], unet_mask),
            "unet_prob": (["time", "latitude", "longitude"], pred_probs.astype(np.float32)),
        },
        coords=ds.coords,
    )
    mask_file = out_dir / "unet_masks.nc"
    res_ds.to_netcdf(mask_file, format="NETCDF4", engine="netcdf4")
    logger.info(f"Saved U-Net masks to {mask_file}")
    
    metrics_file = out_dir / "unet_metrics.json"
    with open(metrics_file, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Saved U-Net metrics to {metrics_file}")
    
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="U-Net Extreme Anomaly Segmentation")
    parser.add_argument("--config", type=str, default=str(DEFAULT_CONFIG_PATH))
    parser.add_argument("--input", type=str, default=None)
    parser.add_argument("--output", type=str, default=None)
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    cfg = load_config(args.config)
    train_unet(cfg, input_file=args.input, output_dir=args.output, epochs=args.epochs, seed=args.seed)
