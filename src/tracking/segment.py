"""Spatio-temporal segmentation (2D connected components and 3D DBSCAN) and tracking pipeline."""

import argparse
import csv
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Tuple
import numpy as np
from scipy import ndimage
from sklearn.cluster import DBSCAN
import xarray as xr

from src.config import DEFAULT_CONFIG_PATH, load_config
from src.tracking.kalman import smooth_and_predict_track
from src.tracking.link import SegmentRegion, Track, link_regions_over_time

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def segment_2d_slice(
    mask_slice: np.ndarray,
    lats: np.ndarray,
    lons: np.ndarray,
    time_idx: int,
    date_str: str,
    event_type: str,
    intensity_grid: np.ndarray,
    min_area_pixels: int = 4,
) -> List[SegmentRegion]:
    """Segment 2D anomalous mask slice into labeled connected components using scipy.ndimage."""
    labeled_array, num_features = ndimage.label(mask_slice)
    regions: List[SegmentRegion] = []
    
    for r_id in range(1, num_features + 1):
        cell_coords = np.argwhere(labeled_array == r_id)
        if len(cell_coords) < min_area_pixels:
            continue
            
        lat_indices = cell_coords[:, 0]
        lon_indices = cell_coords[:, 1]
        
        region_lats = lats[lat_indices]
        region_lons = lons[lon_indices]
        
        lat_centroid = float(np.mean(region_lats))
        lon_centroid = float(np.mean(region_lons))
        
        # Approximate area: cell width in km = 111 * cos(lat), height = 111 * res
        res_lat = abs(float(lats[1] - lats[0])) if len(lats) > 1 else 1.0
        res_lon = abs(float(lons[1] - lons[0])) if len(lons) > 1 else 1.0
        cell_areas = [
            (111.0 * res_lat) * (111.0 * res_lon * np.cos(np.radians(lat_val)))
            for lat_val in region_lats
        ]
        total_area_km2 = float(np.sum(cell_areas))
        
        intensities = intensity_grid[lat_indices, lon_indices]
        peak_intensity = float(np.max(intensities)) if len(intensities) > 0 else 0.0
        mean_intensity = float(np.mean(intensities)) if len(intensities) > 0 else 0.0
        
        coords_list = [(int(lat_idx), int(lon_idx)) for lat_idx, lon_idx in cell_coords]
        
        regions.append(SegmentRegion(
            time_idx=time_idx,
            date=date_str,
            region_id=r_id,
            lat_centroid=round(lat_centroid, 3),
            lon_centroid=round(lon_centroid, 3),
            area_km2=round(total_area_km2, 1),
            peak_intensity=round(peak_intensity, 2),
            mean_intensity=round(mean_intensity, 2),
            coords=coords_list,
            mask_pixels=len(cell_coords),
            event_type=event_type,
        ))
        
    return regions


def segment_3d_dbscan(
    masks_3d: np.ndarray,
    lats: np.ndarray,
    lons: np.ndarray,
    eps_km: float = 250.0,
    min_samples: int = 5,
) -> np.ndarray:
    """3D DBSCAN clustering over (lat, lon, time) manifold."""
    # Find all anomalous (t, lat_idx, lon_idx) voxels
    voxels = np.argwhere(masks_3d > 0)
    if len(voxels) == 0:
        return np.zeros_like(masks_3d, dtype=np.int32)
        
    t_coords = voxels[:, 0].astype(np.float32)
    lat_coords = lats[voxels[:, 1]].astype(np.float32)
    lon_coords = lons[voxels[:, 2]].astype(np.float32)
    
    # Scale coordinates to km equivalent: 1 deg lat ~ 111 km, 1 day velocity ~ 200 km
    lat_km = lat_coords * 111.0
    lon_km = lon_coords * 111.0 * np.cos(np.radians(20.0)) # average latitude cos
    time_km = t_coords * 150.0
    
    features = np.column_stack([lat_km, lon_km, time_km])
    
    clustering = DBSCAN(eps=eps_km, min_samples=min_samples).fit(features)
    labels = clustering.labels_
    
    labeled_volume = np.zeros_like(masks_3d, dtype=np.int32)
    for idx, (t, r, c) in enumerate(voxels):
        lbl = labels[idx]
        if lbl >= 0:
            labeled_volume[t, r, c] = lbl + 1
            
    return labeled_volume


def run_spatiotemporal_tracking(
    config: Dict[str, Any],
    mask_file: str | Path | None = None,
    output_dir: str | Path | None = None,
) -> Tuple[List[Track], Dict[str, Any]]:
    """Run end-to-end segmentation, linking, Kalman smoothing, and export."""
    out_dir = Path(output_dir) if output_dir else Path(config["data"]["results_dir"])
    out_dir.mkdir(parents=True, exist_ok=True)
    
    # Check which mask file to use (U-Net, IForest, or Baseline)
    if mask_file:
        m_path = Path(mask_file)
    elif (out_dir / "unet_masks.nc").exists():
        m_path = out_dir / "unet_masks.nc"
    elif (out_dir / "iforest_masks.nc").exists():
        m_path = out_dir / "iforest_masks.nc"
    else:
        m_path = out_dir / "baseline_masks.nc"
        
    logger.info(f"Loading anomaly masks from {m_path} for tracking...")
    mask_ds = xr.open_dataset(m_path)
    
    # Also open processed dataset to get temperature / precipitation intensity fields
    proc_ds = xr.open_dataset(Path(config["data"]["processed_dir"]) / "processed_weather.nc")
    
    lats = mask_ds.latitude.values
    lons = mask_ds.longitude.values
    time_vals = mask_ds.time.values
    n_times = len(time_vals)
    
    # Determine anomaly mask key
    if "unet_mask" in mask_ds:
        total_mask = mask_ds["unet_mask"].values
    elif "iforest_mask" in mask_ds:
        total_mask = mask_ds["iforest_mask"].values
    elif "baseline_anomaly_mask" in mask_ds:
        total_mask = mask_ds["baseline_anomaly_mask"].values
    else:
        var_keys = list(mask_ds.data_vars.keys())
        total_mask = mask_ds[var_keys[0]].values
        
    t2m_anom = proc_ds["t2m_anomaly"].values if "t2m_anomaly" in proc_ds else np.zeros_like(total_mask)
    tp_anom = proc_ds["tp_anomaly"].values if "tp_anomaly" in proc_ds else np.zeros_like(total_mask)
    
    # Segment each timestep
    regions_by_time: Dict[int, List[SegmentRegion]] = {}
    min_pixels = config["tracking"].get("min_area_pixels", 4)
    
    logger.info(f"Segmenting {n_times} time slices into connected components...")
    for t_idx in range(n_times):
        date_str = str(time_vals[t_idx].astype("datetime64[D]"))
        slice_mask = total_mask[t_idx]
        
        # Categorize region event type based on dominant anomaly (heatwave vs rainfall)
        t_anom_slice = t2m_anom[t_idx]
        tp_anom_slice = tp_anom[t_idx]
        
        # Heatwave regions
        heat_mask = slice_mask & (t_anom_slice >= 2.0)
        heat_regions = segment_2d_slice(
            heat_mask, lats, lons, t_idx, date_str, "heatwave", t_anom_slice, min_area_pixels=min_pixels
        )
        
        # Rainfall / Cyclone regions
        rain_mask = slice_mask & (tp_anom_slice >= 10.0)
        rain_regions = segment_2d_slice(
            rain_mask, lats, lons, t_idx, date_str, "rainfall", tp_anom_slice, min_area_pixels=min_pixels
        )
        
        regions_by_time[t_idx] = heat_regions + rain_regions
        
    # Link segmented regions across time
    logger.info("Linking components across time with Hungarian bipartite matching...")
    iou_thresh = config["tracking"].get("iou_threshold", 0.15)
    max_dist = config["tracking"].get("max_centroid_distance_km", 600.0)
    
    tracks = link_regions_over_time(
        regions_by_time=regions_by_time,
        iou_weight=0.5,
        distance_weight=0.5,
        max_distance_km=max_dist,
        min_iou=iou_thresh,
    )
    
    # Filter by minimum duration
    min_duration = config["tracking"].get("min_duration_days", 2)
    valid_tracks = [trk for trk in tracks if trk.duration_days >= min_duration]
    logger.info(f"Discovered {len(valid_tracks)} persistent extreme weather tracks (duration >= {min_duration} days)")
    
    # Apply Kalman filter smoothing and next-position forecasting
    geojson_features = []
    csv_rows = []
    
    for trk in valid_tracks:
        raw_coords = [(r.lat_centroid, r.lon_centroid) for r in trk.regions]
        smoothed_coords, forecast_coords = smooth_and_predict_track(raw_coords, predict_steps=2)
        
        # Format track history
        history = []
        for i, reg in enumerate(trk.regions):
            sm_lat, sm_lon = smoothed_coords[i]
            vel = 0.0
            if i > 0:
                from src.tracking.link import haversine_distance_km
                vel = round(haversine_distance_km(smoothed_coords[i-1][0], smoothed_coords[i-1][1], sm_lat, sm_lon), 1)
            history.append({
                "date": reg.date,
                "latitude": round(sm_lat, 2),
                "longitude": round(sm_lon, 2),
                "area_km2": reg.area_km2,
                "intensity_anomaly": reg.peak_intensity,
                "velocity_km_day": vel,
            })
            
        path_lon_lat = [[round(pt[1], 2), round(pt[0], 2)] for pt in smoothed_coords]
        
        # GeoJSON Feature
        feature = {
            "type": "Feature",
            "properties": {
                "id": trk.track_id,
                "type": trk.event_type,
                "start_date": trk.start_date,
                "end_date": trk.end_date,
                "duration_days": trk.duration_days,
                "peak_intensity": trk.peak_intensity,
                "max_area_km2": trk.max_area_km2,
                "mean_velocity_km_day": round(trk.mean_velocity_km_day, 1),
                "status": trk.status,
                "split_from": trk.split_from,
                "merged_into": trk.merged_into,
                "forecast_path": [[round(pt[1], 2), round(pt[0], 2)] for pt in forecast_coords],
                "history": history,
            },
            "geometry": {
                "type": "LineString",
                "coordinates": path_lon_lat,
            },
        }
        geojson_features.append(feature)
        
        # CSV Row
        csv_rows.append({
            "track_id": trk.track_id,
            "event_type": trk.event_type,
            "start_date": trk.start_date,
            "end_date": trk.end_date,
            "duration_days": trk.duration_days,
            "peak_intensity": trk.peak_intensity,
            "max_area_km2": trk.max_area_km2,
            "mean_velocity_km_day": round(trk.mean_velocity_km_day, 1),
            "status": trk.status,
            "split_from": trk.split_from or "none",
            "merged_into": trk.merged_into or "none",
        })
        
    # Export GeoJSON
    geojson_data = {
        "type": "FeatureCollection",
        "features": geojson_features,
    }
    geojson_path = out_dir / "tracks.geojson"
    with open(geojson_path, "w", encoding="utf-8") as f:
        json.dump(geojson_data, f, indent=2)
    logger.info(f"Exported tracks GeoJSON to {geojson_path}")
    
    # Export CSV
    csv_path = out_dir / "tracks.csv"
    if csv_rows:
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=list(csv_rows[0].keys()))
            writer.writeheader()
            writer.writerows(csv_rows)
    logger.info(f"Exported tracks CSV to {csv_path}")
    
    return valid_tracks, geojson_data


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Spatio-Temporal Tracking")
    parser.add_argument("--config", type=str, default=str(DEFAULT_CONFIG_PATH))
    parser.add_argument("--mask", type=str, default=None)
    parser.add_argument("--output", type=str, default=None)
    args = parser.parse_args()

    cfg = load_config(args.config)
    run_spatiotemporal_tracking(cfg, mask_file=args.mask, output_dir=args.output)
