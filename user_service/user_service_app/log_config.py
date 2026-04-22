import datetime
import json
import logging
import sys
import typing

import fastapi


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        data: dict[str, typing.Any] = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "level": record.levelname,
            "service": "user-service",
            "logger": record.name,
            "message": record.getMessage(),
        }

        extra_fields = getattr(record, "extra_fields", None)
        if isinstance(extra_fields, dict):
            data.update(extra_fields)

        if record.exc_info:
            data["exception"] = self.formatException(record.exc_info)

        return json.dumps(data, ensure_ascii=False)


def setup_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO)

    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


logger = logging.getLogger("user-service")


def log(request: fastapi.Request, level: int, event: str, **fields: typing.Any) -> None:
    logger.log(
        level,
        event,
        extra={
            "extra_fields": {
                "event": event,
                "request_id": getattr(request.state, "request_id", None),
                **fields,
            }
        },
    )