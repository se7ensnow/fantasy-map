# Деплой Fantasy Maps

## Кратко

| Сценарий | Рекомендуемый способ |
| --- | --- |
| Локальная разработка, демо, проверка проекта | **Docker Compose** |
| Production на одном сервере (MVP) | Docker Compose + reverse proxy с TLS (Caddy/NGINX) |
| Production с несколькими узлами, HA и автоскейлингом | Kubernetes, но только после доработки манифестов |

Для текущего состояния проекта Docker Compose — основной и единственный полностью
готовый способ локального запуска. Kubernetes-манифесты в `k8s/local` — черновые
и не обеспечивают паритет с compose (см. раздел «Kubernetes»).

## Состав локального стека

| Компонент | Порт на хосте | Назначение |
| --- | --- | --- |
| `frontend` | `8080` | production-сборка React в NGINX (профиль `frontend`) |
| `api-gateway` | `8000` | единая точка входа REST API |
| `user-service` | `8001` | пользователи и аутентификация |
| `map-service` | `8002` | карты, локации, теги |
| `tile-service` | — | фоновый RQ-воркер генерации тайлов |
| `user-db` | `5433` | PostgreSQL пользователей |
| `map-db` | `5434` | PostgreSQL карт |
| `redis` | `6379` | очередь RQ |
| `minio` | `9000` / `9001` | S3-хранилище и консоль |
| `minio-init` | — | создание bucket `fantasy-maps` |

Порты задаются в корневом `.env` (см. `.env.example`) и имеют значения по умолчанию,
поэтому для стандартного запуска создавать `.env` не обязательно.

## Локальный запуск

Требуется только Docker с Compose v2 (Docker Desktop, OrbStack, Colima и т.п.).
Node.js нужен для frontend в режиме разработки (Vite).

```bash
# 1. Создать .env и .envs/*.env из шаблонов (пароли и ключи генерируются случайно)
make env

# 2. (необязательно) посмотреть/поправить значения в .envs/*.env — они не в git

# 3. Собрать и запустить backend + инфраструктуру
make up

# 4. Запустить frontend с hot reload (в отдельном терминале)
cd frontend && npm install && npm run dev

# 5. Проверить статус и healthcheck'и
make ps
```

После запуска:

* frontend в режиме разработки — <http://localhost:5173> (Vite);
* API — <http://localhost:8000>, healthcheck — <http://localhost:8000/health>;
* MinIO Console — <http://localhost:9001>.

Frontend в Docker (NGINX на <http://localhost:8080>) запускается отдельно:

```bash
make up-full
```

Миграции Alembic выполняются автоматически одноразовыми сервисами
`user-service-migrations` и `map-service-migrations`:

1. поднимается PostgreSQL;
2. job применяет `alembic upgrade head`;
3. только после успешных миграций стартует соответствующий сервис.

Если нужно применить миграции повторно (например, после обновления кода):

```bash
make migrate
```

Остановка:

```bash
make down     # остановить и удалить контейнеры, данные сохраняются
make reset    # удалить контейнеры и volume'ы со всеми данными
```

### Frontend в режиме разработки

Frontend запускается отдельно через Vite — это основной режим разработки:
изменения в коде сразу видны в браузере без пересборки Docker-образа.

```bash
make up
cd frontend
npm install
npm run dev
```

Vite будет доступен на <http://localhost:5173>. В `.envs/api-gateway.env`
`FRONTEND_URL` уже содержит оба origin'а (`5173` и `8080`), поэтому CORS работает
в обоих режимах. Для frontend вне Docker создайте `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_STORAGE_URL=http://localhost:9000/fantasy-maps
```

### Frontend в Docker

```bash
make up-full
# или: docker compose --profile frontend up --build -d
```

Адреса API и хранилища передаются в сборку как build args
(`VITE_API_URL`, `VITE_STORAGE_URL`). По умолчанию они относительные
(`/api`, `/storage/fantasy-maps`): NGINX проксирует `/api` в `api-gateway`, а
`/storage` в MinIO, поэтому сайт работает с любого устройства сети
(например, `http://<IP-мака>:8080` с телефона), CORS не нужен.
Если API/хранилище вынесены на другой домен, задайте абсолютные URL — они попадают
в JS-бандл, поэтому должны быть доступны **из браузера**:

```bash
VITE_API_URL=https://api.example.com/api \
VITE_STORAGE_URL=https://storage.example.com/fantasy-maps \
make up-full
```

### Особенности Apple Silicon

`tile-service` использует `pillow-simd`, для которого нет arm64-колёс, поэтому
образ собирается под `linux/amd64` и работает через эмуляцию. Это медленнее, но
предсказуемо. Платформа задаётся переменной `TILE_SERVICE_PLATFORM` в `.env`.

### Частые проблемы

| Симптом | Причина / решение |
| --- | --- |
| `env file ./.envs/*.env not found` | Выполните `make env` |
| Сервис постоянно перезапускается | `make logs`; чаще всего пустой/неверный `.envs/*.env` |
| `port is already allocated` | Измените порт в `.env` или остановите конфликтующий процесс |
| `401 UNAUTHORIZED` при pull MinIO | Официальные образы требуют авторизации; оставьте зеркала по умолчанию или задайте `MINIO_IMAGE`/`MINIO_MC_IMAGE` |
| Frontend не видит API | Проверьте `VITE_API_URL` на момент сборки: значение зашивается в бандл |
| 404 на `/maps/...` вместо `/api/maps/...` | `VITE_API_URL` должен включать префикс `/api` |
| Ошибки миграций | `make logs`; проверьте `DATABASE_URL` в `.envs/*-service.env` |
| `Environment variable SECRET_KEY is required` | `user-service` не стартует без ключа: выполните `make env` (или задайте `SECRET_KEY` в `.envs/user-service.env`) |
| `password authentication failed` после пересоздания `.envs/*.env` | Пароль PostgreSQL применяется только при первой инициализации volume. Либо верните старый пароль, либо `make reset` (удалит данные) и `make env` |

## Секреты

Принцип: **в git лежат только шаблоны, реальные значения — вне репозитория.**

| Что | Где хранится | В git |
| --- | --- | --- |
| Порты, адреса, build args frontend | корневой `.env` | нет (шаблон `.env.example` — да) |
| Пароли БД, `SECRET_KEY`, ключи MinIO | `.envs/*.env` | нет (шаблоны `*.env.example` — да) |
| Kubernetes Secret'ы | `k8s/secrets-local/` → `k8s/scripts/apply-local-secrets.sh` | нет |

`VITE_*` переменные не секреты: они вшиваются в JS-бандл и видны любому
посетителю. Ключи и пароли в них класть нельзя.

### Локальная разработка

`make env` берёт шаблоны `.envs/*.env.example`, заменяет плейсхолдеры `@@NAME@@`
случайными значениями (`openssl rand -hex 24`) и сохраняет файлы с правами `600`.
Одно имя плейсхолдера получает одно значение во всех файлах: пароль БД совпадает
в `user-db.env` и в `DATABASE_URL` сервиса. Уже существующие файлы не
перезаписываются, а новые файлы подхватывают пароль из существующего.

### Production

Не копируйте `.envs/*.env` из репозитория и не используйте значения из шаблонов.
Варианты по возрастанию надёжности:

1. файлы `.envs/*.env` на сервере, созданные вручную или менеджером конфигурации
   (права `600`, владелец — пользователь, запускающий compose);
2. переменные окружения или секреты CI/CD (GitHub Actions secrets и т.п.);
3. Kubernetes Secret'ы, лучше с внешним менеджером секретов (Vault, Doppler,
   облачные Secret Manager, SOPS).

Для production задайте отдельные значения всех секретов и не открывайте порты баз
данных, Redis и MinIO наружу (в `docker-compose.yml` они публикуются на хост для
удобства локальной разработки).

### Защита от случайной утечки

* `.gitignore` исключает `.env`, `.envs/*` (кроме `*.env.example`) и `k8s/secrets-local/`.
* `.dockerignore` сервисов исключает `*.env` из образов.
* `gitleaks` проверяет репозиторий в CI (`.github/workflows/secret-scan.yml`), в
  pre-commit (`.pre-commit-config.yaml`) и вручную: `make secrets-scan`. Правила
  и исключения для шаблонов — в `.gitleaks.toml`.
* Если секрет всё же попал в коммит, считайте его скомпрометированным:
  **смените значение** (удаления файла недостаточно, оно остаётся в истории) и при
  необходимости почистите историю (`git filter-repo`).

## Docker Compose или Kubernetes

### Почему Compose для локального запуска

* один файл и одна команда поднимают backend и инфраструктуру;
* не нужен кластер, Ingress Controller и отдельный registry;
* проще отлаживать: `docker compose logs`, `exec`, локальные volume'ы;
* ниже накладные расходы CPU/RAM — важно для машины разработчика;
* build args, секреты через env-файлы и healthcheck'и уже настроены.

### Когда оправдан Kubernetes

* несколько окружений и команд, нужен единый деплой-пайплайн;
* требуется горизонтальное масштабирование сервисов;
* нужны самовосстановление, rolling update, resource limits/quota;
* уже есть кластер и экспертиза, есть managed PostgreSQL/S3;
* нужны сетевые политики, RBAC, централизованные секреты.

### Текущее состояние Kubernetes

Манифесты в `k8s/local` позволяют запустить часть стека, но не являются заменой
compose:

* нет манифестов MinIO и job инициализации bucket — предполагается внешний S3;
* образы `fantasy-maps-*:local` нужно собрать и загрузить в кластер вручную;
* frontend собирается без `VITE_API_URL`/`VITE_STORAGE_URL`;
* порядок миграций и ретраи job'ов не связаны с готовностью Deployment'ов;
* секреты создаются скриптом из `k8s/secrets-local`, примеры лежат отдельно.

Поэтому для локальной разработки и демонстрации используйте Docker Compose. Если
Kubernetes всё же нужен, начните с `k8s/local`, добавьте MinIO (или внешний S3),
скрипт сборки/загрузки образов и проверку `kubectl rollout status` для миграций.

## Ответственные файлы

| Файл | За что отвечает |
| --- | --- |
| `docker-compose.yml` | локальный стек, healthcheck'и, порядок запуска |
| `.env.example` | порты и build args frontend для compose |
| `.envs/*.env.example` | шаблоны переменных окружения сервисов (с плейсхолдерами `@@NAME@@`) |
| `scripts/init-env.sh` | генерирует `.envs/*.env` со случайными секретами (`make env`) |
| `.gitleaks.toml`, `.pre-commit-config.yaml` | поиск секретов в коммитах |
| `.github/workflows/secret-scan.yml` | проверка секретов в CI |
| `Makefile` | команды `env/secrets-scan/up/down/logs/migrate/reset` |
| `*/Dockerfile` | сборка образов сервисов |
| `*/\.dockerignore` | исключение тестов, кэша и секретов из build context |
| `k8s/` | черновые Kubernetes-манифесты |
