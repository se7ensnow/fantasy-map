#!/usr/bin/env bash
# Создаёт локальные .envs/*.env из шаблонов .envs/*.env.example.
#
# * Плейсхолдеры вида @@NAME@@ заменяются случайными значениями (openssl rand).
# * Одно и то же имя получает одно и то же значение во всех файлах
#   (пароль БД должен совпадать в user-db.env и в DATABASE_URL user-service.env).
# * Уже заполненные файлы не трогаются. Если пароль уже записан в существующем
#   файле-источнике, новые файлы получают то же значение, а не новое.
# * Значения секретов в вывод не попадают.
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_DIR=".envs"
CACHE_DIR="$(mktemp -d)"
trap 'rm -rf "$CACHE_DIR"' EXIT

# Файл и ключ, где "живёт" значение плейсхолдера.
source_of() {
  case "$1" in
    USER_DB_PASSWORD)     echo "$ENV_DIR/user-db.env POSTGRES_PASSWORD" ;;
    MAP_DB_PASSWORD)      echo "$ENV_DIR/map-db.env POSTGRES_PASSWORD" ;;
    MINIO_ROOT_PASSWORD)  echo "$ENV_DIR/minio.env MINIO_ROOT_PASSWORD" ;;
    *)                    echo "" ;;
  esac
}

is_filled() {
  [ -f "$1" ] && grep -q '[^[:space:]]' "$1"
}

value_for() {
  local token="$1" src file key value
  src="$(source_of "$token")"

  if [ -n "$src" ]; then
    file="${src% *}"
    key="${src#* }"
    if is_filled "$file" && grep -q "^${key}=" "$file"; then
      grep "^${key}=" "$file" | head -1 | cut -d= -f2-
      return
    fi
  fi

  if [ ! -f "$CACHE_DIR/$token" ]; then
    openssl rand -hex 24 > "$CACHE_DIR/$token"
  fi
  cat "$CACHE_DIR/$token"
}

shopt -s nullglob
examples=("$ENV_DIR"/*.env.example)

if [ ${#examples[@]} -eq 0 ]; then
  echo "No templates found in $ENV_DIR/" >&2
  exit 1
fi

# Сначала файлы-источники: их значения сохраняются в кэше для остальных.
ordered=()
for name in user-db map-db minio; do
  [ -f "$ENV_DIR/$name.env.example" ] && ordered+=("$ENV_DIR/$name.env.example")
done
for example in "${examples[@]}"; do
  case "$example" in
    "$ENV_DIR/user-db.env.example"|"$ENV_DIR/map-db.env.example"|"$ENV_DIR/minio.env.example") ;;
    *) ordered+=("$example") ;;
  esac
done

for example in "${ordered[@]}"; do
  target="${example%.example}"

  if is_filled "$target"; then
    echo "skip $target (already exists)"
    continue
  fi

  content="$(grep -v "^##" "$example")"   # строки "##" — комментарии только шаблона
  generated=()

  for token in $(grep -o '@@[A-Z0-9_]*@@' "$example" | sort -u); do
    name="${token//@/}"
    value="$(value_for "$name")"
    content="${content//$token/$value}"
    generated+=("$name")
  done

  umask 077
  printf '%s\n' "$content" > "$target"
  chmod 600 "$target"

  if [ ${#generated[@]} -gt 0 ]; then
    echo "created $target (generated: ${generated[*]})"
  else
    echo "created $target"
  fi
done

if [ ! -f .env ]; then
  cp .env.example .env
  echo "created .env"
fi
