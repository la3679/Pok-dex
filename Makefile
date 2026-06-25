COMPOSE=docker compose

.PHONY: dev down reset logs seed seed-quick validate test build

dev:
	$(COMPOSE) up --build

down:
	$(COMPOSE) down

reset:
	$(COMPOSE) down -v

logs:
	$(COMPOSE) logs -f

seed:
	$(COMPOSE) run --rm seed

seed-quick:
	$(COMPOSE) run --rm seed python -m scripts.seed_database --skip-legacy --max-records 25

validate:
	$(COMPOSE) run --rm validate

test:
	$(COMPOSE) run --rm backend-test
	$(COMPOSE) run --rm frontend-test

build:
	$(COMPOSE) run --rm frontend-build
