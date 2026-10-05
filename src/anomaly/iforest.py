"""Isolation Forest anomaly detection on multi-variable meteorological grid cells."""

import argparse
import json
import logging
from pathlib import Path
import pickle
from typing import Any, Dict
import numpy as np
from sklearn.ensemble import IsolationForest
import xarray as xr

from src.anomaly.baseline import compute_binary_metrics
from src.config import DEFAULT_CONFIG_PATH, load_config

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def extract_cell_features(ds: xr.Dataset, variables: list[str]) -> np.ndarray:
    """Extract flattened feature matrix from multi-variable grid (N_samples, n_features)."""
    feature_list = []
    for v in variables:
        z_key = f"{v}_zscore"
        arr = ds[z_key].values if z_key in ds else ds[v].values
        feature_list.append(arr.reshape(-1))
        
        # Spatial gradients (lat, lon)
        grad_lat = np.gradient(arr, axis=1).reshape(-1)
        grad_lon = np.gradient(arr, axis=2).reshape(-1)
        feature_list.append(grad_lat)
        feature_list.append(grad_lon)
        
    X = np.column_stack(feature_list).astype(np.float32)
    # Replace any NaNs with 0
    X = np.nan_to_num(X, nan=0.0)
    return X


def run_iforest(
    config: Dict[str, Any],
    input_file: str | Path | None = None,
    output_dir: str | Path | None = None,
    seed: int = 42,
) -> Dict[str, Any]:
    """Train and evaluate Isolation Forest on meteorological anomalies."""
    np.random.seed(seed)
    in_path = Path(input_file) if input_file else Path(config["data"]["processed_dir"]) / "processed_weather.nc"
    out_dir = Path(output_dir) if output_dir else Path(config["data"]["results_dir"])
    out_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Loading dataset from {in_path} for Isolation Forest...")
    ds = xr.open_dataset(in_path)
    
    with open(Path(config["data"]["processed_dir"]) / "time_splits.json", "r", encoding="utf-8") as f:
        splits = json.load(f)
    
    train_end = splits["train"]["slice"][1]
    
    ds_train = ds.isel(time=slice(0, train_end))
    vars_to_use = [v for v in config["data"]["variables"] if f"{v}_zscore" in ds or v in ds]
    
    logger.info("Extracting spatial & gradient features...")
    X_train = extract_cell_features(ds_train, vars_to_use)
    
    # Subsample training data for fast CPU fitting
    max_train_samples = 50000
    if len(X_train) > max_train_samples:
        indices = np.random.choice(len(X_train), max_train_samples, replace=False)
        X_train_sub = X_train[indices]
    else:
        X_train_sub = X_train
        
    if_cfg = config["detection"]["iforest"]
    contamination = if_cfg.get("contamination", 0.05)
    n_estimators = if_cfg.get("n_estimators", 100)
    
    logger.info(f"Training IsolationForest (n_estimators={n_estimators}, contamination={contamination})...")
    clf = IsolationForest(
        n_estimators=n_estimators,
        contamination=contamination,
        random_state=seed,
        n_jobs=-1,
    )
    clf.fit(X_train_sub)
    
    # Save model checkpoint
    model_path = out_dir / "iforest_model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(clf, f)
    logger.info(f"Saved Isolation Forest model to {model_path}")
    
    # Inference on the entire dataset
    logger.info("Scoring full spatiotemporal dataset...")
    X_full = extract_cell_features(ds, vars_to_use)
    # IsolationForest: -1 for outlier, 1 for inlier
    raw_preds = clf.predict(X_full)
    scores = -clf.decision_function(X_full) # Higher score = more anomalous
    
    n_t = len(ds.time)
    n_lat = len(ds.latitude)
    n_lon = len(ds.longitude)
    
    iforest_mask = (raw_preds == -1).reshape((n_t, n_lat, n_lon)).astype(np.int8)
    anomaly_scores = scores.reshape((n_t, n_lat, n_lon)).astype(np.float32)
    
    # Evaluate against ground truth
    metrics = {}
    if "label_heatwave" in ds and "label_rainfall" in ds:
        gt_total = (ds["label_heatwave"].values | ds["label_rainfall"].values).astype(np.int8)
        if "label_cyclone" in ds:
            gt_total = (gt_total | ds["label_cyclone"].values).astype(np.int8)
            
        metrics["overall"] = compute_binary_metrics(iforest_mask, gt_total)
        # Test split only
        test_start = splits["test"]["slice"][0]
        metrics["test_split"] = compute_binary_metrics(
            iforest_mask[test_start:],
            gt_total[test_start:]
        )
        logger.info(f"IForest Metrics (Test): F1={metrics['test_split']['f1']}, IoU={metrics['test_split']['iou']}")
        
    # Save masks
    res_ds = xr.Dataset(
        data_vars={
            "iforest_mask": (["time", "latitude", "longitude"], iforest_mask),
            "iforest_score": (["time", "latitude", "longitude"], anomaly_scores),
        },
        coords=ds.coords,
    )
    mask_file = out_dir / "iforest_masks.nc"
    res_ds.to_netcdf(mask_file, format="NETCDF4", engine="netcdf4")
    logger.info(f"Saved IForest masks to {mask_file}")
    
    metrics_file = out_dir / "iforest_metrics.json"
    with open(metrics_file, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Saved IForest metrics to {metrics_file}")
    
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Isolation Forest anomaly detection")
    parser.add_argument("--config", type=str, default=str(DEFAULT_CONFIG_PATH))
    parser.add_argument("--input", type=str, default=None)
    parser.add_argument("--output", type=str, default=None)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    cfg = load_config(args.config)
    run_iforest(cfg, input_file=args.input, output_dir=args.output, seed=args.seed)
