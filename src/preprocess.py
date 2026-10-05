"""Preprocessing pipeline: region subset, climatology, z-score, time-based splits, and sliding windows."""

import argparse
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
import xarray as xr

from src.config import DEFAULT_CONFIG_PATH, load_config

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def compute_smoothed_climatology(
    train_da: xr.DataArray,
    window_days: int = 15,
) -> Tuple[xr.DataArray, xr.DataArray]:
    """Compute day-of-year mean and std over training data only, smoothed with a circular rolling window."""
    # Group by dayofyear
    doy_mean = train_da.groupby("time.dayofyear").mean(dim="time")
    doy_std = train_da.groupby("time.dayofyear").std(dim="time")
    
    # Fallback to temporal std if DOY has single observation (< 2 years in dataset)
    overall_std = train_da.std(dim="time")
    doy_std = xr.where(doy_std > 0.05, doy_std, overall_std)
    doy_std = np.maximum(doy_std, 0.1)
    
    # Ensure all 1..366 day-of-year indices exist even if train series is shorter than 1 year
    full_doy = np.arange(1, 367)
    doy_mean = doy_mean.reindex(dayofyear=full_doy).interpolate_na(dim="dayofyear", method="linear").bfill("dayofyear").ffill("dayofyear")
    doy_std = doy_std.reindex(dayofyear=full_doy).interpolate_na(dim="dayofyear", method="linear").bfill("dayofyear").ffill("dayofyear")
    
    # Pad circular boundary for smooth transition from DOY 365 to DOY 1
    half_w = window_days // 2
    doy_coords = doy_mean.dayofyear.values
    pad_before = doy_mean.sel(dayofyear=doy_coords[-half_w:])
    pad_before["dayofyear"] = doy_coords[:half_w] - half_w
    pad_after = doy_mean.sel(dayofyear=doy_coords[:half_w])
    pad_after["dayofyear"] = doy_coords[-1] + 1 + np.arange(half_w)
    
    extended_mean = xr.concat([pad_before, doy_mean, pad_after], dim="dayofyear")
    smoothed_mean = extended_mean.rolling(dayofyear=window_days, center=True, min_periods=1).mean()
    smoothed_mean = smoothed_mean.sel(dayofyear=slice(1, 366))
    
    # Do same for std
    extended_std = xr.concat([
        doy_std.sel(dayofyear=doy_coords[-half_w:]).assign_coords(dayofyear=doy_coords[:half_w] - half_w),
        doy_std,
        doy_std.sel(dayofyear=doy_coords[:half_w]).assign_coords(dayofyear=doy_coords[-1] + 1 + np.arange(half_w))
    ], dim="dayofyear")
    smoothed_std = extended_std.rolling(dayofyear=window_days, center=True, min_periods=1).mean()
    smoothed_std = smoothed_std.sel(dayofyear=slice(1, 366))
    
    # Avoid zero standard deviation
    smoothed_std = np.maximum(smoothed_std, 1e-4)
    return smoothed_mean, smoothed_std


def preprocess_dataset(
    config: Dict[str, Any],
    input_file: Optional[str] = None,
    output_dir: Optional[str] = None,
) -> Path:
    """Preprocess weather dataset into anomalies, z-scores, and time-based splits."""
    in_path = Path(input_file) if input_file else Path(config["data"]["sample_path"])
    out_dir = Path(output_dir) if output_dir else Path(config["data"]["processed_dir"])
    out_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Loading raw dataset from {in_path}...")
    with xr.open_dataset(in_path) as raw_d:
        ds = raw_d.load()
    
    # 1. Spatial subset verification
    bounds = config["data"]["spatial_bounds"]
    lat_min, lat_max = bounds["lat_min"], bounds["lat_max"]
    lon_min, lon_max = bounds["lon_min"], bounds["lon_max"]
    
    # Slice latitudes and longitudes
    ds = ds.sel(
        latitude=slice(lat_min, lat_max) if ds.latitude[0] < ds.latitude[-1] else slice(lat_max, lat_min),
        longitude=slice(lon_min, lon_max)
    )
    
    # Sort coordinates to ensure uniform ascending order
    ds = ds.sortby("latitude").sortby("longitude").sortby("time")
    
    # 2. Time-based split indices (STRICT time-split to prevent leakage)
    n_times = len(ds.time)
    train_frac = config["data"]["time_range"]["train_split"]
    val_frac = config["data"]["time_range"]["val_split"]
    
    n_train = int(n_times * train_frac)
    n_val = int(n_times * val_frac)
    
    train_slice = slice(0, n_train)
    val_slice = slice(n_train, n_train + n_val)
    test_slice = slice(n_train + n_val, n_times)
    
    train_dates = (str(ds.time.values[0].astype('datetime64[D]')), str(ds.time.values[n_train - 1].astype('datetime64[D]')))
    val_dates = (str(ds.time.values[n_train].astype('datetime64[D]')), str(ds.time.values[n_train + n_val - 1].astype('datetime64[D]')))
    test_dates = (str(ds.time.values[n_train + n_val].astype('datetime64[D]')), str(ds.time.values[-1].astype('datetime64[D]')))
    
    logger.info(f"Strict time-based split: Train={train_dates}, Val={val_dates}, Test={test_dates}")
    
    # Save split metadata
    split_meta = {
        "train": {"start": train_dates[0], "end": train_dates[1], "count": n_train, "slice": [0, n_train]},
        "val": {"start": val_dates[0], "end": val_dates[1], "count": n_val, "slice": [n_train, n_train + n_val]},
        "test": {"start": test_dates[0], "end": test_dates[1], "count": n_times - (n_train + n_val), "slice": [n_train + n_val, n_times]},
    }
    with open(out_dir / "time_splits.json", "w", encoding="utf-8") as f:
        json.dump(split_meta, f, indent=2)

    # 3. Compute climatology & z-scores using TRAINING SPLIT ONLY
    variables = config["data"]["variables"]
    processed_vars = {}
    norm_stats = {}
    
    for var in variables:
        if var not in ds:
            continue
            
        da = ds[var].ffill(dim="time").bfill(dim="time")
        train_da = da.isel(time=train_slice)
        
        # Compute smooth DOY climatology on train_da
        window_days = config["preprocessing"].get("climatology_window_days", 15)
        clim_mean, clim_std = compute_smoothed_climatology(train_da, window_days=window_days)
        
        # Map back to full time series by dayofyear
        time_doy = da["time.dayofyear"]
        full_clim_mean = clim_mean.sel(dayofyear=time_doy)
        full_clim_std = clim_std.sel(dayofyear=time_doy)
        
        # Compute anomaly and z-score
        anomaly = da - full_clim_mean.values
        zscore = anomaly / full_clim_std.values
        
        processed_vars[var] = da
        processed_vars[f"{var}_anomaly"] = (["time", "latitude", "longitude"], anomaly.values.astype(np.float32))
        processed_vars[f"{var}_zscore"] = (["time", "latitude", "longitude"], zscore.values.astype(np.float32))
        
        # Train-only min/max/mean/std for neural net normalization
        norm_stats[var] = {
            "train_mean": float(train_da.mean()),
            "train_std": float(train_da.std()),
            "train_min": float(train_da.min()),
            "train_max": float(train_da.max()),
            "zscore_mean": float(zscore.isel(time=train_slice).mean()),
            "zscore_std": float(zscore.isel(time=train_slice).std()),
        }

    # Retain ground truth label masks if present
    for label_var in ["label_heatwave", "label_rainfall", "label_cyclone"]:
        if label_var in ds:
            processed_vars[label_var] = ds[label_var]
            
    processed_ds = xr.Dataset(
        data_vars=processed_vars,
        coords=ds.coords,
        attrs={
            **ds.attrs,
            "preprocessing": "Climatology and Z-scores normalized strictly on training split (no leakage)",
        }
    )
    
    processed_file = out_dir / "processed_weather.nc"
    if processed_file.exists():
        try:
            processed_file.unlink()
        except Exception:
            pass
    processed_ds.to_netcdf(processed_file, format="NETCDF4", engine="netcdf4")
    logger.info(f"Processed dataset saved to {processed_file}")
    
    with open(out_dir / "norm_stats.json", "w", encoding="utf-8") as f:
        json.dump(norm_stats, f, indent=2)
    logger.info(f"Saved normalization stats to {out_dir / 'norm_stats.json'}")

    return processed_file


def create_sliding_windows(
    dataset_path: str | Path,
    variables: List[str],
    past_days: int = 7,
    lead_days: List[int] = [1, 2, 3],
    use_zscore: bool = True,
) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """Generate (X, Y) tensor sliding windows.
    
    Returns:
      X: shape (N, past_days, C, H, W)
      Y: shape (N, len(lead_days), C, H, W)
      dates: list of forecast start dates
    """
    with xr.open_dataset(dataset_path) as d:
        ds = d.load()
    var_keys = [f"{v}_zscore" if use_zscore else v for v in variables]
    
    # Stack channels into a single array (time, C, H, W)
    channel_arrays = [ds[k].values for k in var_keys]
    data = np.stack(channel_arrays, axis=1)  # (time, C, H, W)
    
    max_lead = max(lead_days)
    n_samples = data.shape[0] - past_days - max_lead + 1
    
    X = np.zeros((n_samples, past_days, data.shape[1], data.shape[2], data.shape[3]), dtype=np.float32)
    Y = np.zeros((n_samples, len(lead_days), data.shape[1], data.shape[2], data.shape[3]), dtype=np.float32)
    forecast_dates = []
    
    for i in range(n_samples):
        X[i] = data[i : i + past_days]
        forecast_dates.append(str(ds.time.values[i + past_days - 1].astype("datetime64[D]")))
        for lead_idx, lead in enumerate(lead_days):
            target_idx = i + past_days + lead - 1
            Y[i, lead_idx] = data[target_idx]
            
    return X, Y, forecast_dates


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preprocess weather data")
    parser.add_argument("--config", type=str, default=str(DEFAULT_CONFIG_PATH))
    parser.add_argument("--input", type=str, default=None)
    parser.add_argument("--output", type=str, default=None)
    args = parser.parse_args()

    cfg = load_config(args.config)
    preprocess_dataset(cfg, input_file=args.input, output_dir=args.output)
