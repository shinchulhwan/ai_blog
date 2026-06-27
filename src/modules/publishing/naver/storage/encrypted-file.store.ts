import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { decryptJson, encryptJson } from "./encryption.util";

export async function writeEncryptedJson(
  filePath: string,
  payload: unknown,
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const encrypted = encryptJson(payload);
  await writeFile(filePath, encrypted, "utf8");
}

export async function readEncryptedJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return decryptJson<T>(raw);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function deleteEncryptedFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
