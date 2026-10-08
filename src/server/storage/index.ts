import { randomUUID } from "node:crypto";
import { msg } from "@/i18n/translate";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "@/server/errors";

/**
 * File storage abstraction.
 *
 *  - `local`      (default, DEVELOPMENT ONLY) writes into /public/uploads so files are served by Next.js.
 *  - `supabase`   (production) uploads to a public Supabase Storage bucket via the REST API.
 *  - `cloudinary` / `s3` are integration points: implement `save()` with the provider SDK and set
 *    STORAGE_DRIVER + credentials. They intentionally throw until configured.
 */
export interface StorageProvider {
  readonly name: string;
  save(file: { bytes: Buffer; mimeType: string; ext: string }, folder: string): Promise<{ url: string }>;
}

class LocalDiskStorage implements StorageProvider {
  readonly name = "local";
  async save(file: { bytes: Buffer; mimeType: string; ext: string }, folder: string) {
    const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "");
    const dir = path.join(process.cwd(), "public", "uploads", safeFolder);
    await mkdir(dir, { recursive: true });
    const name = `${randomUUID()}.${file.ext}`;
    await writeFile(path.join(dir, name), file.bytes);
    return { url: `/uploads/${safeFolder}/${name}` };
  }
}

/**
 * Supabase Storage (production, e.g. on Vercel where the filesystem is read-only).
 * Uses the Storage REST API with the service-role key (server-side only — never sent to browsers).
 * Requires a PUBLIC bucket so the returned URLs can be shown in <img> tags.
 *   STORAGE_DRIVER=supabase  SUPABASE_URL=https://xyz.supabase.co  SUPABASE_SERVICE_ROLE_KEY=...  SUPABASE_STORAGE_BUCKET=uploads
 */
class SupabaseStorage implements StorageProvider {
  readonly name = "supabase";
  constructor(
    private url: string,
    private key: string,
    private bucket: string,
  ) {}
  async save(file: { bytes: Buffer; mimeType: string; ext: string }, folder: string) {
    const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "");
    const objectPath = `${safeFolder}/${randomUUID()}.${file.ext}`;
    const res = await fetch(`${this.url}/storage/v1/object/${this.bucket}/${objectPath}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.key}`, apikey: this.key, "Content-Type": file.mimeType, "x-upsert": "false" },
      body: new Uint8Array(file.bytes),
    });
    if (!res.ok) {
      console.error("[storage] supabase upload failed", res.status, await res.text().catch(() => ""));
      throw new AppError("File upload failed. Please try again.");
    }
    return { url: `${this.url}/storage/v1/object/public/${this.bucket}/${objectPath}` };
  }
}

class NotConfiguredStorage implements StorageProvider {
  constructor(readonly name: string) {}
  async save(): Promise<{ url: string }> {
    throw new AppError(
      `Storage driver "${this.name}" is not configured yet. Implement it in src/server/storage/index.ts or set STORAGE_DRIVER=local for development.`,
    );
  }
}

export function getStorage(): StorageProvider {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "local") return new LocalDiskStorage();
  if (driver === "supabase") {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_STORAGE_BUCKET) return new NotConfiguredStorage("supabase");
    return new SupabaseStorage(SUPABASE_URL.replace(/\/$/, ""), SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET);
  }
  return new NotConfiguredStorage(driver);
}

// ───────────── Upload validation ─────────────

type Rule = { mime: string; ext: string; magic: (b: Buffer) => boolean };

const IMAGE_RULES: Rule[] = [
  { mime: "image/jpeg", ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ext: "png", magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/webp", ext: "webp", magic: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
];

const VIDEO_RULES: Rule[] = [
  { mime: "video/mp4", ext: "mp4", magic: (b) => b.subarray(4, 8).toString("ascii") === "ftyp" },
  { mime: "video/quicktime", ext: "mov", magic: (b) => b.subarray(4, 8).toString("ascii") === "ftyp" },
  { mime: "video/webm", ext: "webm", magic: (b) => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
];

const DOC_RULES: Rule[] = [
  { mime: "application/pdf", ext: "pdf", magic: (b) => b.subarray(0, 5).toString("ascii") === "%PDF-" },
];

export const UPLOAD_LIMITS = {
  imageBytes: 8 * 1024 * 1024,
  videoBytes: 40 * 1024 * 1024,
  docBytes: 10 * 1024 * 1024,
  maxImagesPerSubmission: 12,
};

export type UploadKind = "image" | "video" | "document";

/** Validates size, declared MIME type AND file signature (magic bytes). */
export async function validateUpload(file: File, allowed: UploadKind[]): Promise<{ bytes: Buffer; mimeType: string; ext: string }> {
  const rules: Array<Rule & { kind: UploadKind }> = [
    ...(allowed.includes("image") ? IMAGE_RULES.map((r) => ({ ...r, kind: "image" as const })) : []),
    ...(allowed.includes("video") ? VIDEO_RULES.map((r) => ({ ...r, kind: "video" as const })) : []),
    ...(allowed.includes("document") ? DOC_RULES.map((r) => ({ ...r, kind: "document" as const })) : []),
  ];
  const rule = rules.find((r) => r.mime === file.type);
  if (!rule) throw new AppError(msg("errors.unsupportedFile", { name: file.name }));
  const limit = rule.kind === "image" ? UPLOAD_LIMITS.imageBytes : rule.kind === "video" ? UPLOAD_LIMITS.videoBytes : UPLOAD_LIMITS.docBytes;
  if (file.size > limit) throw new AppError(msg("errors.fileTooLarge", { name: file.name, mb: Math.round(limit / 1024 / 1024) }));
  if (file.size === 0) throw new AppError(msg("errors.fileEmpty", { name: file.name }));
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!rule.magic(bytes)) throw new AppError(msg("errors.fileInvalid", { name: file.name }));
  return { bytes, mimeType: rule.mime, ext: rule.ext };
}

/** Read non-empty File entries from a FormData field. */
export function filesFrom(form: FormData, field: string): File[] {
  return form.getAll(field).filter((v): v is File => typeof v === "object" && v !== null && "size" in v && (v as File).size > 0);
}
