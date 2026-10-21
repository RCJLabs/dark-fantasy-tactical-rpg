import { asset } from "./assets";

const PLACES = ["toll", "orchard", "chapel", "iron", "naming"] as const;

export const LOADING_ART = asset("/art/loading.webp");

export const LOADING_POOL = [
  LOADING_ART,
  asset("/art/loading/01-toll.webp"),
  asset("/art/loading/02-orchard.webp"),
  asset("/art/loading/03-chapel.webp"),
  asset("/art/loading/04-iron.webp"),
  asset("/art/loading/05-naming.webp"),
  asset("/art/loading/06-table.webp"),
  asset("/art/loading/07-captain.webp"),
  asset("/art/loading/08-hexer.webp"),
  asset("/art/loading/09-hound.webp"),
  asset("/art/loading/10-archer.webp"),
  asset("/art/loading/11-aftermath.webp"),
  asset("/art/loading/12-echo.webp"),
  asset("/art/loading/13-camp.webp"),
  asset("/art/loading/14-veil.webp"),
  asset("/art/loading/15-market.webp"),
];

export function pickLoadingArt(): string {
  return LOADING_POOL[Math.floor(Math.random() * LOADING_POOL.length)];
}

export const TERRAIN_FILES = [
  asset("/art/terrain/toll.webp"),
  asset("/art/terrain/orchard.webp"),
  asset("/art/terrain/chapel.webp"),
  asset("/art/terrain/iron.webp"),
  asset("/art/terrain/naming.webp"),
  asset("/art/terrain/forest-a.webp"),
  asset("/art/terrain/forest-b.webp"),
  asset("/art/terrain/yew.webp"),
  asset("/art/terrain/rubble.webp"),
  asset("/art/terrain/mire.webp"),
  asset("/art/terrain/wall.webp"),
  asset("/art/terrain/wall-iron.webp"),
];

const ready = new Set<string>();
const pending = new Map<string, Promise<void>>();

export function fieldFiles(place: string): string[] {
  const trees =
    place === "chapel" || place === "naming"
      ? [asset("/art/terrain/yew.webp")]
      : [asset("/art/terrain/forest-a.webp"), asset("/art/terrain/forest-b.webp")];
  const wall = place === "iron" ? asset("/art/terrain/wall-iron.webp") : asset("/art/terrain/wall.webp");
  return [asset(`/art/terrain/${place}.webp`), ...trees, asset("/art/terrain/rubble.webp"), asset("/art/terrain/mire.webp"), wall];
}

export function decodeImage(src: string): Promise<void> {
  const img = new Image();
  img.decoding = "sync";
  img.src = src;
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();
  return img.decode().then(
    () => undefined,
    () => undefined,
  );
}

export function terrainReady(place: string): boolean {
  return ready.has(place);
}

export function prepareTerrain(place: string): Promise<void> {
  if (ready.has(place)) return Promise.resolve();
  let job = pending.get(place);
  if (!job) {
    job = Promise.all(fieldFiles(place).map(decodeImage)).then(() => {
      ready.add(place);
    });
    pending.set(place, job);
  }
  return job;
}

if (typeof window !== "undefined") {
  for (const place of PLACES) prepareTerrain(place);
}
