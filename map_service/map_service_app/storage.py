from dataclasses import dataclass
from typing import BinaryIO

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from map_service_app.config import S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, S3_SECURE


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


class S3Storage:
    def __init__(self, config: StorageConfig):
        self.config = config
        self.client = boto3.client(
            "s3",
            endpoint_url=config.endpoint,
            aws_access_key_id=config.access_key,
            aws_secret_access_key=config.secret_key,
            use_ssl=config.secure,
            config=Config(signature_version="s3v4"),
        )

    def ensure_bucket_exists(self) -> None:
        try:
            self.client.head_bucket(Bucket=self.config.bucket)
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code")
            if error_code in ("404", "NoSuchBucket"):
                self.client.create_bucket(Bucket=self.config.bucket)
                return
            raise StorageError(f"Failed to check/create bucket: {e}") from e

    def upload_fileobj(self, file_obj: BinaryIO, object_key: str, content_type: str) -> str:
        try:
            self.client.upload_fileobj(
                Fileobj=file_obj,
                Bucket=self.config.bucket,
                Key=object_key,
                ExtraArgs={"ContentType": content_type},
            )
            return object_key
        except ClientError as e:
            raise StorageError(f"Failed to upload object '{object_key}': {e}") from e

    def download_bytes(self, object_key: str) -> bytes:
        try:
            response = self.client.get_object(Bucket=self.config.bucket, Key=object_key)
            return response["Body"].read()
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code")
            if error_code in ("404", "NoSuchKey", "NotFound"):
                raise ObjectNotFoundError(f"Object '{object_key}' not found") from e
            raise StorageError(f"Failed to download object '{object_key}': {e}") from e

    def delete_object(self, object_key: str) -> bool:
        try:
            self.client.delete_object(Bucket=self.config.bucket, Key=object_key)
            return True
        except ClientError as e:
            raise StorageError(f"Failed to delete object '{object_key}': {e}") from e

    def object_exists(self, object_key: str) -> bool:
        try:
            self.client.head_object(Bucket=self.config.bucket, Key=object_key)
            return True
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code")
            if error_code in ("404", "NoSuchKey", "NotFound"):
                return False
            raise StorageError(f"Failed to check object '{object_key}': {e}") from e

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


def build_map_source_key(map_id, source_ext: str) -> str:
    return f"maps/{map_id}/source/source.{source_ext}"


def build_map_prefix(map_id) -> str:
    return f"maps/{map_id}/"