import { SAVE_KEY, nextOffer, renownTitle } from "./campaign";
import { missionById } from "./data";
import type { Campaign } from "./types";

export const SLOT_COUNT = 3;
const SLOTS_KEY = "ashmark-slots-v1";
const BACKUP_KEY = "ashmark-slots-v1-bak";
const SETTINGS_KEY = "ashmark-settings-v1";

export type SlotFile = {
  savedAt: number;
  campaign: Campaign;
};

export type Settings = {
  muted: boolean;
  shake: boolean;
};

const EMPTY_SETTINGS: Settings = { muted: false, shake: true };

function storage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function saveIsCompany(campaign: Campaign | null | undefined): campaign is Campaign {
  return Boolean(campaign && campaign.companyName && Array.isArray(campaign.roster) && campaign.roster.length > 0);
}

function asFile(value: unknown): SlotFile | null {
  if (!value || typeof value !== "object") return null;
  const file = value as SlotFile;
  if (!saveIsCompany(file.campaign)) return null;
  return { savedAt: file.savedAt || 0, campaign: file.campaign };
}

function parseSlots(raw: string | null): (SlotFile | null)[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return Array.from({ length: SLOT_COUNT }, (_, index) => asFile(parsed[index]));
  } catch {
    return null;
  }
}

function living(slots: (SlotFile | null)[]) {
  return slots.filter((file) => file && saveIsCompany(file.campaign)).length;
}

export function loadSettings(): Settings {
  const box = storage();
  if (!box) return EMPTY_SETTINGS;
  try {
    const raw = box.getItem(SETTINGS_KEY);
    if (!raw) return EMPTY_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { muted: Boolean(parsed.muted), shake: parsed.shake !== false };
  } catch {
    return EMPTY_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  const box = storage();
  if (!box) return;
  try {
    box.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* keep them in memory */
  }
}

export function loadSlots(): (SlotFile | null)[] {
  const empty = Array.from({ length: SLOT_COUNT }, () => null as SlotFile | null);
  const box = storage();
  if (!box) return empty;
  const primary = parseSlots(box.getItem(SLOTS_KEY));
  const backup = parseSlots(box.getItem(BACKUP_KEY));
  if (primary && living(primary) > 0) return primary;
  if (!primary && backup && living(backup) > 0) {
    try {
      box.setItem(SLOTS_KEY, JSON.stringify(backup));
    } catch {
      /* still show the backup */
    }
    return backup;
  }
  return primary ?? empty;
}

function commit(slots: (SlotFile | null)[], allowEmpty: boolean) {
  const box = storage();
  if (!box) return false;
  if (!allowEmpty && living(slots) === 0) return false;
  try {
    const current = box.getItem(SLOTS_KEY);
    const parsed = parseSlots(current);
    if (current && parsed && living(parsed) > 0) box.setItem(BACKUP_KEY, current);
    box.setItem(SLOTS_KEY, JSON.stringify(slots));
    const check = parseSlots(box.getItem(SLOTS_KEY));
    if (!check) return false;
    if (!allowEmpty && living(check) === 0) return false;
    if (living(check) > 0 && living(parseSlots(box.getItem(BACKUP_KEY)) ?? []) === 0) {
      box.setItem(BACKUP_KEY, JSON.stringify(check));
    }
    return true;
  } catch {
    return false;
  }
}

export function writeSlot(index: number, campaign: Campaign) {
  if (!Number.isInteger(index) || index < 0 || index >= SLOT_COUNT) return false;
  if (!saveIsCompany(campaign)) return false;
  const box = storage();
  if (!box) return false;
  const current = box.getItem(SLOTS_KEY);
  if (current && !parseSlots(current)) return false;
  const slots = parseSlots(current) ?? Array.from({ length: SLOT_COUNT }, () => null as SlotFile | null);
  const existing = slots[index];
  if (existing && existing.campaign.companyName !== campaign.companyName) return false;
  if (
    existing &&
    existing.campaign.cleared.length > campaign.cleared.length &&
    campaign.cleared.length === 0
  ) {
    return false;
  }
  slots[index] = { savedAt: Date.now(), campaign };
  return commit(slots, false);
}

export function clearSlot(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= SLOT_COUNT) return false;
  const box = storage();
  if (!box) return false;
  const current = box.getItem(SLOTS_KEY);
  if (current && !parseSlots(current)) return false;
  const slots = parseSlots(current) ?? Array.from({ length: SLOT_COUNT }, () => null as SlotFile | null);
  slots[index] = null;
  return commit(slots, true);
}

function readLegacy(): Campaign | null {
  const box = storage();
  if (!box) return null;
  const raw = box.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { campaign?: Campaign } & Campaign;
    const campaign = parsed?.campaign?.companyName ? parsed.campaign : parsed;
    if (!saveIsCompany(campaign) || campaign.screen === "title") return null;
    return campaign;
  } catch {
    return null;
  }
}

export function migrateLegacySave() {
  const box = storage();
  if (!box) return;
  const legacy = readLegacy();
  if (!legacy) return;
  const slots = loadSlots();
  const names = slots.map((file) => file?.campaign.companyName);
  if (names.includes(legacy.companyName)) {
    box.removeItem(SAVE_KEY);
    return;
  }
  const empty = slots.findIndex((file) => !file);
  if (empty < 0) return;
  slots[empty] = { savedAt: Date.now(), campaign: legacy };
  if (!commit(slots, false)) return;
  const kept = loadSlots().some((file) => file?.campaign.companyName === legacy.companyName);
  if (kept) box.removeItem(SAVE_KEY);
}

export function shelvedCompanies(): Campaign[] {
  const box = storage();
  if (!box) return [];
  const shown = new Set(loadSlots().flatMap((file) => (file ? [file.campaign.companyName] : [])));
  const backup = parseSlots(box.getItem(BACKUP_KEY)) ?? [];
  const found: Campaign[] = [];
  for (const file of backup) {
    if (!file || shown.has(file.campaign.companyName)) continue;
    if (found.some((campaign) => campaign.companyName === file.campaign.companyName)) continue;
    found.push(file.campaign);
  }
  return found;
}

export function restoreShelved(name: string) {
  const campaign = shelvedCompanies().find((company) => company.companyName === name);
  if (!campaign) return false;
  const slots = loadSlots();
  const empty = slots.findIndex((file) => !file);
  if (empty < 0) return false;
  slots[empty] = { savedAt: Date.now(), campaign };
  return commit(slots, false);
}

export function describeSlot(campaign: Campaign): { title: string; detail: string } {
  let where = "The war table";
  if (campaign.screen === "ending" && campaign.ending === "ruin") where = "Nothing left alive";
  else if (campaign.screen === "ending" && campaign.ending === "kept") where = "The name holds";
  else if (campaign.screen === "ending") where = "The name was spoken";
  else if (campaign.screen === "battle" && campaign.battle) {
    try {
      where = `${missionById(campaign.battle.missionId).name} — on the field`;
    } catch {
      where = "On the field";
    }
  } else if (campaign.cleared.includes("echo")) where = "The echo is still";
  else {
    const next = nextOffer(campaign);
    if (next) {
      try {
        where = missionById(next).name;
      } catch {
        where = "The war table";
      }
    }
  }
  const living = campaign.roster.filter((merc) => merc.alive).length;
  return {
    title: campaign.companyName || "Unnamed",
    detail: `${renownTitle(campaign)} · ${where} · ${living} living · ${campaign.gold} coin`,
  };
}
