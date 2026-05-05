import logging

import redis
import rq

from tile_service_app import config
from tile_service_app import log_config


def main():
    log_config.setup_logging()

    redis_conn = redis.Redis.from_url(config.REDIS_URL)

    queue_name = "default"
    queue = rq.Queue(name=queue_name, connection=redis_conn)

    log_config.log(logging.INFO, "worker_started", queue=queue_name)

    worker = rq.Worker([queue])
    worker.work()


if __name__ == "__main__":
    main()