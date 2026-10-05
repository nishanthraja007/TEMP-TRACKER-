"""Pydantic request and response schemas for the Extreme Weather API."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    service: str = "Extreme Weather Anomaly Tracking API"
    device: str = "cpu"


class AnomalyPoint(BaseModel):
    latitude: float
    longitude: float
    value: float
    zscore: float
    type: str


class AnomalyMapResponse(BaseModel):
    date: str
    variable: str
    anomaly_type: str
    bounds: Dict[str, float]
    resolution_deg: float
    count: int
    anomalies: List[AnomalyPoint]
    geojson: Dict[str, Any]


class TrackPointSchema(BaseModel):
    date: str
    latitude: float
    longitude: float
    area_km2: float
    intensity_anomaly: float
    velocity_km_day: float


class TrackSummary(BaseModel):
    id: str
    type: str
    start_date: str
    end_date: str
    duration_days: int
    peak_intensity: float
    max_area_km2: float
    mean_velocity_km_day: float
    status: str
    split_from: Optional[str] = None
    merged_into: Optional[str] = None
    path: List[List[float]] # [[lon, lat], ...]


class TrackDetail(TrackSummary):
    forecast_path: List[List[float]] = []
    history: List[TrackPointSchema]


class ForecastMetricsSchema(BaseModel):
    rmse: float
    acc: float
    csi: float
    pod: float
    far: float


class ForecastResponse(BaseModel):
    forecast_date: str
    target_date: str
    lead_days: int
    variable: str
    metrics: ForecastMetricsSchema
    predicted_anomalies: List[AnomalyPoint]
    actual_anomalies: List[AnomalyPoint]


class MetricsResponse(BaseModel):
    detection: Dict[str, Any]
    tracking: Dict[str, Any]
    forecasting: Dict[str, Any]
    ablation: List[Dict[str, Any]]
