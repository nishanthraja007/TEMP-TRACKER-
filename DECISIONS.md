# Architecture & Implementation Decisions

This document records architectural, default, and implementation choices made during autonomous execution.

| Decision | Choice | Rationale |
|---|---|---|
| Python Environment | Python 3.12 (via uv) | Stable precompiled binary wheels for PyTorch, NetCDF4, SciPy, and xarray on Windows. |
| Default Run Mode | `sample` | Guarantees 100% autonomous zero-credential execution within 10 minutes on CPU. |
| Grid Resolution | 1.0° for sample, 0.25° for ERA5 | Fast training and tracking verification on CPU while keeping real coordinates over South Asia (5°-40°N, 60°-100°E). |
| Deep Learning Training | Small epochs (3-5 epochs) with early stopping | Optimal for fast convergence on synthetic grid while verifying model weights, checkpoints, and loss curves. |
| Frontend Framework | Vite + React 18 + TypeScript + Tailwind CSS | Fast compilation, strict type safety, smooth 60fps animations with GSAP and Three.js. |
| Mapping Engine | MapLibre GL JS | Open-source, high-performance WebGL vector/raster mapping without API token requirement. |
| 3D Globe Engine | Three.js via @react-three/fiber + @react-three/drei | Immersive real-time interactive 3D globe with dynamic anomaly hotspots and particle track trails. |
