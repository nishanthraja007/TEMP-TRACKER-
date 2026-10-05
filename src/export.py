"""Export utilities for GeoJSON, CSV, and raster tile layers."""

import json
from pathlib import Path
from typing import Any, Dict, List
import numpy as np
import xarray as xr


def anomaly_grid_to_geojson(
    lats: np.ndarray,
    lons: np.ndarray,
    anomalies: np.ndarray,
    zscores: np.ndarray,
    threshold: float = 1.5,
    event_type: str = "heatwave",
) -> Dict[str, Any]:
    """Convert 2D anomalous grid cells to a GeoJSON FeatureCollection of Point or Polygon features."""
    features = []
    res_lat = abs(float(lats[1] - lats[0])) if len(lats) > 1 else 1.0
    res_lon = abs(float(lons[1] - lons[0])) if len(lons) > 1 else 1.0
    
    half_lat = res_lat / 2.0
    half_lon = res_lon / 2.0
    
    rows, cols = np.where(zscores >= threshold)
    
    for r, c in zip(rows, cols):
        lat = float(lats[r])
        lon = float(lons[c])
        val = float(anomalies[r, c])
        z = float(zscores[r, c])
        
        # Grid cell bounding box polygon
        poly = [
            [
                [round(lon - half_lon, 3), round(lat - half_lat, 3)],
                [round(lon + half_lon, 3), round(lat - half_lat, 3)],
                [round(lon + half_lon, 3), round(lat + half_lat, 3)],
                [round(lon - half_lon, 3), round(lat + half_lat, 3)],
                [round(lon - half_lon, 3), round(lat - half_lat, 3)],
            ]
        ]
        
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": poly,
            },
            "properties": {
                "latitude": round(lat, 2),
                "longitude": round(lon, 2),
                "anomaly_value": round(val, 2),
                "zscore": round(z, 2),
                "event_type": event_type,
            },
        })
        
    return {
        "type": "FeatureCollection",
        "features": features,
    }
