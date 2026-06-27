import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { IntegrationTestReport } from "../types/integration-test.types";

const LOG_DIR = path.join(process.cwd(), "logs", "integration");

export class IntegrationTestLogService {
  async write(report: IntegrationTestReport): Promise<string> {
    await mkdir(LOG_DIR, { recursive: true });

    const timestamp = report.startedAt.replace(/[:.]/g, "-");
    const filename = `integration-${timestamp}.json`;
    const filePath = path.join(LOG_DIR, filename);

    await writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    return filePath;
  }
}

export const integrationTestLogService = new IntegrationTestLogService();
