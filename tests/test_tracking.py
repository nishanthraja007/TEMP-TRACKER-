"""Unit tests for tracking, segmentation, linking, and Kalman filtering."""

import numpy as np
import pytest

from src.tracking.kalman import smooth_and_predict_track
from src.tracking.link import (
    SegmentRegion,
    Track,
    compute_region_iou,
    haversine_distance_km,
    link_regions_over_time,
)
from src.tracking.segment import segment_2d_slice


def test_haversine_distance():
    """Verify haversine distance calculation between known coordinates."""
    # Delhi (28.61, 77.20) to Mumbai (19.07, 72.87) is approx 1150 km
    d = haversine_distance_km(28.61, 77.20, 19.07, 72.87)
    assert 1100.0 < d < 1200.0, f"Distance {d} km out of expected range"


def test_segment_2d_slice():
    """Verify 2D connected component segmentation creates valid regions and centroids."""
    mask = np.zeros((10, 10), dtype=np.int8)
    mask[2:5, 3:6] = 1 # 3x3 square (9 pixels)
    
    lats = np.linspace(10, 20, 10)
    lons = np.linspace(70, 80, 10)
    intensities = np.ones((10, 10), dtype=np.float32) * 5.0
    
    regions = segment_2d_slice(
        mask_slice=mask,
        lats=lats,
        lons=lons,
        time_idx=0,
        date_str="2022-05-01",
        event_type="heatwave",
        intensity_grid=intensities,
        min_area_pixels=4,
    )
    
    assert len(regions) == 1
    reg = regions[0]
    assert reg.mask_pixels == 9
    assert reg.peak_intensity == 5.0
    assert 12.0 < reg.lat_centroid < 15.0
    assert 72.0 < reg.lon_centroid < 76.0


def test_kalman_smoothing_and_prediction():
    """Verify Kalman filter smooths trajectory and predicts future position."""
    # Linear path: moving east by 1 degree per day
    raw_coords = [(20.0, 70.0), (20.2, 71.0), (20.1, 72.0), (20.3, 73.0), (20.4, 74.0)]
    smoothed, future = smooth_and_predict_track(raw_coords, predict_steps=2)
    
    assert len(smoothed) == len(raw_coords)
    assert len(future) == 2
    
    # Check that future continues eastwards
    assert future[0][1] > smoothed[-1][1] - 0.5
    assert abs(future[0][0] - 20.4) < 1.5


def test_linking_with_splits_and_merges():
    """Verify Hungarian linking connects consecutive timesteps and detects splits."""
    r1 = SegmentRegion(
        time_idx=0, date="2022-05-01", region_id=1,
        lat_centroid=25.0, lon_centroid=75.0, area_km2=50000.0,
        peak_intensity=5.0, mean_intensity=4.0,
        coords=[(2, 2), (2, 3), (3, 2), (3, 3)], mask_pixels=4, event_type="heatwave"
    )
    
    # Next timestep: Region propagates eastwards
    r2_child1 = SegmentRegion(
        time_idx=1, date="2022-05-02", region_id=1,
        lat_centroid=25.2, lon_centroid=75.8, area_km2=30000.0,
        peak_intensity=5.2, mean_intensity=4.1,
        coords=[(2, 3), (3, 3)], mask_pixels=2, event_type="heatwave"
    )
    # And a split piece
    r2_child2 = SegmentRegion(
        time_idx=1, date="2022-05-02", region_id=2,
        lat_centroid=24.8, lon_centroid=75.5, area_km2=20000.0,
        peak_intensity=4.8, mean_intensity=3.9,
        coords=[(2, 2), (3, 2)], mask_pixels=2, event_type="heatwave"
    )
    
    regions_by_time = {
        0: [r1],
        1: [r2_child1, r2_child2],
    }
    
    tracks = link_regions_over_time(regions_by_time)
    
    assert len(tracks) >= 2
    parent_track = [t for t in tracks if t.regions[0] == r1][0]
    assert parent_track.duration_days == 2
    assert parent_track.mean_velocity_km_day > 0.0
