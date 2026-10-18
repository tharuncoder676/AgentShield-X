.PHONY: all data train-similarity train-anomaly train-intent train-stacker eval export test clean

PYTHON ?= python

all: data train-similarity train-anomaly train-intent train-stacker eval export test

data:
	$(PYTHON) -m ml.data.generators.generate_all

train-similarity:
	$(PYTHON) -m ml.detectors.similarity.train

train-anomaly:
	$(PYTHON) -m ml.detectors.anomaly.train

train-intent:
	$(PYTHON) -m ml.detectors.intent.train

train-stacker:
	$(PYTHON) -m ml.risk.train

eval:
	$(PYTHON) -m ml.eval.harness

export:
	$(PYTHON) -m ml.export.package_models

test:
	$(PYTHON) -m unittest discover -s ml/tests -p "test_*.py"

clean:
	rm -rf ml/data/processed ml/data/splits models/*/1.0.0
