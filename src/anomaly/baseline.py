"""Baseline anomaly detection methods: Percentile thresholds, Z-score, and IMD criteria."""

import argparse
import json
import logging
from pathlib import Path
from typing import Any, Dict, Tuple
import numpy as np
import xarray as xr

from src.config import DEFAULT_CONFIG_PATH, load_config

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def compute_binary_metrics(pred_mask: np.ndarray, gt_mask: np.ndarray) -> Dict[str, float]:
    """Compute precision, recall, f1, iou, and dice between binary masks."""
    pred = (pred_mask > 0).astype(bool)
    gt = (gt_mask > 0).astype(bool)
    
    tp = int(np.sum(pred & gt))
    fp = int(np.sum(pred & ~gt))
    fn = int(np.sum(~pred & gt))
    
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    
    intersection = tp
    union = tp + fp + fn
    iou = intersection / union if union > 0 else (1.0 if tp == 0 and fp == 0 and fn == 0 else 0.0)
    dice = (2.0 * intersection) / (2.0 * intersection + fp + fn) if (2.0 * intersection + fp + fn) > 0 else 0.0
    
    return {
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1": round(float(f1), 4),
        "iou": round(float(iou), 4),
        "dice": round(float(dice), 4),
    }


def run_baseline_detection(
    config: Dict[str, Any],
    input_file: str | Path | None = None,
    output_dir: str | Path | None = None,
) -> Dict[str, Any]:
    """Execute baseline statistical detection:
    1. Z-score thresholding (z > 2.0)
    2. IMD Heatwave Rule: T >= 40°C (313.15K) in plains and departure >= 4.5°C
    3. Extreme Rainfall Rule: Precipitation > 64.5 mm/day (IMD threshold) or tp_zscore > 2.0
    """
    in_path = Path(input_file) if input_file else Path(config["data"]["processed_dir"]) / "processed_weather.nc"
    out_dir = Path(output_dir) if output_dir else Path(config["data"]["results_dir"])
    out_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Running baseline anomaly detection on {in_path}...")
    ds = xr.open_dataset(in_path)
    
    t2m = ds["t2m"].values  # (time, lat, lon)
    t2m_celsius = t2m - 273.15
    t2m_anom = ds["t2m_anomaly"].values
    t2m_z = ds["t2m_zscore"].values
    
    tp = ds["tp"].values
    tp_z = ds["tp_zscore"].values
    
    # 1. Z-Score Baseline Detection
    z_thresh = config["preprocessing"].get("zscore_threshold", 2.0)
    mask_zscore_heat = t2m_z >= z_thresh
    mask_zscore_rain = tp_z >= z_thresh
    
    # 2. Official IMD Heatwave Criteria
    # Max temp >= 40.0 C in plains and departure >= 4.5 C
    min_temp_c = config["preprocessing"].get("imd_heatwave_min_temp_c", 40.0)
    dep_c = config["preprocessing"].get("imd_heatwave_departure_c", 4.5)
    mask_imd_heatwave = (t2m_celsius >= min_temp_c) & (t2m_anom >= dep_c)
    
    # 3. Extreme Rainfall (IMD Heavy Rainfall definition: >= 64.5 mm/day)
    mask_imd_rain = tp >= 64.5
    
    # Composite Baseline Heatwave & Rainfall masks
    baseline_heatwave_mask = (mask_zscore_heat | mask_imd_heatwave).astype(np.int8)
    baseline_rainfall_mask = (mask_zscore_rain | mask_imd_rain).astype(np.int8)
    baseline_total_mask = (baseline_heatwave_mask | baseline_rainfall_mask).astype(np.int8)
    
    # Ground Truth Comparisons (if available)
    metrics = {}
    if "label_heatwave" in ds and "label_rainfall" in ds:
        gt_heat = ds["label_heatwave"].values
        gt_rain = ds["label_rainfall"].values
        gt_cyclone = ds["label_cyclone"].values if "label_cyclone" in ds else np.zeros_like(gt_heat)
        gt_total = (gt_heat | gt_rain | gt_cyclone).astype(np.int8)
        
        metrics["heatwave"] = compute_binary_metrics(baseline_heatwave_mask, gt_heat)
        metrics["rainfall"] = compute_binary_metrics(baseline_rainfall_mask, gt_rain)
        metrics["overall"] = compute_binary_metrics(baseline_total_mask, gt_total)
        logger.info(f"Baseline Overall Metrics: F1={metrics['overall']['f1']}, IoU={metrics['overall']['iou']}")

    # Save baseline masks to results NetCDF
    results_ds = xr.Dataset(
        data_vars={
            "baseline_heatwave_mask": (["time", "latitude", "longitude"], baseline_heatwave_mask),
            "baseline_rainfall_mask": (["time", "latitude", "longitude"], baseline_rainfall_mask),
            "baseline_anomaly_mask": (["time", "latitude", "longitude"], baseline_total_mask),
        },
        coords=ds.coords,
    )
    mask_file = out_dir / "baseline_masks.nc"
    results_ds.to_netcdf(mask_file, format="NETCDF4", engine="netcdf4")
    logger.info(f"Saved baseline anomaly masks to {mask_file}")
    
    # Save metrics JSON
    metrics_file = out_dir / "baseline_metrics.json"
    with open(metrics_file, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Saved baseline metrics to {metrics_file}")
    
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Baseline anomaly detection")
    parser.add_argument("--config", type=str, default=str(DEFAULT_CONFIG_PATH))
    parser.add_argument("--input", type=str, default=None)
    parser.add_argument("--output", type=str, default=None)
    args = parser.parse_args()

    cfg = load_config(args.config)
    run_baseline_detection(cfg, input_file=args.input, output_dir=args.output)
