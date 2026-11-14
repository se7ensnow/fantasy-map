.DEFAULT_GOAL := help

.PHONY: help env secrets-scan up up-full down stop build logs ps migrate reset test

help: ## Показать доступные команды
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

env: ## Создать .envs/*.env из шаблонов со случайными секретами (существующие не трогаются)
	@./scripts/init-env.sh

secrets-scan: ## Проверить репозиторий и историю на утёкшие секреты (gitleaks в Docker)
	docker run --rm -v "$(CURDIR):/repo" zricethezav/gitleaks:v8.18.4 detect --source /repo --config /repo/.gitleaks.toml --redact --verbose

up: env ## Запустить backend-стек (frontend — отдельно через Vite)
	docker compose up --build -d

up-full: env ## Запустить весь стек, включая frontend в NGINX на :8080
	docker compose --profile frontend up --build -d

down: ## Остановить стек и удалить контейнеры
	docker compose --profile frontend down

stop: ## Остановить стек, сохранив контейнеры
	docker compose --profile frontend stop

build: ## Собрать образы без запуска (включая frontend)
	docker compose --profile frontend build

logs: ## Смотреть логи всех сервисов
	docker compose --profile frontend logs -f --tail=100

ps: ## Показать статус контейнеров
	docker compose --profile frontend ps

migrate: ## Принудительно применить миграции
	docker compose run --rm user-service-migrations
	docker compose run --rm map-service-migrations

reset: ## Удалить контейнеры и все данные (volume'ы)
	docker compose --profile frontend down -v

test: ## Запустить unit-тесты локально (нужен Python 3.12 и зависимости сервисов)
	@for service in api_gateway map_service tile_service user_service; do \
		echo "== $$service"; \
		(cd "$$service" && python -m pytest "$${service}_tests" -v) || exit 1; \
	done
