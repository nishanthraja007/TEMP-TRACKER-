"""Cross-platform runner helper for Windows/Linux/Mac (mirrors Makefile)."""

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PYTHON = sys.executable


def run_cmd(cmd: str, cwd: Path = ROOT):
    print(f"\n[RUN] {cmd} (cwd: {cwd})")
    ret = subprocess.run(cmd, shell=True, cwd=cwd)
    if ret.returncode != 0:
        print(f"[ERROR] Command failed with exit code {ret.returncode}: {cmd}")
        sys.exit(ret.returncode)


TARGETS = {
    "data": f'"{PYTHON}" -m src.ingest --mode sample',
    "preprocess": f'"{PYTHON}" -m src.preprocess',
    "train_baseline": f'"{PYTHON}" -m src.anomaly.baseline',
    "train_iforest": f'"{PYTHON}" -m src.anomaly.iforest',
    "train_autoencoder": f'"{PYTHON}" -m src.anomaly.autoencoder',
    "train_unet": f'"{PYTHON}" -m src.anomaly.unet',
    "train": [
        f'"{PYTHON}" -m src.anomaly.baseline',
        f'"{PYTHON}" -m src.anomaly.iforest',
        f'"{PYTHON}" -m src.anomaly.autoencoder',
        f'"{PYTHON}" -m src.anomaly.unet',
    ],
    "track": f'"{PYTHON}" -m src.tracking.segment',
    "forecast": f'"{PYTHON}" -m src.forecast.train',
    "evaluate": f'"{PYTHON}" -m src.evaluate',
    "test": f'"{PYTHON}" -m pytest tests/ -v',
    "api": f'"{PYTHON}" -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload',
    "web": "npm run dev",
}


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "all"
    if target == "all":
        for t in ["data", "preprocess", "train", "track", "forecast", "evaluate"]:
            main_dispatch(t)
    else:
        main_dispatch(target)


def main_dispatch(target: str):
    if target not in TARGETS:
        print(f"Unknown target: {target}. Available: {list(TARGETS.keys()) + ['all']}")
        sys.exit(1)
    action = TARGETS[target]
    if isinstance(action, list):
        for sub_cmd in action:
            run_cmd(sub_cmd)
    elif target == "web":
        run_cmd(action, cwd=ROOT / "web")
    else:
        run_cmd(action)


if __name__ == "__main__":
    main()
