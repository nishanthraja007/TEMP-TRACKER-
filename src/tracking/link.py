"""Spatio-temporal tracking: Hungarian bipartite matching with IoU and centroid distance, handling births, deaths, splits, and merges."""

from dataclasses import dataclass, field
import logging
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from scipy.optimize import linear_sum_assignment

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points on the earth in km."""
    r = 6371.0 # Earth radius in km
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    
    a = np.sin(dphi / 2.0) ** 2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlambda / 2.0) ** 2
    c = 2.0 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))
    return float(r * c)


@dataclass
class SegmentRegion:
    time_idx: int
    date: str
    region_id: int
    lat_centroid: float
    lon_centroid: float
    area_km2: float
    peak_intensity: float
    mean_intensity: float
    coords: List[Tuple[int, int]] # (lat_idx, lon_idx)
    mask_pixels: int
    event_type: str = "heatwave"


@dataclass
class Track:
    track_id: str
    event_type: str
    start_date: str
    end_date: str
    status: str = "active" # "active", "dissipated"
    regions: List[SegmentRegion] = field(default_factory=list)
    split_from: Optional[str] = None
    merged_into: Optional[str] = None

    @property
    def duration_days(self) -> int:
        return len(self.regions)

    @property
    def path(self) -> List[Tuple[float, float]]: # [lon, lat] for GeoJSON
        return [(r.lon_centroid, r.lat_centroid) for r in self.regions]

    @property
    def peak_intensity(self) -> float:
        return max([r.peak_intensity for r in self.regions]) if self.regions else 0.0

    @property
    def max_area_km2(self) -> float:
        return max([r.area_km2 for r in self.regions]) if self.regions else 0.0

    @property
    def mean_velocity_km_day(self) -> float:
        if len(self.regions) <= 1:
            return 0.0
        dists = []
        for i in range(1, len(self.regions)):
            r_prev, r_curr = self.regions[i - 1], self.regions[i]
            d = haversine_distance_km(r_prev.lat_centroid, r_prev.lon_centroid, r_curr.lat_centroid, r_curr.lon_centroid)
            dists.append(d)
        return float(np.mean(dists))


def compute_region_iou(r1: SegmentRegion, r2: SegmentRegion) -> float:
    """Compute IoU between two regions based on coordinate grid sets."""
    s1 = set(r1.coords)
    s2 = set(r2.coords)
    inter = len(s1.intersection(s2))
    union = len(s1.union(s2))
    return inter / union if union > 0 else 0.0


def link_regions_over_time(
    regions_by_time: Dict[int, List[SegmentRegion]],
    iou_weight: float = 0.5,
    distance_weight: float = 0.5,
    max_distance_km: float = 600.0,
    min_iou: float = 0.05,
    split_iou_thresh: float = 0.15,
) -> List[Track]:
    """Link segmented regions across time steps with Hungarian bipartite matching.
    
    Handles:
      - Normal propagation
      - Births (new tracks)
      - Deaths (tracks ending)
      - Splits (one track splitting into multiple child tracks)
      - Merges (multiple tracks combining into one)
    """
    sorted_times = sorted(regions_by_time.keys())
    if not sorted_times:
        return []
        
    all_tracks: List[Track] = []
    active_tracks: List[Track] = []
    track_counter = 1
    
    for t_idx in sorted_times:
        current_regions = regions_by_time[t_idx]
        
        if not active_tracks:
            # All current regions are new births
            for reg in current_regions:
                new_track = Track(
                    track_id=f"TRK-{reg.event_type.upper()[:2]}-{track_counter:04d}",
                    event_type=reg.event_type,
                    start_date=reg.date,
                    end_date=reg.date,
                    regions=[reg],
                )
                track_counter += 1
                active_tracks.append(new_track)
                all_tracks.append(new_track)
            continue
            
        if not current_regions:
            # All active tracks terminate (death)
            for trk in active_tracks:
                trk.status = "dissipated"
            active_tracks = []
            continue
            
        # Cost matrix computation between active_tracks and current_regions
        n_prev = len(active_tracks)
        n_curr = len(current_regions)
        cost_matrix = np.full((n_prev, n_curr), 1e6, dtype=np.float32)
        iou_matrix = np.zeros((n_prev, n_curr), dtype=np.float32)
        dist_matrix = np.zeros((n_prev, n_curr), dtype=np.float32)
        
        for i, trk in enumerate(active_tracks):
            prev_reg = trk.regions[-1]
            for j, curr_reg in enumerate(current_regions):
                if prev_reg.event_type != curr_reg.event_type:
                    continue # Disallow linking disparate event types
                    
                dist_km = haversine_distance_km(
                    prev_reg.lat_centroid, prev_reg.lon_centroid,
                    curr_reg.lat_centroid, curr_reg.lon_centroid
                )
                iou = compute_region_iou(prev_reg, curr_reg)
                iou_matrix[i, j] = iou
                dist_matrix[i, j] = dist_km
                
                # Check spatial reachability constraint
                if dist_km <= max_distance_km or iou >= min_iou:
                    # Normalized cost: lower distance and higher IoU -> lower cost
                    norm_dist = min(1.0, dist_km / max_distance_km)
                    norm_iou_cost = 1.0 - iou
                    cost = distance_weight * norm_dist + iou_weight * norm_iou_cost
                    cost_matrix[i, j] = cost
                    
        # Hungarian Algorithm
        row_ind, col_ind = linear_sum_assignment(cost_matrix)
        
        matched_tracks = set()
        matched_regions = set()
        
        # 1. Process 1-to-1 Matches
        for r_i, c_j in zip(row_ind, col_ind):
            if cost_matrix[r_i, c_j] < 1.0: # Valid match
                trk = active_tracks[r_i]
                reg = current_regions[c_j]
                trk.regions.append(reg)
                trk.end_date = reg.date
                matched_tracks.add(r_i)
                matched_regions.add(c_j)
                
        # 2. Split Detection: Unmatched current regions that overlap with an active track
        unmatched_curr = [j for j in range(n_curr) if j not in matched_regions]
        for c_j in unmatched_curr:
            reg = current_regions[c_j]
            # Check if this region overlaps significantly with any active track from previous timestep
            parent_track = None
            for r_i, trk in enumerate(active_tracks):
                if iou_matrix[r_i, c_j] >= split_iou_thresh or dist_matrix[r_i, c_j] < 200.0:
                    parent_track = trk
                    break
            
            # Create new split track or new birth track
            new_track = Track(
                track_id=f"TRK-{reg.event_type.upper()[:2]}-{track_counter:04d}",
                event_type=reg.event_type,
                start_date=reg.date,
                end_date=reg.date,
                regions=[reg],
                split_from=parent_track.track_id if parent_track else None,
            )
            track_counter += 1
            all_tracks.append(new_track)
            active_tracks.append(new_track)
            matched_regions.add(c_j)
            
        # 3. Merge Detection: Unmatched active tracks that merged into a matched current region
        unmatched_prev = [i for i in range(n_prev) if i not in matched_tracks]
        for r_i in unmatched_prev:
            trk = active_tracks[r_i]
            # Check if it merged into one of the matched current regions
            merged_into_id = None
            for c_j in matched_regions:
                if iou_matrix[r_i, c_j] >= split_iou_thresh or dist_matrix[r_i, c_j] < 200.0:
                    # Find which track currently has this region
                    target_reg = current_regions[c_j]
                    for t in active_tracks:
                        if t.regions and t.regions[-1] == target_reg:
                            merged_into_id = t.track_id
                            break
                    break
            
            trk.status = "dissipated"
            if merged_into_id:
                trk.merged_into = merged_into_id
                
        # Update active tracks: keep only those that have a region at this timestep
        active_tracks = [t for t in all_tracks if t.status == "active" and t.regions[-1].time_idx == t_idx]
        
    return all_tracks
