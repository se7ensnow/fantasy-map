import logging

from redis import Redis
from rq import Queue, Worker

from tile_service_app.config import REDIS_URL
from tile_service_app.log_config import log, setup_logging


def main():
    setup_logging()

    redis_conn = Redis.from_url(REDIS_URL)

    queue_name = "default"
    queue = Queue(name=queue_name, connection=redis_conn)

    log(logging.INFO, "worker_started", queue=queue_name)

    worker = Worker([queue])
    worker.work()


if __name__ == "__main__":
    main()