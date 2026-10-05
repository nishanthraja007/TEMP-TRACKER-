"""Train ConvLSTM weather anomaly forecasting model and compare against baselines."""

import argparse
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Tuple
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import xarray as xr

from src.config import DEFAULT_CONFIG_PATH, get_device, load_config
from src.forecast.convlstm import WeatherConvLSTM
from src.preprocess import create_sliding_windows

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def compute_forecast_metrics(y_pred: np.ndarray, y_true: np.ndarray, threshold: float = 1.5) -> Dict[str, float]:
    """Compute meteorological forecast verification metrics:
    - RMSE: Root Mean Squared Error
    - ACC: Anomaly Correlation Coefficient (spatial correlation)
    - CSI: Critical Success Index (Threat Score) for anomaly threshold
    - POD: Probability of Detection (Hit Rate)
    - FAR: False Alarm Ratio
    """
    # y_pred, y_true: (N, C, H, W)
    # Flatten across spatial and channel dimensions
    yp = y_pred.flatten()
    yt = y_true.flatten()
    
    # 1. RMSE
    rmse = float(np.sqrt(np.mean((yp - yt) ** 2)))
    
    # 2. ACC (Spatial Anomaly Correlation Coefficient)
    mean_yp = np.mean(yp)
    mean_yt = np.mean(yt)
    numer = np.sum((yp - mean_yp) * (yt - mean_yt))
    denom = np.sqrt(np.sum((yp - mean_yp) ** 2) * np.sum((yt - mean_yt) ** 2))
    acc = float(numer / denom) if denom > 1e-6 else 0.0
    
    # 3. Categorical metrics for extreme anomalies (z >= threshold)
    pred_event = yp >= threshold
    true_event = yt >= threshold
    
    hits = int(np.sum(pred_event & true_event))
    false_alarms = int(np.sum(pred_event & ~true_event))
    misses = int(np.sum(~pred_event & true_event))
    
    # CSI (Threat Score) = Hits / (Hits + FalseAlarms + Misses)
    denom_csi = hits + false_alarms + misses
    csi = float(hits / denom_csi) if denom_csi > 0 else 0.0
    
    # POD (Probability of Detection) = Hits / (Hits + Misses)
    denom_pod = hits + misses
    pod = float(hits / denom_pod) if denom_pod > 0 else 0.0
    
    # FAR (False Alarm Ratio) = FalseAlarms / (Hits + FalseAlarms)
    denom_far = hits + false_alarms
    far = float(false_alarms / denom_far) if denom_far > 0 else 0.0
    
    return {
        "rmse": round(rmse, 4),
        "acc": round(acc, 4),
        "csi": round(csi, 4),
        "pod": round(pod, 4),
        "far": round(far, 4),
    }


def train_forecast_model(
    config: Dict[str, Any],
    input_file: str | Path | None = None,
    output_dir: str | Path | None = None,
    epochs: int | None = None,
    seed: int = 42,
) -> Dict[str, Any]:
    """Train ConvLSTM forecasting model and benchmark against Persistence and Climatology."""
    torch.manual_seed(seed)
    np.random.seed(seed)
    device = get_device(config.get("project", {}).get("device", "auto"))
    logger.info(f"Using device: {device} for forecasting")
    
    in_path = Path(input_file) if input_file else Path(config["data"]["processed_dir"]) / "processed_weather.nc"
    out_dir = Path(output_dir) if output_dir else Path(config["data"]["results_dir"])
    out_dir.mkdir(parents=True, exist_ok=True)
    
    variables = config["data"]["variables"]
    past_days = config["preprocessing"].get("window_past_days", 7)
    lead_days = config["preprocessing"].get("forecast_lead_days", [1, 2, 3])
    
    logger.info(f"Generating sliding windows (past_days={past_days}, lead_days={lead_days})...")
    X, Y, dates = create_sliding_windows(
        dataset_path=in_path,
        variables=variables,
        past_days=past_days,
        lead_days=lead_days,
        use_zscore=True,
    )
    
    with open(Path(config["data"]["processed_dir"]) / "time_splits.json", "r", encoding="utf-8") as f:
        splits = json.load(f)
        
    train_end = max(10, splits["train"]["slice"][1] - past_days - max(lead_days))
    val_end = max(train_end + 10, splits["val"]["slice"][1] - past_days - max(lead_days))
    
    X_train, Y_train = torch.from_numpy(X[:train_end]), torch.from_numpy(Y[:train_end])
    X_val, Y_val = torch.from_numpy(X[train_end:val_end]), torch.from_numpy(Y[train_end:val_end])
    X_test, Y_test = torch.from_numpy(X[val_end:]), torch.from_numpy(Y[val_end:])
    
    batch_size = config["forecasting"].get("batch_size", 16)
    train_loader = DataLoader(TensorDataset(X_train, Y_train), batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(TensorDataset(X_val, Y_val), batch_size=batch_size, shuffle=False)
    
    model = WeatherConvLSTM(
        in_channels=len(variables),
        hidden_dim=config["forecasting"].get("hidden_dim", 32),
        out_channels=len(variables),
        lead_steps=len(lead_days),
        kernel_size=config["forecasting"].get("kernel_size", 3),
    ).to(device)
    
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.MSELoss()
    
    n_epochs = epochs or config["forecasting"].get("epochs", 3)
    best_val_loss = float("inf")
    checkpoint_path = out_dir / "convlstm_forecast.pt"
    
    logger.info(f"Training ConvLSTM for {n_epochs} epochs...")
    for epoch in range(1, n_epochs + 1):
        model.train()
        train_loss = 0.0
        for bx, by in train_loader:
            bx, by = bx.to(device), by.to(device)
            optimizer.zero_grad()
            pred = model(bx)
            loss = criterion(pred, by)
            loss.backward()
            optimizer.step()
            train_loss += float(loss.item()) * len(bx)
            
        train_loss /= len(X_train)
        
        # Validation
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for bx, by in val_loader:
                bx, by = bx.to(device), by.to(device)
                pred = model(bx)
                loss = criterion(pred, by)
                val_loss += float(loss.item()) * len(bx)
        val_loss /= len(X_val)
        
        logger.info(f"Epoch {epoch}/{n_epochs} - Train MSE: {train_loss:.5f}, Val MSE: {val_loss:.5f}")
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "val_loss": val_loss,
            }, checkpoint_path)
            
    logger.info(f"Saved best forecast checkpoint to {checkpoint_path}")
    
    # Load best checkpoint for testing
    chk = torch.load(checkpoint_path, map_location=device, weights_only=False)
    model.load_state_dict(chk["model_state_dict"])
    model.eval()
    
    # Test Evaluation on Test Split
    test_loader = DataLoader(TensorDataset(X_test, Y_test), batch_size=batch_size, shuffle=False)
    convlstm_preds = []
    
    with torch.no_grad():
        for bx, _ in test_loader:
            bx = bx.to(device)
            pred = model(bx)
            convlstm_preds.append(pred.cpu().numpy())
            
    y_pred_convlstm = np.concatenate(convlstm_preds, axis=0) # (N_test, leads, C, H, W)
    y_true_test = Y_test.numpy()                             # (N_test, leads, C, H, W)
    
    # Baseline 1: Persistence (pred at lead L = most recent observed day x[:, -1])
    # Shape: (N_test, leads, C, H, W)
    y_pred_persist = np.repeat(X_test[:, -1:, :, :, :].numpy(), len(lead_days), axis=1)
    
    # Baseline 2: Climatology (pred at lead L = 0.0 z-score normal)
    y_pred_climatology = np.zeros_like(y_true_test)
    
    # Per-lead verification metrics
    metrics: Dict[str, Any] = {
        "convlstm": {},
        "persistence": {},
        "climatology": {},
    }
    
    for lead_idx, lead in enumerate(lead_days):
        lead_key = f"day_{lead}"
        
        # ConvLSTM
        m_conv = compute_forecast_metrics(y_pred_convlstm[:, lead_idx], y_true_test[:, lead_idx])
        metrics["convlstm"][lead_key] = m_conv
        
        # Persistence
        m_pers = compute_forecast_metrics(y_pred_persist[:, lead_idx], y_true_test[:, lead_idx])
        metrics["persistence"][lead_key] = m_pers
        
        # Climatology
        m_clim = compute_forecast_metrics(y_pred_climatology[:, lead_idx], y_true_test[:, lead_idx])
        metrics["climatology"][lead_key] = m_clim
        
        logger.info(
            f"Lead +{lead}d: ConvLSTM RMSE={m_conv['rmse']} (ACC={m_conv['acc']}) vs "
            f"Persistence RMSE={m_pers['rmse']} vs Climatology RMSE={m_clim['rmse']}"
        )
        
    metrics_path = out_dir / "forecast_metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Saved forecast metrics to {metrics_path}")
    
    # Save a forecast sample NetCDF for the API to serve
    ds = xr.open_dataset(in_path)
    sample_lats = ds.latitude.values
    sample_lons = ds.longitude.values
    
    # Select last sample from test set for live visual comparisons
    sample_pred = y_pred_convlstm[-1] # (leads, C, H, W)
    sample_actual = y_true_test[-1]   # (leads, C, H, W)
    target_date_str = dates[val_end + len(y_pred_convlstm) - 1]
    
    fc_ds = xr.Dataset(
        data_vars={
            "t2m_pred": (["lead", "latitude", "longitude"], sample_pred[:, 0, :, :]),
            "t2m_actual": (["lead", "latitude", "longitude"], sample_actual[:, 0, :, :]),
            "tp_pred": (["lead", "latitude", "longitude"], sample_pred[:, 1, :, :]),
            "tp_actual": (["lead", "latitude", "longitude"], sample_actual[:, 1, :, :]),
        },
        coords={
            "lead": lead_days,
            "latitude": sample_lats,
            "longitude": sample_lons,
        },
        attrs={
            "forecast_reference_date": target_date_str,
            "lead_units": "days",
        },
    )
    fc_sample_path = out_dir / "forecast_sample.nc"
    fc_ds.to_netcdf(fc_sample_path, format="NETCDF4", engine="netcdf4")
    logger.info(f"Saved forecast sample to {fc_sample_path}")
    
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train ConvLSTM forecast model")
    parser.add_argument("--config", type=str, default=str(DEFAULT_CONFIG_PATH))
    parser.add_argument("--input", type=str, default=None)
    parser.add_argument("--output", type=str, default=None)
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    cfg = load_config(args.config)
    train_forecast_model(cfg, input_file=args.input, output_dir=args.output, epochs=args.epochs, seed=args.seed)
