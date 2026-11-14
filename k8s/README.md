# Kubernetes

Манифесты в `k8s/local` — экспериментальные и **не являются основным способом
локального запуска**. Для локальной разработки и демо используйте Docker Compose,
см. [`docs/deployment.md`](../docs/deployment.md).

## Ограничения текущих манифестов

* нет MinIO и job'а инициализации bucket — ожидается внешний S3;
* образы `fantasy-maps-*:local` не собираются и не загружаются автоматически;
* frontend собирается без build args `VITE_API_URL` и `VITE_STORAGE_URL`;
* job'ы миграций не гарантируют, что Deployment стартует только после их успеха
  (это делает `kubectl apply` по порядку и `kubectl rollout status`);
* ingress рассчитан на Traefik и хост `localhost`.

## Порядок применения (если всё же нужно)

```bash
# 1. Собрать образы
docker build -t fantasy-maps-user-service:local ./user_service
docker build -t fantasy-maps-map-service:local ./map_service
docker build -t fantasy-maps-api-gateway:local ./api_gateway
docker build -t fantasy-maps-tile-service:local --platform linux/amd64 ./tile_service
docker build -t fantasy-maps-frontend:local \
  --build-arg VITE_API_URL=http://localhost/api \
  --build-arg VITE_STORAGE_URL=https://storage.example.com/fantasy-maps \
  ./frontend

# 2. Загрузить образы в кластер (пример для kind/minikube)
kind load docker-image fantasy-maps-user-service:local
# ...

# 3. Секреты
mkdir -p k8s/secrets-local
for f in k8s/secrets-examples/*.env.example; do
  cp "$f" "k8s/secrets-local/$(basename "${f%.example}")"
done
# отредактировать k8s/secrets-local/*.env
bash k8s/scripts/apply-local-secrets.sh

# 4. Манифесты
kubectl apply -f k8s/local/00-namespace.yaml
kubectl apply -f k8s/local/user-db.yaml -f k8s/local/map-db.yaml -f k8s/local/redis.yaml
kubectl apply -f k8s/local/user-service-migrations.yaml -f k8s/local/map-service-migrations.yaml
kubectl -n fantasy-maps wait --for=condition=complete job/user-service-migrations --timeout=120s
kubectl -n fantasy-maps wait --for=condition=complete job/map-service-migrations --timeout=120s
kubectl apply -f k8s/local/
```
