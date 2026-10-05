"""Configuration loader and models for Extreme Weather Anomaly Tracking."""

from pathlib import Path
from typing import Any, Dict, List
import yaml


ROOT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG_PATH = ROOT_DIR / "configs" / "default.yaml"


def load_config(config_path: Path | str | None = None) -> Dict[str, Any]:
    """Load YAML configuration with defaults."""
    path = Path(config_path) if config_path else DEFAULT_CONFIG_PATH
    if not path.exists():
        raise FileNotFoundError(f"Configuration file not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    return cfg


def get_device(requested: str = "auto") -> str:
    """Return PyTorch device string ('cuda' or 'cpu')."""
    import torch

    if requested == "cuda" and torch.cuda.is_available():
        return "cuda"
    if requested == "auto" and torch.cuda.is_available():
        return "cuda"
    return "cpu"
