import { makeMerc, MERC_DEFS } from "./data";
import { initialCampaign, nextOffer, radiantOffers, reducer, SAVE_KEY, visibleMissions } from "./campaign";
import { loadSlots, migrateLegacySave, writeSlot } from "./saves";
import { applyBattle, aimChip, bootBattle, forecastStrike, hasLos, rawDamage, reachable, resolveEnemyPhase, strikeTargets, watchCells, watchTriggers } from "./sim";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const mercs = MERC_DEFS.filter((d) => !d.cost).map(makeMerc);
let battle = bootBattle("toll", mercs, 7);
const sera = battle.units.find((u) => u.defId === "sera")!;
const foe = battle.units.find((u) => u.team === "enemy")!;
assert(reachable(battle, sera).length > 0, "sera can move");
assert(hasLos(["...", "###", "..."], 0, 0, 0, 2) === false, "wall blocks sight");
assert(hasLos(["...", "...", "..."], 0, 0, 2, 2), "open sight");
assert(rawDamage(8, 2, 0, 1.5, 2) > rawDamage(8, 2, 0, 1, 0), "spent mark hits harder");

sera.x = foe.x;
sera.y = Math.min(6, foe.y + 1);
battle = applyBattle(battle, { type: "strike", unitId: sera.id, targetId: foe.id });
const branded = battle.units.find((u) => u.id === foe.id)!;
const striker = battle.units.find((u) => u.id === sera.id)!;
assert(striker.acted, "strike spends the action");
if (!branded.downed) {
  assert(branded.mark?.kind === "ashbrand" && branded.mark.sourceId === sera.id, "sera brands");
}

const isk = battle.units.find((u) => u.defId === "isk")!;
if (!branded.downed) {
  isk.x = branded.x;
  isk.y = Math.min(6, branded.y + 1);
  const before = branded.hp;
  battle = applyBattle(battle, { type: "skill", unitId: isk.id, targetId: branded.id });
  const after = battle.units.find((u) => u.id === branded.id)!;
  assert(after.mark === null || after.downed, "isk spends the mark");
  assert(after.hp < before || after.downed, "detonate deals damage");
}

battle = applyBattle(battle, { type: "end-phase" });
assert(battle.phase === "enemy" || battle.outcome !== null, "enemy phase or already over");
if (!battle.outcome) {
  const frames = resolveEnemyPhase(battle);
  assert(frames.length > 0, "enemy acts");
  const last = frames[frames.length - 1];
  assert(last.phase === "player" || last.outcome !== null, "phase returns or ends");
}

const read = bootBattle("toll", mercs, 3);
const reader = read.units.find((u) => u.defId === "sera")!;
const marked = read.units.find((u) => u.team === "enemy")!;
reader.x = marked.x;
reader.y = Math.max(0, marked.y - 1);
const chip = aimChip(read, reader, marked, false);
assert(/^\d+–\d+ ash$/.test(chip), `strike chip names the brand, got ${chip}`);
reader.watch = true;
const lane = watchCells(read);
assert(lane.length > 0, "a watch has a reach");
assert(!lane.includes(`${reader.x},${reader.y}`), "the watcher is not inside their own cut");
const triggers = new Set(watchTriggers(read));
assert([...triggers].every((cell) => lane.includes(cell)), "a Watch only cuts inside its reach");

const cut = mercs.map((m) => ({ ...m }));
const seraCut = cut.find((m) => m.defId === "sera")!;
seraCut.scars = 2;
seraCut.maxHp = 10;
const scarred = bootBattle("toll", cut, 1);
const markedSera = scarred.units.find((u) => u.defId === "sera")!;
assert(markedSera.scars === 2 && markedSera.frail, "a scarred blade carries the wound onto the field");
const clean = scarred.units.find((u) => u.defId === "isk")!;
assert(clean.scars === 0 && !clean.frail, "an unbled blade stays clean");

const field = bootBattle("toll", mercs, 1);
field.map = field.map.map(() => ".......");
const bow = field.units.find((u) => u.defId === "isk")!;
const body = field.units.find((u) => u.team === "enemy")!;
bow.x = 0;
bow.y = 3;
body.x = 3;
body.y = 3;
const row = (ch: string) => {
  const line = ".......".split("");
  line[3] = ch;
  field.map[3] = line.join("");
};
row(".");
const open = forecastStrike(field, bow, body);
assert(strikeTargets(field, bow).some((t) => t.id === body.id), "open ground can be shot");
row("t");
assert(!strikeTargets(field, bow).some((t) => t.id === body.id), "forest hides from a shot");
bow.x = 2;
assert(strikeTargets(field, bow).some((t) => t.id === body.id), "beside the trees, the steel still finds them");
bow.x = 0;
bow.fly = true;
assert(strikeTargets(field, bow).some((t) => t.id === body.id), "a flyer sees into the trees");
bow.fly = false;
row("m");
const bog = forecastStrike(field, bow, body);
assert(Number(bog.split("–")[0]) > Number(open.split("–")[0]), "mire takes grit");
row("r");
const cover = forecastStrike(field, bow, body);
assert(Number(cover.split("–")[0]) < Number(open.split("–")[0]), "rubble covers arrows");

const company = reducer(initialCampaign(), { type: "new-game", name: "Ash" });
const afterToll = { ...company, gold: 40, cleared: ["toll"], screen: "table" as const };
const hired = reducer(afterToll, { type: "recruit", defId: "vetch" });
assert(hired.roster.some((m) => m.defId === "vetch") && hired.gold === 4, "toll coin buys a blade");
const turned = reducer(afterToll, { type: "refuse", missionId: "orchard" });
assert(turned.bitter.includes("chapel"), "refusing the orchard makes the chapel worse");
assert(turned.roster.some((m) => m.scars > 0), "someone pays for turning the work down");
assert(turned.roster.length === hired.roster.length - 1, "one company hired, the other only bled");
const mean = bootBattle("chapel", turned.roster.filter((m) => m.alive), 2, true);
const plain = bootBattle("chapel", turned.roster.filter((m) => m.alive), 2, false);
assert(
  mean.units.filter((u) => u.team === "enemy").length === plain.units.filter((u) => u.team === "enemy").length + 1,
  "a worse contract brings another body",
);
const wrong = reducer(afterToll, { type: "refuse", missionId: "toll" });
assert(wrong.refused.length === 0, "you can only turn down the work in front of you");

const named = reducer(
  { ...company, cleared: ["toll", "orchard", "chapel", "iron", "naming"], screen: "aftermath" },
  { type: "close-aftermath" },
);
assert(named.screen === "table", "the name is not the end of the company");
assert(named.ending === null, "naming does not close the book");
assert(nextOffer(named) === "answer", "the second table opens on the answered road");
const answered = bootBattle("answer", named.roster.filter((m) => m.alive), 3);
assert(answered.units.some((u) => u.team === "enemy" && u.brandsOnStrike), "the second march writes Ashbrand");
assert(
  answered.units.some((u) => u.skill === "split" || u.skill === "owe" || u.skill === "whisper"),
  "the second march spends the same marks",
);
const kept = reducer(
  { ...named, cleared: [...named.cleared, "answer", "market", "echo"], screen: "aftermath" },
  { type: "close-aftermath" },
);
assert(kept.screen === "ending" && kept.ending === "kept", "the echo is the end, and the name holds");

const mere = bootBattle("mere", mercs, 4);
assert(mere.units.some((unit) => unit.fly && unit.skill === "whisper"), "a lantern writes hex and ignores the mire");
assert(mere.units.some((unit) => unit.brandsOnStrike && unit.art === "wolf"), "the ash wolf brands when it bites");
assert(radiantOffers(afterToll).some((mission) => mission.id === "mere"), "the mere opens once the toll is kept");
assert(!visibleMissions(afterToll).some((mission) => mission.radiant), "radiant work does not replace the march");
assert(!radiantOffers(company).some((mission) => mission.id === "mere"), "no radiant contract before the toll");

{
  const store = new Map<string, string>();
  const box = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  };
  const previous = globalThis.localStorage;
  globalThis.localStorage = box as unknown as Storage;
  try {
    const marched = { ...company, cleared: ["toll"], gold: 90, screen: "table" as const };
    assert(writeSlot(0, marched), "a company is written");
    assert(!writeSlot(0, { ...marched, roster: [] }), "an empty company cannot overwrite the book");
    assert(loadSlots()[0]?.campaign.gold === 90, "the coin is still there");
    const other = reducer(initialCampaign(), { type: "new-game", name: "Other" });
    assert(!writeSlot(0, other), "another company cannot take the file");
    const fresh = reducer(initialCampaign(), { type: "new-game", name: "Ash" });
    assert(!writeSlot(0, fresh), "a new company of the same name cannot erase the march");
    assert(Boolean(loadSlots()[0]?.campaign.cleared.includes("toll")), "the toll stays kept");
    localStorage.removeItem("ashmark-slots-v1");
    assert(loadSlots()[0]?.campaign.companyName === "Ash", "a missing book is copied back");
    localStorage.setItem("ashmark-slots-v1", "{");
    assert(!writeSlot(0, fresh), "a broken book is not replaced");
    assert(localStorage.getItem("ashmark-slots-v1") === "{", "the broken book is left for the copy");
    store.clear();
    localStorage.setItem(SAVE_KEY, "{");
    migrateLegacySave();
    assert(localStorage.getItem(SAVE_KEY) === "{", "an unreadable old save is not thrown away");
  } finally {
    globalThis.localStorage = previous;
  }
}

console.log("ashmark selfcheck ok");
