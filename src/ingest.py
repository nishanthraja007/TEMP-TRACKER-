"""Weather data ingestion pipeline supporting synthetic generator and Copernicus CDS ERA5."""

import argparse
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import xarray as xr

from src.config import DEFAULT_CONFIG_PATH, load_config
from src.synthetic import generate_synthetic_dataset

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def ingest_synthetic(config: Dict[str, Any], output_path: Optional[str] = None) -> Path:
    """Generate or retrieve synthetic weather dataset."""
    target = Path(output_path) if output_path else Path(config["data"]["sample_path"])
    target.parent.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Generating synthetic dataset at {target}...")
    ds, _ = generate_synthetic_dataset(config, seed=config.get("project", {}).get("seed", 42), output_path=target)
    logger.info(f"Synthetic dataset generation complete: {ds.sizes}")
    return target


def ingest_era5(
    config: Dict[str, Any],
    years: List[int],
    output_dir: Optional[str] = None,
) -> Path:
    """Fetch ERA5 reanalysis data using cdsapi.
    
    If cdsapi credentials are not configured, logs a helpful instruction and falls back cleanly.
    """
    out_dir = Path(output_dir) if output_dir else Path(config["data"]["raw_dir"])
    out_dir.mkdir(parents=True, exist_ok=True)
    
    bounds = config["data"]["spatial_bounds"]
    # North, West, South, East for CDS format: [North, West, South, East]
    area = [bounds["lat_max"], bounds["lon_min"], bounds["lat_min"], bounds["lon_max"]]
    
    try:
        import cdsapi
        client = cdsapi.Client()
        logger.info(f"Requesting ERA5 reanalysis data for years {years} over region {area}...")
        
        for yr in years:
            target_file = out_dir / f"era5_southasia_{yr}.nc"
            if target_file.exists():
                logger.info(f"File {target_file} already exists, skipping.")
                continue
                
            request_params = {
                "product_type": "reanalysis",
                "format": "netcdf",
                "variable": [
                    "2m_temperature",
                    "total_precipitation",
                    "10m_u_component_of_wind",
                    "10m_v_component_of_wind",
                    "mean_sea_level_pressure",
                    "relative_humidity",
                ],
                "year": str(yr),
                "month": [f"{m:02d}" for m in range(1, 13)],
                "day": [f"{d:02d}" for d in range(1, 32)],
                "time": "12:00",
                "area": area,
            }
            logger.info(f"Submitting CDS request for year {yr}...")
            client.retrieve("reanalysis-era5-single-levels", request_params, str(target_file))
            logger.info(f"Downloaded {target_file}")
            
        return out_dir
        
    except Exception as exc:
        logger.warning(
            f"CDS API download failed or credentials not found ({exc}). "
            "Please ensure ~/.cdsapirc or CDSAPI_URL/CDSAPI_KEY are configured. "
            "Falling back to synthetic data mode."
        )
        return ingest_synthetic(config)


def run_ingest(
    mode: str = "sample",
    years: Optional[List[int]] = None,
    config_path: Optional[str] = None,
    output: Optional[str] = None,
) -> Path:
    """Entrypoint for data ingestion."""
    cfg = load_config(config_path)
    if mode == "era5":
        target_years = years if years else [2022, 2023]
        return ingest_era5(cfg, target_years, output_dir=output)
    else:
        return ingest_synthetic(cfg, output_path=output)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest weather data (sample or ERA5)")
    parser.add_argument("--mode", choices=["sample", "era5"], default="sample")
    parser.add_argument("--years", nargs="+", type=int, default=[2022, 2023])
    parser.add_argument("--config", type=str, default=str(DEFAULT_CONFIG_PATH))
    parser.add_argument("--output", type=str, default=None)
    args = parser.parse_args()

    run_ingest(mode=args.mode, years=args.years, config_path=args.config, output=args.output)
