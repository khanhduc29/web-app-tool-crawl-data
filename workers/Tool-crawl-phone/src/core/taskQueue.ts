import { getNextTask } from "../api/crawlTask.api";
import { processTask } from "./processTask";
import { delay } from "../utils/delay";

export async function startTaskQueue() {
  console.log("📡 Task queue started");

  while (true) {
    try {
      const task = await getNextTask();

      if (!task) {
        console.log("⏳ No task, waiting...");
        await delay(25000);
        continue;
      }

      console.log(`📥 Got task ${task._id}`);
      await processTask(task);
    } catch (err: any) {
      console.error("❌ Queue error:", err.message);
      await delay(5000);
    }
  }
}