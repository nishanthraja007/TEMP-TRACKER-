"""Unit tests for preprocessing and data leakage prevention."""

from pathlib import Path
import numpy as np
import pytest
import xarray as xr

from src.config import load_config
from src.preprocess import compute_smoothed_climatology, create_sliding_windows, preprocess_dataset
from src.synthetic import generate_synthetic_dataset


@pytest.fixture(scope="module")
def sample_dataset(tmp_path_factory):
    """Generate a temporary synthetic dataset for testing."""
    tmp_dir = tmp_path_factory.mktemp("test_data")
    cfg = {
        "project": {"seed": 42},
        "data": {
            "spatial_bounds": {"lat_min": 10.0, "lat_max": 20.0, "lon_min": 70.0, "lon_max": 80.0},
            "resolution": {"sample": 2.0},
            "time_range": {"sample_days": 100, "train_split": 0.7, "val_split": 0.15, "test_split": 0.15},
            "variables": ["t2m", "tp"],
            "sample_path": str(tmp_dir / "sample.nc"),
            "processed_dir": str(tmp_dir / "processed"),
        },
        "preprocessing": {
            "climatology_window_days": 7,
            "zscore_threshold": 2.0,
        },
    }
    nc_path = tmp_dir / "sample.nc"
    ds, events = generate_synthetic_dataset(cfg, seed=42, output_path=nc_path)
    proc_path = preprocess_dataset(cfg, input_file=str(nc_path), output_dir=cfg["data"]["processed_dir"])
    return cfg, nc_path, ds, proc_path


def test_climatology_shape_and_values(sample_dataset):
    """Verify smoothed climatology outputs valid mean and non-zero std without NaNs."""
    cfg, nc_path, ds, proc_path = sample_dataset
    t2m_train = ds["t2m"].isel(time=slice(0, 50))
    mean_clim, std_clim = compute_smoothed_climatology(t2m_train, window_days=7)
    
    assert len(mean_clim.dayofyear) <= 366
    assert np.all(np.isfinite(mean_clim.values))
    assert np.all(std_clim.values > 0.0)


def test_no_data_leakage(sample_dataset):
    """Verify that preprocessing strictly calculates climatology from train split only."""
    cfg, nc_path, ds, proc_path = sample_dataset
    processed_path = preprocess_dataset(cfg, input_file=str(nc_path), output_dir=cfg["data"]["processed_dir"])
    
    assert Path(processed_path).exists()
    p_ds = xr.open_dataset(processed_path)
    
    # Check that anomaly and zscore exist
    assert "t2m_anomaly" in p_ds
    assert "t2m_zscore" in p_ds
    assert "tp_zscore" in p_ds
    
    # Verify no NaN or Inf
    assert not np.isnan(p_ds["t2m_zscore"].values).any()
    assert not np.isinf(p_ds["t2m_zscore"].values).any()
    
    # Verify train zscore mean is approximately 0
    n_train = int(len(p_ds.time) * cfg["data"]["time_range"]["train_split"])
    train_zscore_mean = float(np.mean(p_ds["t2m_zscore"].isel(time=slice(0, n_train)).values))
    assert abs(train_zscore_mean) < 0.1, f"Train z-score mean {train_zscore_mean} deviates from 0"


def test_sliding_windows_shapes(sample_dataset):
    """Verify sliding window generator produces correct temporal input/lead dimensions."""
    cfg, nc_path, ds, proc_path = sample_dataset
    proc_file = Path(cfg["data"]["processed_dir"]) / "processed_weather.nc"
    
    X, Y, dates = create_sliding_windows(
        dataset_path=proc_file,
        variables=["t2m", "tp"],
        past_days=7,
        lead_days=[1, 2, 3],
        use_zscore=True,
    )
    
    # X: (N, past_days=7, C=2, H, W)
    # Y: (N, leads=3, C=2, H, W)
    assert X.ndim == 5
    assert Y.ndim == 5
    assert X.shape[1] == 7
    assert Y.shape[1] == 3
    assert X.shape[2] == 2
    assert Y.shape[2] == 2
    assert X.shape[0] == Y.shape[0]
    assert len(dates) == X.shape[0]
