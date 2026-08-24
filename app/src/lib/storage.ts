import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";

const UPLOADS_DIR = path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? "./uploads");

function safeExtension(fileName: string) {
  const ext = path.extname(fileName);
  return /^\.[a-zA-Z0-9]{1,10}$/.test(ext) ? ext : "";
}

export async function saveUploadedFile(file: File) {
  await mkdir(UPLOADS_DIR, { recursive: true });
  const storedName = `${randomUUID()}${safeExtension(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOADS_DIR, storedName), buffer);
  return storedName;
}

export async function readStoredFile(storedName: string) {
  return readFile(path.join(UPLOADS_DIR, storedName));
}

export async function deleteStoredFile(storedName: string) {
  await unlink(path.join(UPLOADS_DIR, storedName)).catch(() => {});
}
