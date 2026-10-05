"""Kalman filter for trajectory smoothing and next-position forecasting using filterpy."""

from typing import List, Tuple
import numpy as np
from filterpy.kalman import KalmanFilter


def smooth_and_predict_track(
    path_coords: List[Tuple[float, float]],
    dt: float = 1.0,
    process_noise: float = 0.05,
    measurement_noise: float = 0.2,
    predict_steps: int = 1,
) -> Tuple[List[Tuple[float, float]], List[Tuple[float, float]]]:
    """Smooth (lat, lon) trajectory and predict future steps using a constant-velocity Kalman Filter.
    
    State: [lat, lon, v_lat, v_lon]^T
    Measurements: [lat, lon]^T
    
    Returns:
      smoothed_path: list of (lat, lon) smoothed coordinates
      predicted_future: list of (lat, lon) forecasted coordinates
    """
    if len(path_coords) == 0:
        return [], []
    if len(path_coords) == 1:
        return path_coords, [path_coords[0]] * predict_steps
        
    kf = KalmanFilter(dim_x=4, dim_z=2)
    
    # State transition matrix F (constant velocity model)
    kf.F = np.array([
        [1.0, 0.0, dt,  0.0],
        [0.0, 1.0, 0.0, dt ],
        [0.0, 0.0, 1.0, 0.0],
        [0.0, 0.0, 0.0, 1.0],
    ])
    
    # Measurement matrix H
    kf.H = np.array([
        [1.0, 0.0, 0.0, 0.0],
        [0.0, 1.0, 0.0, 0.0],
    ])
    
    # Initial state
    init_lat, init_lon = path_coords[0]
    sec_lat, sec_lon = path_coords[1]
    kf.x = np.array([init_lat, init_lon, (sec_lat - init_lat) / dt, (sec_lon - init_lon) / dt])
    
    # Covariance matrices
    kf.P *= 10.0
    kf.R = np.eye(2) * measurement_noise
    kf.Q = np.eye(4) * process_noise
    
    smoothed = []
    
    # Run filter forward
    for lat, lon in path_coords:
        kf.predict()
        kf.update(np.array([lat, lon]))
        smoothed.append((float(kf.x[0]), float(kf.x[1])))
        
    # Future prediction
    future = []
    curr_state = kf.x.copy()
    curr_P = kf.P.copy()
    
    for _ in range(predict_steps):
        kf.predict()
        future.append((float(kf.x[0]), float(kf.x[1])))
        
    # Restore filter state
    kf.x = curr_state
    kf.P = curr_P
    
    return smoothed, future
