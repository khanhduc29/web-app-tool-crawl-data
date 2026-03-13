
import time
import sys
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

from core.pinterest_api import (
    get_pending_tasks,
    update_task_success,
    update_task_error
)

from core.pinterest_crawler import crawl_pinterest


def log(msg):
    print(f"[WORKER] {msg}", flush=True)


def worker():

    log("Pinterest worker started")

    while True:

        task = get_pending_tasks()

        if not task:
            log("No pending tasks...")
            time.sleep(50)
            continue

        task_id = task["_id"]
        input_data = task["input"]

        keyword = input_data["keyword"]
        limit = input_data.get("limit", 20)

        log(f"Running task: {task_id}")
        log(f"Keyword: {keyword}")
        log(f"Limit: {limit}")

        try:

            results = crawl_pinterest(keyword, limit)

            log(f"Crawl finished. Pins collected: {len(results)}")

            update_task_success(task_id, results)

            log(f"Task marked SUCCESS: {task_id}")

        except Exception as e:

            log(f"Task ERROR: {str(e)}")

            update_task_error(task_id, str(e))


if __name__ == "__main__":
    worker()