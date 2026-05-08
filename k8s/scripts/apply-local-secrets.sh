#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="fantasy-maps"
SECRETS_DIR="k8s/secrets-local"

kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic user-db-secret \
  -n "$NAMESPACE" \
  --from-env-file="$SECRETS_DIR/user-db.env" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic user-service-secret \
  -n "$NAMESPACE" \
  --from-env-file="$SECRETS_DIR/user-service.env" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic map-db-secret \
  -n "$NAMESPACE" \
  --from-env-file="$SECRETS_DIR/map-db.env" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic map-service-secret \
  -n "$NAMESPACE" \
  --from-env-file="$SECRETS_DIR/map-service.env" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic tile-service-secret \
  -n "$NAMESPACE" \
  --from-env-file="$SECRETS_DIR/tile-service.env" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Local Kubernetes secrets applied."