# Fantasy Maps

**Fantasy Maps** — веб-платформа для публикации и просмотра интерактивных карт вымышленных миров.

Проект позволяет пользователям загружать изображения карт, автоматически нарезать их на тайлы, добавлять интерактивные локации с описаниями, публиковать карты в каталоге, использовать поиск, теги и настройки доступа.

## Основные возможности

* регистрация и аутентификация пользователей;
* создание, редактирование и удаление карт;
* загрузка исходного изображения карты;
* асинхронная генерация тайлов для интерактивного отображения;
* просмотр карты с масштабированием и перемещением;
* добавление, редактирование и удаление локаций;
* Markdown-описания локаций;
* публичный каталог карт;
* поиск карт по названию;
* фильтрация карт по тегам;
* приватные и публичные карты;
* доступ к карте по share-ссылке.

## Структура репозитория

```text
fantasy-map/
├── .env.example                 # порты и build args для docker compose
├── .envs/                       # env-файлы для локального запуска (и *.env.example)
├── .github/workflows/           # GitHub Actions
├── api_gateway/                 # API Gateway: единая точка входа для frontend
├── docs/                        # документация, диаграммы и инструкция по деплою
├── frontend/                    # клиентское приложение на React
├── k8s/                         # Kubernetes-манифесты (экспериментальные)
├── map_service/                 # сервис карт, локаций, тегов и прав доступа
├── tests/integration/           # интеграционные тесты
├── tile_service/                # сервис фоновой генерации тайлов
├── user_service/                # сервис пользователей и аутентификации
├── docker-compose.yml           # локальный запуск всего стека
├── Makefile                     # команды env/up/down/logs/migrate/reset
├── pytest.ini                   # конфигурация pytest
└── README.md
```

### Сервисы

| Сервис         | Назначение                                                          |
| -------------- | ------------------------------------------------------------------- |
| `frontend`     | Пользовательский интерфейс: каталог, просмотр и редактирование карт |
| `api_gateway`  | Единая точка входа для REST API, маршрутизация запросов             |
| `user_service` | Регистрация, вход, JWT-аутентификация и данные пользователей        |
| `map_service`  | Карты, локации, теги, настройки доступа и публикация                |
| `tile_service` | Фоновая обработка изображений и генерация тайлов                    |
| `user-db`      | PostgreSQL-база данных пользователей                                |
| `map-db`       | PostgreSQL-база данных карт и локаций                               |
| `redis`        | Очередь задач для фоновой обработки                                 |
| `minio`        | S3-совместимое хранилище исходных изображений и тайлов              |

## Установка и запуск

### Требования

Перед запуском должны быть установлены:

* Docker;
* Docker Compose v2;
* Git.

Node.js 20+ и npm нужны только для запуска frontend вне Docker.

### 1. Клонирование репозитория

```bash
git clone https://github.com/se7ensnow/fantasy-map.git
cd fantasy-map
```

### 2. Настройка переменных окружения

Все переменные лежат в `.envs/`. В репозитории хранятся только шаблоны
`*.env.example`, поэтому сначала создайте локальные файлы:

```bash
make env
```

Команда создаст `.envs/*.env` из шаблонов `.envs/*.env.example`, **подставив
случайные пароли и ключи** (`SECRET_KEY`, пароли PostgreSQL и MinIO), и корневой
`.env` из `.env.example`. Существующие файлы не перезаписываются. Значения
секретов в вывод не печатаются.

Минимальный набор файлов:

```text
.envs/
├── api-gateway.env
├── map-db.env
├── map-service.env
├── minio.env
├── tile-service.env
├── user-db.env
└── user-service.env
```

Файлы `.envs/*.env` **не хранятся в git** (они в `.gitignore`), а в репозиторий
попадают только шаблоны с плейсхолдерами. Не коммитьте реальные пароли и ключи;
подробности для production — в [`docs/deployment.md`](docs/deployment.md#секреты).
Без `SECRET_KEY` сервис пользователей не запустится.

Репозиторий проверяется на утёкшие секреты gitleaks (CI и
[pre-commit](https://pre-commit.com): `pip install pre-commit && pre-commit install`);
ручная проверка — `make secrets-scan`.

Адреса внутри compose используют имена сервисов (`user-db`, `map-db`, `redis`,
`minio`), а переменные `VITE_API_URL`/`VITE_STORAGE_URL` в корневом `.env` —
адреса, доступные из браузера (по умолчанию относительные `/api` и
`/storage/...`, см. раздел про frontend в NGINX).

### 3. Запуск backend-стека

```bash
make up
# эквивалентно: docker compose up --build -d
```

`make up` поднимает backend и инфраструктуру. Frontend по умолчанию не входит в
этот запуск — для разработки он запускается отдельно через Vite с hot reload
(см. следующий раздел). Если нужен frontend в NGINX, используйте `make up-full`.

При первом запуске автоматически применяются миграции Alembic
(`user-service-migrations` и `map-service-migrations`), после чего стартуют
сервисы. Проверить состояние можно командой `make ps`, логи — `make logs`.

После запуска будут доступны:

| Компонент     | URL                      |
| ------------- | ------------------------ |
| API Gateway   | `http://localhost:8000`  |
| User Service  | `http://localhost:8001`  |
| Map Service   | `http://localhost:8002`  |
| MinIO API     | `http://localhost:9000`  |
| MinIO Console | `http://localhost:9001`  |
| Redis         | `localhost:6379`         |
| User DB       | `localhost:5433`         |
| Map DB        | `localhost:5434`         |

Порты можно изменить в корневом `.env` (см. `.env.example`).

Остановка:

```bash
make down     # данные сохраняются
make reset    # удалить контейнеры и volume'ы
```

### 4. Frontend в режиме разработки

Frontend запускается отдельно через Vite — это основной режим разработки, потому
что изменения в коде сразу подхватываются без пересборки Docker-образа:

```bash
make up

cd frontend
npm install
npm run dev
```

Vite dev server будет доступен по адресу `http://localhost:5173`. Для локального
запуска можно создать файл `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_STORAGE_URL=http://localhost:9000/fantasy-maps
```

CORS в API Gateway уже разрешает оба origin'а — `5173` (Vite) и `8080` (NGINX в
Docker).

### 5. Frontend в Docker (опционально)

Production-сборка frontend в NGINX:

```bash
make up-full
# эквивалентно:
# docker compose --profile frontend up --build -d
```

Frontend будет доступен на `http://localhost:8080`. Пересборка после изменений
кода требуется вручную:

```bash
docker compose --profile frontend build frontend
docker compose --profile frontend up -d frontend
```

Адреса API и хранилища передаются как build args `VITE_API_URL` и
`VITE_STORAGE_URL` (см. `.env.example`). По умолчанию они относительные (`/api`,
`/storage/fantasy-maps`): NGINX во frontend-контейнере проксирует `/api` в
`api-gateway`, а `/storage` в MinIO. Поэтому сайт работает по любому адресу, в том
числе с телефона в той же Wi-Fi сети: откройте `http://<IP-мака>:8080`
(IP: `ipconfig getifaddr en0`). Дополнительных портов открывать не нужно.

Сборка без Docker:

```bash
cd frontend
npm run build
npm run preview
```

## Деплой: Docker Compose или Kubernetes

Для локальной разработки, демонстрации и production на одном сервере рекомендуется
**Docker Compose**: он поднимает backend одной командой, не требует кластера и
проще в отладке. Frontend в разработке запускается отдельно через Vite (hot
reload), а при необходимости собирается в Docker-образ (`make up-full`).

Kubernetes оправдан при наличии кластера, требований к HA/масштабированию и
managed-инфраструктуры. Манифесты в `k8s/` пока черновые: в них нет MinIO, сборки
образов и гарантированного порядка миграций.

Подробное сравнение, инструкции и troubleshooting — в
[`docs/deployment.md`](docs/deployment.md).

## Зависимости

### Backend

Основные Python-зависимости сервисов:

| Библиотека                     |          Версия | Где используется                             |
| ------------------------------ | --------------: | -------------------------------------------- |
| `fastapi`                      |     `~=0.135.3` | `api_gateway`, `user_service`, `map_service` |
| `uvicorn[standard]`            |      `~=0.34.3` | запуск FastAPI-сервисов                      |
| `pydantic` / `pydantic[email]` |      `~=2.11.5` | схемы данных и валидация                     |
| `sqlalchemy`                   |      `~=2.0.41` | `user_service`, `map_service`                |
| `psycopg2-binary`              |      `~=2.9.10` | подключение к PostgreSQL                     |
| `alembic`                      |      `~=1.18.4` | миграции баз данных                          |
| `python-dotenv`                |       `~=1.1.0` | переменные окружения                         |
| `python-multipart`             |      `~=0.0.20` | загрузка файлов                              |
| `httpx`                        |      `~=0.28.1` | HTTP-запросы между сервисами                 |
| `redis`                        |       `~=6.2.0` | Redis-клиент                                 |
| `rq`                           |       `~=2.3.3` | очередь фоновых задач                        |
| `boto3`                        |     `~=1.42.80` | работа с S3/MinIO                            |
| `botocore`                     |     `~=1.42.80` | низкоуровневая работа с S3/MinIO             |
| `passlib[argon2]`              |       `~=1.7.4` | хеширование паролей                          |
| `python-jose[cryptography]`    |       `~=3.5.0` | JWT-токены                                   |
| `pillow-simd`                  | `~=12.1.1.post0` | обработка изображений и генерация тайлов     |
| `pytest`                       |       `~=8.3.5` | тестирование                                 |

### Frontend

Основные frontend-зависимости:

| Библиотека                 |     Версия | Назначение                         |
| -------------------------- | ---------: | ---------------------------------- |
| `react`                    |  `^18.2.0` | UI                                 |
| `react-dom`                |  `^18.2.0` | рендеринг React                    |
| `vite`                     |   `^6.3.5` | dev server и сборка                |
| `ol`                       |  `^10.8.0` | интерактивная карта на OpenLayers  |
| `axios`                    |   `^1.9.0` | HTTP-запросы                       |
| `react-router-dom`         |   `^7.6.2` | маршрутизация                      |
| `react-hook-form`          |  `^7.57.0` | формы                              |
| `zod`                      | `^3.25.51` | валидация данных                   |
| `@hookform/resolvers`      |   `^5.0.1` | интеграция React Hook Form и Zod   |
| `react-markdown`           |  `^10.1.0` | отображение Markdown               |
| `remark-gfm`               |   `^4.0.1` | поддержка GitHub Flavored Markdown |
| `rehype-sanitize`          |   `^6.0.0` | безопасный рендеринг HTML          |
| `i18next`                  |  `^26.0.6` | интернационализация                |
| `react-i18next`            |  `^17.0.4` | интеграция i18next с React         |
| `lucide-react`             | `^0.513.0` | иконки                             |
| `sonner`                   |   `^2.0.5` | уведомления                        |
| `tailwindcss`              |  `^3.4.17` | стилизация                         |
| `tailwind-merge`           |   `^3.3.0` | объединение Tailwind-классов       |
| `tailwindcss-animate`      |   `^1.0.7` | анимации                           |
| `class-variance-authority` |   `^0.7.1` | варианты UI-компонентов            |
| `clsx`                     |   `^2.1.1` | условные CSS-классы                |

### Инфраструктура

| Компонент    | Версия / образ | Назначение                                    |
| ------------ | -------------: | --------------------------------------------- |
| Python       |    `3.12-slim` | backend-сервисы                               |
| Node.js      |    `20-alpine` | сборка frontend                               |
| NGINX        |  `1.27-alpine` | отдача production-сборки frontend             |
| PostgreSQL   |           `15` | базы данных пользователей и карт              |
| Redis        |            `7` | очередь фоновых задач                         |
| MinIO        |       `latest` | S3-совместимое хранилище изображений и тайлов |
| MinIO Client |       `latest` | инициализация bucket                          |

## Тестирование

Запуск тестов для Python-сервисов выполняется через `pytest`.

Пример:

```bash
pytest
```

## Документация

Дополнительные проектные материалы, диаграммы и документация находятся в директории:

```text
docs/
```

## Архитектура

Проект построен как набор независимых сервисов:

```text
Frontend
    ↓
API Gateway
    ↓
User Service     Map Service
    ↓             ↓
User DB          Map DB
                  ↓
              Redis / RQ
                  ↓
          Tile Processing Service
                  ↓
              MinIO / S3
```

Основная идея архитектуры — разделить пользовательский интерфейс, бизнес-логику, хранение данных и длительную обработку изображений.

Генерация тайлов выполняется асинхронно: пользователь загружает изображение карты, после чего сервис обработки создаёт набор тайлов для разных уровней приближения. Frontend загружает только те тайлы, которые нужны для текущей видимой области карты.

## Репозиторий

```text
https://github.com/se7ensnow/fantasy-map
```
