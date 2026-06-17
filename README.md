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
├── .envs/                      # env-файлы для локального запуска сервисов
├── .github/workflows/          # GitHub Actions
├── api_gateway/                # API Gateway: единая точка входа для frontend
├── docs/                       # документация, диаграммы и проектные материалы
├── frontend/                   # клиентское приложение на React
├── k8s/                        # Kubernetes-манифесты
├── map_service/                # сервис карт, локаций, тегов и прав доступа
├── tests/integration/          # интеграционные тесты
├── tile_service/               # сервис фоновой генерации тайлов
├── user_service/               # сервис пользователей и аутентификации
├── docker-compose.yml          # локальный запуск backend-инфраструктуры
├── pytest.ini                  # конфигурация pytest
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
* Docker Compose;
* Node.js 20+;
* npm;
* Git.

### 1. Клонирование репозитория

```bash
git clone https://github.com/se7ensnow/fantasy-map.git
cd fantasy-map
```

### 2. Настройка переменных окружения

Проект использует env-файлы в директории `.envs/`.

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

Пример локальной конфигурации:

#### `.envs/user-db.env`

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=user_db
```

#### `.envs/map-db.env`

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=map_db
```

#### `.envs/user-service.env`

```env
DATABASE_URL=postgresql://postgres:postgres@user-db:5432/user_db
SECRET_KEY=super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=900
```

#### `.envs/map-service.env`

```env
DATABASE_URL=postgresql://postgres:postgres@map-db:5432/map_db
REDIS_URL=redis://redis:6379/0
TILE_SERVICE_TASK=tile_service_app.tasks.process_map_image

S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=fantasy-maps
S3_SECURE=false
```

#### `.envs/tile-service.env`

```env
REDIS_URL=redis://redis:6379/0
MAP_SERVICE_URL=http://map-service:8000

S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=fantasy-maps
S3_SECURE=false
```

#### `.envs/api-gateway.env`

```env
USER_SERVICE_URL=http://user-service:8000
MAP_SERVICE_URL=http://map-service:8000
REDIS_URL=redis://redis:6379/0
FRONTEND_URL=http://localhost:5173
```

#### `.envs/minio.env`

```env
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
```

### 3. Запуск backend-сервисов

```bash
docker compose up --build -d
```

После запуска будут доступны:

| Компонент     | URL                     |
| ------------- | ----------------------- |
| API Gateway   | `http://localhost:8000` |
| User Service  | `http://localhost:8001` |
| Map Service   | `http://localhost:8002` |
| MinIO API     | `http://localhost:9000` |
| MinIO Console | `http://localhost:9001` |
| Redis         | `localhost:6379`        |
| User DB       | `localhost:5433`        |
| Map DB        | `localhost:5434`        |

### 4. Запуск frontend

Frontend запускается отдельно.

```bash
cd frontend
npm install
npm run dev
```

По умолчанию Vite dev server будет доступен по адресу:

```text
http://localhost:5173
```

Для локального запуска можно создать файл `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8000
VITE_STORAGE_URL=http://localhost:9000/fantasy-maps
```

### 5. Сборка frontend

```bash
cd frontend
npm run build
```

Предпросмотр production-сборки:

```bash
npm run preview
```

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
| `pillow-simd`                  | `~=9.5.0.post2` | обработка изображений и генерация тайлов     |
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
