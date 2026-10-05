"""ConvLSTM / Spatiotemporal Autoencoder for Weather Anomaly Detection."""

import argparse
import json
import logging
from pathlib import Path
from typing import Any, Dict, Tuple
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import xarray as xr

from src.anomaly.baseline import compute_binary_metrics
from src.config import DEFAULT_CONFIG_PATH, get_device, load_config
from src.preprocess import create_sliding_windows

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class SpatioTemporalConvAutoencoder(nn.Module):
    """Spatiotemporal Encoder-Decoder for multi-channel weather field reconstruction."""
    
    def __init__(self, in_channels: int = 6, time_steps: int = 7, hidden_dim: int = 32):
        super().__init__()
        self.in_channels = in_channels
        self.time_steps = time_steps
        
        # Encoder: compress (B, T, C, H, W)
        self.encoder = nn.Sequential(
            nn.Conv3d(in_channels, hidden_dim, kernel_size=(3, 3, 3), padding=(1, 1, 1)),
            nn.BatchNorm3d(hidden_dim),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Conv3d(hidden_dim, hidden_dim // 2, kernel_size=(3, 3, 3), padding=(1, 1, 1)),
            nn.BatchNorm3d(hidden_dim // 2),
            nn.LeakyReLU(0.2, inplace=True),
        )
        
        # Decoder: reconstruct back to original dimensions
        self.decoder = nn.Sequential(
            nn.Conv3d(hidden_dim // 2, hidden_dim, kernel_size=(3, 3, 3), padding=(1, 1, 1)),
            nn.BatchNorm3d(hidden_dim),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Conv3d(hidden_dim, in_channels, kernel_size=(3, 3, 3), padding=(1, 1, 1)),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Input x: (B, T, C, H, W) -> permute to (B, C, T, H, W) for Conv3D
        x_perm = x.permute(0, 2, 1, 3, 4)
        latent = self.encoder(x_perm)
        recon = self.decoder(latent)
        # Permute back to (B, T, C, H, W)
        return recon.permute(0, 2, 1, 3, 4)


def train_autoencoder(
    config: Dict[str, Any],
    input_file: str | Path | None = None,
    output_dir: str | Path | None = None,
    epochs: int | None = None,
    seed: int = 42,
) -> Dict[str, Any]:
    """Train Autoencoder on normal weather patterns and detect anomalies via reconstruction error."""
    torch.manual_seed(seed)
    np.random.seed(seed)
    device = get_device(config.get("project", {}).get("device", "auto"))
    logger.info(f"Using device: {device}")
    
    in_path = Path(input_file) if input_file else Path(config["data"]["processed_dir"]) / "processed_weather.nc"
    out_dir = Path(output_dir) if output_dir else Path(config["data"]["results_dir"])
    out_dir.mkdir(parents=True, exist_ok=True)
    
    variables = config["data"]["variables"]
    past_days = config["preprocessing"].get("window_past_days", 7)
    
    logger.info("Generating temporal sliding windows for Autoencoder...")
    X, _, dates = create_sliding_windows(
        dataset_path=in_path,
        variables=variables,
        past_days=past_days,
        lead_days=[1],
        use_zscore=True,
    )
    
    with open(Path(config["data"]["processed_dir"]) / "time_splits.json", "r", encoding="utf-8") as f:
        splits = json.load(f)
        
    train_end = max(10, splits["train"]["slice"][1] - past_days)
    val_end = max(train_end + 10, splits["val"]["slice"][1] - past_days)
    
    X_train = torch.from_numpy(X[:train_end])
    X_val = torch.from_numpy(X[train_end:val_end])
    X_test = torch.from_numpy(X[val_end:])
    
    train_loader = DataLoader(TensorDataset(X_train), batch_size=config["detection"]["autoencoder"].get("batch_size", 16), shuffle=True)
    val_loader = DataLoader(TensorDataset(X_val), batch_size=config["detection"]["autoencoder"].get("batch_size", 16), shuffle=False)
    
    model = SpatioTemporalConvAutoencoder(
        in_channels=len(variables),
        time_steps=past_days,
        hidden_dim=config["detection"]["autoencoder"].get("hidden_dims", [32, 16])[0],
    ).to(device)
    
    optimizer = torch.optim.Adam(model.parameters(), lr=config["detection"]["autoencoder"].get("learning_rate", 0.001))
    criterion = nn.MSELoss(reduction="none")
    
    n_epochs = epochs or config["detection"]["autoencoder"].get("epochs", 3)
    best_val_loss = float("inf")
    checkpoint_path = out_dir / "autoencoder_checkpoint.pt"
    
    logger.info(f"Training Autoencoder for {n_epochs} epochs...")
    for epoch in range(1, n_epochs + 1):
        model.train()
        train_loss = 0.0
        for (batch_x,) in train_loader:
            batch_x = batch_x.to(device)
            optimizer.zero_grad()
            recon = model(batch_x)
            loss = criterion(recon, batch_x).mean()
            loss.backward()
            optimizer.step()
            train_loss += float(loss.item()) * len(batch_x)
            
        train_loss /= len(X_train)
        
        # Validation loss
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for (batch_x,) in val_loader:
                batch_x = batch_x.to(device)
                recon = model(batch_x)
                loss = criterion(recon, batch_x).mean()
                val_loss += float(loss.item()) * len(batch_x)
        val_loss /= len(X_val)
        
        logger.info(f"Epoch {epoch}/{n_epochs} - Train MSE: {train_loss:.5f}, Val MSE: {val_loss:.5f}")
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "val_loss": val_loss,
            }, checkpoint_path)
            
    logger.info(f"Saved best Autoencoder checkpoint to {checkpoint_path}")
    
    # Load best checkpoint
    chk = torch.load(checkpoint_path, map_location=device, weights_only=False)
    model.load_state_dict(chk["model_state_dict"])
    model.eval()
    
    # Compute reconstruction error on validation set to calibrate anomaly threshold
    val_errors = []
    with torch.no_grad():
        for (batch_x,) in val_loader:
            batch_x = batch_x.to(device)
            recon = model(batch_x)
            # MSE per cell on the most recent timestep: (B, C, H, W) -> mean over channels -> (B, H, W)
            err = criterion(recon[:, -1], batch_x[:, -1]).mean(dim=1).cpu().numpy()
            val_errors.append(err)
            
    val_err_arr = np.concatenate(val_errors, axis=0)
    thresh_pct = config["detection"]["autoencoder"].get("threshold_percentile", 95.0)
    threshold = float(np.percentile(val_err_arr, thresh_pct))
    logger.info(f"Calibrated Autoencoder reconstruction threshold ({thresh_pct}th percentile): {threshold:.5f}")
    
    # Full dataset inference
    all_loader = DataLoader(TensorDataset(torch.from_numpy(X)), batch_size=16, shuffle=False)
    full_errors = []
    with torch.no_grad():
        for (batch_x,) in all_loader:
            batch_x = batch_x.to(device)
            recon = model(batch_x)
            err = criterion(recon[:, -1], batch_x[:, -1]).mean(dim=1).cpu().numpy()
            full_errors.append(err)
            
    recon_error = np.concatenate(full_errors, axis=0) # shape (N_samples, H, W)
    ae_masks = (recon_error > threshold).astype(np.int8)
    
    # Open dataset to map back to xarray coordinates
    ds = xr.open_dataset(in_path)
    n_t, n_lat, n_lon = len(ds.time), len(ds.latitude), len(ds.longitude)
    
    padded_masks = np.zeros((n_t, n_lat, n_lon), dtype=np.int8)
    padded_errors = np.zeros((n_t, n_lat, n_lon), dtype=np.float32)
    # The first (past_days - 1) days cannot be evaluated because of sliding window lag
    padded_masks[past_days - 1 : past_days - 1 + len(ae_masks)] = ae_masks
    padded_errors[past_days - 1 : past_days - 1 + len(recon_error)] = recon_error
    
    # Evaluate against ground truth
    metrics = {
        "best_val_loss": round(float(best_val_loss), 5),
        "threshold": round(threshold, 5),
    }
    if "label_heatwave" in ds and "label_rainfall" in ds:
        gt_total = (ds["label_heatwave"].values | ds["label_rainfall"].values).astype(np.int8)
        if "label_cyclone" in ds:
            gt_total = (gt_total | ds["label_cyclone"].values).astype(np.int8)
            
        test_start = splits["test"]["slice"][0]
        metrics["test_split"] = compute_binary_metrics(
            padded_masks[test_start:],
            gt_total[test_start:]
        )
        logger.info(f"Autoencoder Metrics (Test): F1={metrics['test_split']['f1']}, IoU={metrics['test_split']['iou']}")

    # Save NetCDF masks
    res_ds = xr.Dataset(
        data_vars={
            "autoencoder_mask": (["time", "latitude", "longitude"], padded_masks),
            "reconstruction_error": (["time", "latitude", "longitude"], padded_errors),
        },
        coords=ds.coords,
    )
    mask_file = out_dir / "autoencoder_masks.nc"
    res_ds.to_netcdf(mask_file, format="NETCDF4", engine="netcdf4")
    logger.info(f"Saved Autoencoder masks to {mask_file}")
    
    metrics_file = out_dir / "autoencoder_metrics.json"
    with open(metrics_file, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Saved Autoencoder metrics to {metrics_file}")
    
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ConvLSTM Autoencoder Anomaly Detection")
    parser.add_argument("--config", type=str, default=str(DEFAULT_CONFIG_PATH))
    parser.add_argument("--input", type=str, default=None)
    parser.add_argument("--output", type=str, default=None)
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    cfg = load_config(args.config)
    train_autoencoder(cfg, input_file=args.input, output_dir=args.output, epochs=args.epochs, seed=args.seed)
