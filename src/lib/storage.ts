import type { ProgressMap, TrainingPlan, PlanGeneratorConfig } from "../data/types";

declare global {
  interface FileSystemHandlePermissionDescriptor {
    mode?: "read" | "readwrite";
  }

  interface FileSystemHandle {
    queryPermission(
      descriptor?: FileSystemHandlePermissionDescriptor
    ): Promise<PermissionState>;
    requestPermission(
      descriptor?: FileSystemHandlePermissionDescriptor
    ): Promise<PermissionState>;
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: string): Promise<void>;
    close(): Promise<void>;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    getFile(): Promise<File>;
    createWritable(): Promise<FileSystemWritableFileStream>;
  }

  interface Window {
    showSaveFilePicker(options?: {
      suggestedName?: string;
      types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
      }>;
    }): Promise<FileSystemFileHandle>;
  }
}

const PROGRESS_KEY = "marathon-tracker-progress";
const DB_NAME = "marathon-tracker-storage";
const STORE_NAME = "app-settings";
const FILE_HANDLE_KEY = "progress-json-handle";

interface ProgressFilePayload {
  version: 1;
  savedAt: string;
  progress: ProgressMap;
}

interface PlanFilePayload {
  version: 2;
  savedAt: string;
  plan: TrainingPlan;
  progress: ProgressMap;
}

export interface ImportedPlan {
  plan: TrainingPlan;
  progress: ProgressMap;
}

export function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveProgress(progress: ProgressMap): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function createPayload(progress: ProgressMap): ProgressFilePayload {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    progress,
  };
}

function parsePayload(raw: string): ProgressMap | null {
  try {
    const parsed = JSON.parse(raw) as Partial<ProgressFilePayload> | ProgressMap;
    if ("progress" in (parsed as ProgressFilePayload)) {
      return (parsed as ProgressFilePayload).progress ?? {};
    }
    return parsed as ProgressMap;
  } catch {
    return null;
  }
}

function openSettingsDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function readSetting<T>(key: string): Promise<T | null> {
  const db = await openSettingsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    tx.oncomplete = () => db.close();
  });
}

async function writeSetting(key: string, value: unknown): Promise<void> {
  const db = await openSettingsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function getLinkedFileHandle(): Promise<FileSystemFileHandle | null> {
  if (!("indexedDB" in window)) return null;
  return readSetting<FileSystemFileHandle>(FILE_HANDLE_KEY);
}

async function setLinkedFileHandle(handle: FileSystemFileHandle): Promise<void> {
  if (!("indexedDB" in window)) return;
  await writeSetting(FILE_HANDLE_KEY, handle);
}

async function writeToFileHandle(
  handle: FileSystemFileHandle,
  progress: ProgressMap
): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(createPayload(progress), null, 2));
  await writable.close();
}

export function supportsLinkedProgressFile(): boolean {
  return (
    typeof window !== "undefined" &&
    "showSaveFilePicker" in window &&
    "indexedDB" in window
  );
}

export async function hasLinkedProgressFile(): Promise<boolean> {
  return (await getLinkedFileHandle()) !== null;
}

export async function loadLinkedProgress(): Promise<ProgressMap | null> {
  const handle = await getLinkedFileHandle();
  if (!handle) return null;

  const permission = await handle.queryPermission({ mode: "read" });
  if (permission !== "granted") return null;

  try {
    const file = await handle.getFile();
    return parsePayload(await file.text());
  } catch {
    return null;
  }
}

export async function linkProgressFile(progress: ProgressMap): Promise<boolean> {
  if (!supportsLinkedProgressFile()) return false;

  const handle = await window.showSaveFilePicker({
    suggestedName: "marathon-progress.json",
    types: [
      {
        description: "JSON files",
        accept: { "application/json": [".json"] },
      },
    ],
  });

  const permission = await handle.requestPermission({ mode: "readwrite" });
  if (permission !== "granted") return false;

  await writeToFileHandle(handle, progress);
  await setLinkedFileHandle(handle);
  return true;
}

export async function syncProgressToLinkedFile(
  progress: ProgressMap
): Promise<boolean> {
  const handle = await getLinkedFileHandle();
  if (!handle) return false;

  const permission = await handle.queryPermission({ mode: "readwrite" });
  if (permission !== "granted") return false;

  try {
    await writeToFileHandle(handle, progress);
    return true;
  } catch {
    return false;
  }
}

export function downloadProgressFile(progress: ProgressMap): void {
  const blob = new Blob([JSON.stringify(createPayload(progress), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "marathon-progress.json";
  link.click();
  URL.revokeObjectURL(url);
}

export function importProgressFile(file: File): Promise<ProgressMap | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = () => {
      const raw = typeof reader.result === "string" ? reader.result : "";
      resolve(parsePayload(raw));
    };
    reader.readAsText(file);
  });
}

export function exportPlanJson(plan: TrainingPlan, progress: ProgressMap): void {
  const payload: PlanFilePayload = {
    version: 2,
    savedAt: new Date().toISOString(),
    plan,
    progress,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeName = plan.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  link.download = `${safeName}-plan.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// --- Guest plan (unauthenticated plan creation + preview) ---

const GUEST_PLAN_KEY = "buildweeks-guest-plan";
const GUEST_PROGRESS_KEY = "buildweeks-guest-progress";

export type GuestPlanDraft = PlanGeneratorConfig & { name: string };

export function saveGuestPlan(draft: GuestPlanDraft): void {
  localStorage.setItem(GUEST_PLAN_KEY, JSON.stringify(draft));
}

export function loadGuestPlan(): GuestPlanDraft | null {
  try {
    return JSON.parse(localStorage.getItem(GUEST_PLAN_KEY) ?? "null") as GuestPlanDraft | null;
  } catch {
    return null;
  }
}

export function clearGuestPlan(): void {
  localStorage.removeItem(GUEST_PLAN_KEY);
}

export function saveGuestProgress(progress: ProgressMap): void {
  localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(progress));
}

export function loadGuestProgress(): ProgressMap {
  try {
    return JSON.parse(localStorage.getItem(GUEST_PROGRESS_KEY) ?? "{}") as ProgressMap;
  } catch {
    return {};
  }
}

export function clearGuestProgress(): void {
  localStorage.removeItem(GUEST_PROGRESS_KEY);
}

export function importPlanJson(file: File): Promise<ImportedPlan | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = () => {
      try {
        const raw = typeof reader.result === "string" ? reader.result : "";
        const parsed = JSON.parse(raw) as Partial<PlanFilePayload>;
        if (parsed.version === 2 && parsed.plan && parsed.progress !== undefined) {
          resolve({ plan: parsed.plan, progress: parsed.progress });
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    reader.readAsText(file);
  });
}
