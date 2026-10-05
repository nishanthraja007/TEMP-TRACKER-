.PHONY: setup data preprocess train track forecast evaluate api web test all clean

PYTHON := python
VENV := .venv

setup:
	uv pip install -r requirements.txt
	cd web && npm install

data:
	$(PYTHON) -m src.ingest --mode sample

preprocess:
	$(PYTHON) -m src.preprocess

train:
	$(PYTHON) -m src.anomaly.baseline
	$(PYTHON) -m src.anomaly.iforest
	$(PYTHON) -m src.anomaly.autoencoder
	$(PYTHON) -m src.anomaly.unet

track:
	$(PYTHON) -m src.tracking.segment

forecast:
	$(PYTHON) -m src.forecast.train

evaluate:
	$(PYTHON) -m src.evaluate

api:
	$(PYTHON) -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload

web:
	cd web && npm run dev

test:
	pytest tests/ -v

all: data preprocess train track forecast evaluate
