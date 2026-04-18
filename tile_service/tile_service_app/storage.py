import os
import threading
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

import boto3
import boto3.s3.transfer as s3transfer
from botocore.client import Config
from botocore.exceptions import ClientError
from s3transfer.subscribers import BaseSubscriber

from tile_service_app.config import (
    S3_ENDPOINT,
    S3_ACCESS_KEY,
    S3_SECRET_KEY,
    S3_BUCKET,
    S3_SECURE,
)


class StorageError(Exception):
    pass


class ObjectNotFoundError(StorageError):
    pass


@dataclass
class StorageConfig:
    endpoint: str
    access_key: str
    secret_key: str
    bucket: str
    secure: bool = False


class UploadProgressSubscriber(BaseSubscriber):
    def __init__(
        self,
        counter: dict,
        total_files: int,
        progress_callback: Callable[[int, int], None] | None = None,
        progress_every: int = 10,
    ):
        self._counter = counter
        self._total_files = total_files
        self._progress_callback = progress_callback
        self._progress_every = progress_every

    def on_done(self, future, **kwargs):
        with self._counter["lock"]:
            self._counter["completed"] += 1
            completed = self._counter["completed"]

        if self._progress_callback and (
            completed % self._progress_every == 0 or completed == self._total_files
        ):
            self._progress_callback(completed, self._total_files)


class S3Storage:
    def __init__(self, config: StorageConfig):
        self.config = config
        self.client = boto3.client(
            "s3",
            endpoint_url=config.endpoint,
            aws_access_key_id=config.access_key,
            aws_secret_access_key=config.secret_key,
            use_ssl=config.secure,
            config=Config(
                signature_version="s3v4",
                max_pool_connections=20,
            ),
        )

    def download_file(self, object_key: str, destination_path: str) -> str:
        try:
            self.client.download_file(
                Bucket=self.config.bucket,
                Key=object_key,
                Filename=destination_path,
            )
            return destination_path
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code")
            if error_code in ("404", "NoSuchKey", "NotFound"):
                raise ObjectNotFoundError(f"Object '{object_key}' not found") from e
            raise StorageError(f"Failed to download object '{object_key}': {e}") from e

    def upload_file(self, local_path: str, object_key: str, content_type: str = "image/png") -> str:
        try:
            self.client.upload_file(
                Filename=local_path,
                Bucket=self.config.bucket,
                Key=object_key,
                ExtraArgs={"ContentType": content_type},
            )
            return object_key
        except ClientError as e:
            raise StorageError(f"Failed to upload object '{object_key}': {e}") from e

    def upload_directory(
        self,
        local_dir: str,
        object_prefix: str,
        content_type: str = "image/png",
        workers: int = 20,
        progress_callback: Callable[[int, int], None] | None = None,
        progress_every: int = 10,
    ) -> int:
        file_paths: list[str] = []

        for root, _, files in os.walk(local_dir):
            for name in files:
                file_paths.append(os.path.join(root, name))

        if not file_paths:
            if progress_callback:
                progress_callback(0, 0)
            return 0

        transfer_config = s3transfer.TransferConfig(
            use_threads=True,
            max_concurrency=workers,
        )
        manager = s3transfer.create_transfer_manager(self.client, transfer_config)

        total_files = len(file_paths)
        counter = {
            "completed": 0,
            "lock": threading.Lock(),
        }
        futures = []

        if progress_callback:
            progress_callback(0, total_files)

        try:
            for src in file_paths:
                rel_path = Path(src).relative_to(local_dir).as_posix()
                object_key = f"{object_prefix}{rel_path}"

                subscriber = UploadProgressSubscriber(
                    counter=counter,
                    total_files=total_files,
                    progress_callback=progress_callback,
                    progress_every=progress_every,
                )

                future = manager.upload(
                    src,
                    self.config.bucket,
                    object_key,
                    extra_args={"ContentType": content_type},
                    subscribers=[subscriber],
                )
                futures.append(future)

            for future in futures:
                future.result()

            return counter["completed"]
        finally:
            manager.shutdown()

    def delete_object(self, object_key: str) -> bool:
        try:
            self.client.delete_object(Bucket=self.config.bucket, Key=object_key)
            return True
        except ClientError as e:
            raise StorageError(f"Failed to delete object '{object_key}': {e}") from e

    def delete_prefix(self, prefix: str) -> int:
        deleted_count = 0
        continuation_token = None

        try:
            while True:
                params = {
                    "Bucket": self.config.bucket,
                    "Prefix": prefix,
                    "MaxKeys": 1000,
                }
                if continuation_token:
                    params["ContinuationToken"] = continuation_token

                response = self.client.list_objects_v2(**params)
                contents = response.get("Contents", [])

                if contents:
                    objects = [{"Key": obj["Key"]} for obj in contents]
                    self.client.delete_objects(
                        Bucket=self.config.bucket,
                        Delete={"Objects": objects},
                    )
                    deleted_count += len(objects)

                if not response.get("IsTruncated"):
                    break

                continuation_token = response.get("NextContinuationToken")

            return deleted_count
        except ClientError as e:
            raise StorageError(f"Failed to delete prefix '{prefix}': {e}") from e


storage = S3Storage(
    StorageConfig(
        endpoint=S3_ENDPOINT,
        access_key=S3_ACCESS_KEY,
        secret_key=S3_SECRET_KEY,
        bucket=S3_BUCKET,
        secure=S3_SECURE,
    )
)


def build_map_source_prefix(map_id: str) -> str:
    return f"maps/{map_id}/source/"


def build_map_source_key(map_id, source_ext: str) -> str:
    return f"maps/{map_id}/source/source.{source_ext}"


def build_map_tiles_root_prefix(map_id: str) -> str:
    return f"maps/{map_id}/tiles/"


def build_map_tiles_version_prefix(map_id: str, tiles_version: int) -> str:
    return f"maps/{map_id}/tiles/v{tiles_version}/"


def build_tile_key(map_id: str, tiles_version: int, z: int, x: int, y: int) -> str:
    return f"maps/{map_id}/tiles/v{tiles_version}/{z}/{x}/{y}.png"