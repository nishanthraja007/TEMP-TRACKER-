"""Synthetic weather dataset generator with realistic climatology and injected extreme events."""

import argparse
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Tuple
import numpy as np
import pandas as pd
import xarray as xr

from src.config import DEFAULT_CONFIG_PATH, load_config

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def generate_synthetic_dataset(
    config: Dict[str, Any],
    seed: int = 42,
    output_path: str | Path | None = None,
) -> Tuple[xr.Dataset, List[Dict[str, Any]]]:
    """Generate realistic gridded synthetic weather data for South Asia (5-40N, 60-100E).
    
    Variables generated:
      - t2m: 2-meter air temperature (K)
      - tp: Total precipitation (mm/day)
      - u10: 10m zonal wind (m/s)
      - v10: 10m meridional wind (m/s)
      - msl: Mean sea level pressure (Pa)
      - rh: Relative humidity (%)
      - label_heatwave: Binary ground-truth mask for heatwave events
      - label_rainfall: Binary ground-truth mask for extreme rainfall events
      - label_cyclone: Binary ground-truth mask for cyclone events
    """
    np.random.seed(seed)
    
    bounds = config["data"]["spatial_bounds"]
    res = config["data"]["resolution"]["sample"]
    n_days = config["data"]["time_range"]["sample_days"]
    
    lats = np.arange(bounds["lat_min"], bounds["lat_max"] + 1e-5, res)
    lons = np.arange(bounds["lon_min"], bounds["lon_max"] + 1e-5, res)
    dates = pd.date_range(start="2022-01-01", periods=n_days, freq="D")
    
    n_lat = len(lats)
    n_lon = len(lons)
    n_time = len(dates)
    
    logger.info(f"Generating synthetic grid: {n_time} days x {n_lat} lats x {n_lon} lons (res={res}°)")
    
    # 2D Meshgrids for spatial gradients
    lon_grid, lat_grid = np.meshgrid(lons, lats)
    
    # Pre-allocate 3D arrays (time, lat, lon)
    t2m = np.zeros((n_time, n_lat, n_lon), dtype=np.float32)
    tp = np.zeros((n_time, n_lat, n_lon), dtype=np.float32)
    u10 = np.zeros((n_time, n_lat, n_lon), dtype=np.float32)
    v10 = np.zeros((n_time, n_lat, n_lon), dtype=np.float32)
    msl = np.zeros((n_time, n_lat, n_lon), dtype=np.float32)
    rh = np.zeros((n_time, n_lat, n_lon), dtype=np.float32)
    
    mask_heatwave = np.zeros((n_time, n_lat, n_lon), dtype=np.int8)
    mask_rainfall = np.zeros((n_time, n_lat, n_lon), dtype=np.int8)
    mask_cyclone = np.zeros((n_time, n_lat, n_lon), dtype=np.int8)
    
    # Seasonal base patterns
    day_of_year = dates.dayofyear.values  # (n_time,)
    
    for t_idx in range(n_time):
        doy = day_of_year[t_idx]
        
        # Annual solar cycle (peaks in late May / early June, doy ~ 145)
        # Latitudinal gradient: north gets colder in winter, hotter in summer
        solar_phase = 2 * np.pi * (doy - 145) / 365.25
        summer_factor = 0.5 * (1.0 + np.cos(solar_phase))  # 1 in late May, 0 in Dec
        
        # Base Temperature (K): ~295K in south, 283-308K in north depending on season
        base_temp = 296.0 - 0.35 * (lat_grid - 15.0) + (10.0 + 0.25 * lat_grid) * (summer_factor - 0.5)
        # Continental heating in northwest India (lat 25-32, lon 68-78)
        nw_heat = 5.0 * summer_factor * np.exp(-(((lat_grid - 28) / 6.0) ** 2 + ((lon_grid - 72) / 6.0) ** 2))
        noise_temp = np.random.normal(0, 1.2, size=(n_lat, n_lon))
        t2m[t_idx] = base_temp + nw_heat + noise_temp
        
        # Monsoon precipitation cycle (peaks July-August, doy ~ 190 to 240)
        monsoon_phase = np.exp(-((doy - 215) / 45.0) ** 2)  # Gaussian summer monsoon envelope
        # Orographic & coastal rainfall hotspots (Western Ghats ~ lat 10-18, lon 73-76; Bay of Bengal / NE India)
        wg_rain = 25.0 * monsoon_phase * np.exp(-(((lat_grid - 14) / 5.0) ** 2 + ((lon_grid - 74) / 2.5) ** 2))
        ne_rain = 30.0 * monsoon_phase * np.exp(-(((lat_grid - 25) / 4.0) ** 2 + ((lon_grid - 90) / 4.0) ** 2))
        general_rain = np.maximum(0.0, np.random.exponential(scale=2.0 + 8.0 * monsoon_phase, size=(n_lat, n_lon)) - 3.0)
        tp[t_idx] = wg_rain + ne_rain + general_rain
        
        # Wind fields: Summer southwesterly (u10 > 0, v10 > 0), Winter northeasterly (u10 < 0, v10 < 0)
        monsoon_wind_u = 8.0 * monsoon_phase - 3.0 * (1.0 - monsoon_phase)
        monsoon_wind_v = 6.0 * monsoon_phase - 2.5 * (1.0 - monsoon_phase)
        u10[t_idx] = monsoon_wind_u + np.random.normal(0, 1.5, size=(n_lat, n_lon))
        v10[t_idx] = monsoon_wind_v + np.random.normal(0, 1.5, size=(n_lat, n_lon))
        
        # Mean Sea Level Pressure (Pa): Base ~ 101325 Pa, Monsoon trough drops to ~ 99800 Pa in north
        trough_drop = 1200.0 * monsoon_phase * np.exp(-(((lat_grid - 26) / 8.0) ** 2 + ((lon_grid - 82) / 10.0) ** 2))
        winter_high = 600.0 * (1.0 - monsoon_phase) * ((lat_grid - 20) / 20.0)
        msl[t_idx] = 101325.0 - trough_drop + winter_high + np.random.normal(0, 80.0, size=(n_lat, n_lon))
        
        # Relative Humidity (%): High during monsoon (70-90%), low in hot dry spring (25-45%)
        base_rh = 45.0 + 40.0 * monsoon_phase - 15.0 * (summer_factor * (1.0 - monsoon_phase))
        coastal_boost = 15.0 * np.exp(-((lon_grid - 85) / 12.0) ** 2)
        rh[t_idx] = np.clip(base_rh + coastal_boost + np.random.normal(0, 5.0, size=(n_lat, n_lon)), 15.0, 100.0)

    # Injected Ground Truth Extreme Events
    # Each event has: id, type, start_date, duration, initial_lat, initial_lon, vel_lat, vel_lon, radius, peak_intensity
    ground_truth_events = [
        # Year 1 Early Event
        {
            "id": "HW-2022-00",
            "type": "heatwave",
            "start_day": 30,
            "duration": 5,
            "init_lat": 22.0,
            "init_lon": 75.0,
            "dlat": 0.2,
            "dlon": 0.5,
            "radius_deg": 3.0,
            "peak_intensity": 6.5,
        },
        # Year 1 (2022) Events
        {
            "id": "HW-2022-01",
            "type": "heatwave",
            "start_day": 120,  # ~ May 1
            "duration": 6,
            "init_lat": 26.0,
            "init_lon": 72.0,
            "dlat": 0.4,
            "dlon": 0.8,
            "radius_deg": 3.5,
            "peak_intensity": 7.5, # +7.5K anomaly
        },
        {
            "id": "HW-2022-02",
            "type": "heatwave",
            "start_day": 155,  # ~ June 5
            "duration": 7,
            "init_lat": 28.0,
            "init_lon": 76.0,
            "dlat": -0.2,
            "dlon": 0.9,
            "radius_deg": 4.0,
            "peak_intensity": 8.5,
        },
        {
            "id": "RF-2022-01",
            "type": "rainfall",
            "start_day": 195,  # ~ July 15 (Monsoon depression)
            "duration": 5,
            "init_lat": 20.0,
            "init_lon": 87.0,
            "dlat": 0.6,
            "dlon": -1.8,
            "radius_deg": 3.0,
            "peak_intensity": 140.0, # +140 mm/day
        },
        {
            "id": "CY-2022-01",
            "type": "cyclone",
            "start_day": 310,  # ~ Nov 7 (Post-monsoon cyclone)
            "duration": 6,
            "init_lat": 12.0,
            "init_lon": 86.0,
            "dlat": 1.8,
            "dlon": -1.2,
            "radius_deg": 2.5,
            "peak_intensity": 160.0,
        },
        # Year 2 (2023) Events
        {
            "id": "HW-2023-01",
            "type": "heatwave",
            "start_day": 480,  # ~ April 26
            "duration": 8,
            "init_lat": 24.0,
            "init_lon": 74.0,
            "dlat": 0.3,
            "dlon": 0.7,
            "radius_deg": 4.2,
            "peak_intensity": 8.0,
        },
        {
            "id": "RF-2023-01",
            "type": "rainfall",
            "start_day": 560,  # ~ July 15
            "duration": 6,
            "init_lat": 19.0,
            "init_lon": 88.0,
            "dlat": 0.5,
            "dlon": -2.0,
            "radius_deg": 3.5,
            "peak_intensity": 150.0,
        },
        {
            "id": "CY-2023-01",
            "type": "cyclone",
            "start_day": 675,  # ~ Nov 7
            "duration": 5,
            "init_lat": 14.0,
            "init_lon": 68.0,
            "dlat": 1.6,
            "dlon": 0.6,
            "radius_deg": 2.5,
            "peak_intensity": 170.0,
        },
    ]

    event_records = []
    
    for ev in ground_truth_events:
        st_day = ev["start_day"]
        dur = ev["duration"]
        ev_type = ev["type"]
        ev_id = ev["id"]
        
        if st_day >= n_time:
            continue
            
        path = []
        history = []
        
        for step in range(dur):
            t_idx = st_day + step
            if t_idx >= n_time:
                break
                
            cur_lat = ev["init_lat"] + step * ev["dlat"]
            cur_lon = ev["init_lon"] + step * ev["dlon"]
            path.append([float(cur_lon), float(cur_lat)])
            
            # Growth & decay intensity envelope
            progress = (step + 0.5) / dur
            intensity_fac = np.sin(np.pi * progress)
            
            # Gaussian spatial footprint
            dist_sq = ((lat_grid - cur_lat) ** 2 + (lon_grid - cur_lon) ** 2)
            footprint = np.exp(-dist_sq / (2.0 * (ev["radius_deg"] / 2.0) ** 2))
            active_cells = footprint > 0.35
            
            curr_intensity = ev["peak_intensity"] * intensity_fac
            area_cells = int(np.sum(active_cells))
            # 1 deg grid cell is approx 111 km x 111 km * cos(lat) ~ 11,000 km^2
            area_km2 = float(area_cells * 111.0 * 111.0 * np.cos(np.radians(cur_lat)))
            
            velocity = float(np.sqrt((ev["dlat"] * 111.0)**2 + (ev["dlon"] * 111.0 * np.cos(np.radians(cur_lat)))**2))
            
            history.append({
                "date": str(dates[t_idx].date()),
                "latitude": round(float(cur_lat), 2),
                "longitude": round(float(cur_lon), 2),
                "area_km2": round(area_km2, 1),
                "intensity_anomaly": round(float(curr_intensity), 2),
                "velocity_km_day": round(velocity, 2),
            })
            
            if ev_type == "heatwave":
                t2m[t_idx] += curr_intensity * footprint
                rh[t_idx] = np.maximum(10.0, rh[t_idx] - 15.0 * footprint)
                mask_heatwave[t_idx, active_cells] = 1
            elif ev_type == "rainfall":
                tp[t_idx] += curr_intensity * footprint
                msl[t_idx] -= 1500.0 * footprint
                mask_rainfall[t_idx, active_cells] = 1
            elif ev_type == "cyclone":
                # Heavy rain + intense vortex winds + central pressure drop
                tp[t_idx] += curr_intensity * footprint
                msl[t_idx] -= 3200.0 * footprint
                # Cyclonic rotation: tangential wind = r_hat x z_hat
                d_lat = lat_grid - cur_lat
                d_lon = lon_grid - cur_lon
                v_tang = 30.0 * footprint
                u10[t_idx] -= v_tang * (d_lat / (np.sqrt(dist_sq) + 1e-3))
                v10[t_idx] += v_tang * (d_lon / (np.sqrt(dist_sq) + 1e-3))
                mask_cyclone[t_idx, active_cells] = 1

        event_records.append({
            "id": ev_id,
            "type": ev_type,
            "start_date": str(dates[st_day].date()),
            "end_date": str(dates[min(st_day + dur - 1, n_time - 1)].date()),
            "duration_days": len(history),
            "peak_intensity": ev["peak_intensity"],
            "max_area_km2": max([h["area_km2"] for h in history]) if history else 0,
            "mean_velocity_km_day": round(float(np.mean([h["velocity_km_day"] for h in history])), 2) if history else 0,
            "path": path,
            "history": history,
            "status": "dissipated",
        })

    # Create xarray Dataset
    ds = xr.Dataset(
        data_vars={
            "t2m": (["time", "latitude", "longitude"], t2m, {"units": "K", "long_name": "2m temperature"}),
            "tp": (["time", "latitude", "longitude"], tp, {"units": "mm/day", "long_name": "Total precipitation"}),
            "u10": (["time", "latitude", "longitude"], u10, {"units": "m/s", "long_name": "10m U wind component"}),
            "v10": (["time", "latitude", "longitude"], v10, {"units": "m/s", "long_name": "10m V wind component"}),
            "msl": (["time", "latitude", "longitude"], msl, {"units": "Pa", "long_name": "Mean sea level pressure"}),
            "rh": (["time", "latitude", "longitude"], rh, {"units": "%", "long_name": "Relative humidity"}),
            "label_heatwave": (["time", "latitude", "longitude"], mask_heatwave, {"long_name": "Heatwave ground truth mask"}),
            "label_rainfall": (["time", "latitude", "longitude"], mask_rainfall, {"long_name": "Rainfall ground truth mask"}),
            "label_cyclone": (["time", "latitude", "longitude"], mask_cyclone, {"long_name": "Cyclone ground truth mask"}),
        },
        coords={
            "time": dates,
            "latitude": lats,
            "longitude": lons,
        },
        attrs={
            "title": "AI Extreme Weather Tracking Synthetic Dataset (South Asia)",
            "institution": "Antigravity Weather ML Lab",
            "source": "Realistic physically-informed synthetic weather generator",
            "spatial_resolution": f"{res} degree",
        },
    )

    if output_path is not None:
        out_p = Path(output_path)
        out_p.parent.mkdir(parents=True, exist_ok=True)
        ds.to_netcdf(out_p, format="NETCDF4", engine="netcdf4")
        logger.info(f"Saved synthetic NetCDF dataset to: {out_p}")
        
        # Save ground truth events json for validation
        meta_p = out_p.parent / "ground_truth_events.json"
        with open(meta_p, "w", encoding="utf-8") as f:
            json.dump(event_records, f, indent=2)
        logger.info(f"Saved ground truth metadata to: {meta_p}")

    return ds, event_records


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic weather dataset")
    parser.add_argument("--config", type=str, default=str(DEFAULT_CONFIG_PATH))
    parser.add_argument("--output", type=str, default=None)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    cfg = load_config(args.config)
    target_output = args.output if args.output else cfg["data"]["sample_path"]
    generate_synthetic_dataset(cfg, seed=args.seed, output_path=target_output)
