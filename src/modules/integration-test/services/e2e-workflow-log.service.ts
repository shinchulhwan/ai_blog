import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { E2eWorkflowReport } from "../types/e2e-workflow.types";

const LOG_DIR = path.join(process.cwd(), "logs", "e2e");

export class E2eWorkflowLogService {
  async write(report: E2eWorkflowReport): Promise<string> {
    await mkdir(LOG_DIR, { recursive: true });

    const timestamp = report.startedAt.replace(/[:.]/g, "-");
    const filename = `e2e-${timestamp}.json`;
    const filePath = path.join(LOG_DIR, filename);

    await writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    return filePath;
  }
}

export const e2eWorkflowLogService = new E2eWorkflowLogService();
