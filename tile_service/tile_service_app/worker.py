import os
from redis import Redis
from rq import Worker, Queue
from tile_service_app.config import REDIS_URL

def main():
    redis_conn = Redis.from_url(REDIS_URL)

    queue_name = "default"
    queue = Queue(name=queue_name, connection=redis_conn)

    worker = Worker([queue])
    worker.work()

if __name__ == "__main__":
    main()