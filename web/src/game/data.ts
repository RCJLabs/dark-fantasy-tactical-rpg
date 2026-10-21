import type { Merc, SkillId, SkillKind } from "./types";

export type SkillDef = {
  id: SkillId;
  name: string;
  kind: SkillKind;
  range: number;
  power: number;
  mark?: "ashbrand" | "hexrot" | "blooddebt";
  cooldown: number;
  blurb: string;
};

export const SKILLS: Record<SkillId, SkillDef> = {
  due: {
    id: "due",
    name: "Name's Due",
    kind: "detonate",
    range: 1,
    power: 9,
    cooldown: 2,
    blurb: "Spend a mark at sword's length. A mark another mercenary laid cuts deeper.",
  },
  rothex: {
    id: "rothex",
    name: "Rot Hex",
    kind: "prime",
    range: 3,
    power: 5,
    mark: "hexrot",
    cooldown: 2,
    blurb: "A gnawing mark. It bites at the start of their turn, and a spent Hexrot pins the feet.",
  },
  split: {
    id: "split",
    name: "Split Shaft",
    kind: "detonate",
    range: 4,
    power: 7,
    cooldown: 2,
    blurb: "Spend whatever mark is on them. Hexrot pins. Blooddebt mends the shooter.",
  },
  pyre: {
    id: "pyre",
    name: "Pyre Hymn",
    kind: "heal",
    range: 3,
    power: 9,
    cooldown: 1,
    blurb: "Mend an ally. Or spend Ashbrand or Hexrot on a foe to hurt them and mend everyone near you.",
  },
  owe: {
    id: "owe",
    name: "Owe Me",
    kind: "prime",
    range: 1,
    power: 8,
    mark: "blooddebt",
    cooldown: 2,
    blurb: "A heavy cut that leaves Blooddebt. Whoever spends it is paid in blood returned.",
  },
  standard: {
    id: "standard",
    name: "Raise Standard",
    kind: "banner",
    range: 0,
    power: 0,
    cooldown: 2,
    blurb: "Allies within two tiles lay Ashbrand with their next strike.",
  },
  whisper: {
    id: "whisper",
    name: "Whisper Rot",
    kind: "prime",
    range: 3,
    power: 4,
    mark: "hexrot",
    cooldown: 2,
    blurb: "The chapel's mark.",
  },
  peck: {
    id: "peck",
    name: "Brand-Peck",
    kind: "detonate",
    range: 2,
    power: 6,
    cooldown: 2,
    blurb: "Spends a mark if one is there.",
  },
  sentence: {
    id: "sentence",
    name: "Iron Sentence",
    kind: "detonate",
    range: 1,
    power: 9,
    cooldown: 2,
    blurb: "Spends a mark on the blade.",
  },
  unname: {
    id: "unname",
    name: "Unname",
    kind: "hexlord",
    range: 2,
    power: 11,
    cooldown: 2,
    blurb: "Spends a mark. If you have none, it brands you with Hexrot instead.",
  },
  none: {
    id: "none",
    name: "None",
    kind: "none",
    range: 0,
    power: 0,
    cooldown: 0,
    blurb: "",
  },
};

export type ActorDef = {
  id: string;
  name: string;
  role: string;
  art: string;
  maxHp: number;
  atk: number;
  def: number;
  mov: number;
  rng: number;
  skill: SkillId;
  fly?: boolean;
  brandsOnStrike?: boolean;
  cost?: number;
  blurb: string;
};

export const MERC_DEFS: ActorDef[] = [
  {
    id: "sera",
    name: "Sera Voss",
    role: "Captain",
    art: "sera",
    maxHp: 30,
    atk: 8,
    def: 3,
    mov: 4,
    rng: 1,
    skill: "due",
    brandsOnStrike: true,
    blurb: "Her strikes lay Ashbrand. She spends a mark only when she must.",
  },
  {
    id: "marrow",
    name: "Marrow",
    role: "Hexer",
    art: "marrow",
    maxHp: 18,
    atk: 7,
    def: 1,
    mov: 3,
    rng: 3,
    skill: "rothex",
    blurb: "Primes Hexrot. The rot works while the rest of the company decides who spends it.",
  },
  {
    id: "isk",
    name: "Isk",
    role: "Archer",
    art: "isk",
    maxHp: 20,
    atk: 7,
    def: 2,
    mov: 4,
    rng: 4,
    skill: "split",
    blurb: "The company's spender. A mark is a target. Split Shaft makes it a sentence.",
  },
  {
    id: "vetch",
    name: "Vetch",
    role: "Ditch knife",
    art: "vetch",
    maxHp: 24,
    atk: 7,
    def: 2,
    mov: 4,
    rng: 1,
    skill: "owe",
    cost: 36,
    blurb: "A knife from the ditch. Lays Blooddebt, takes coin, and does not ask the company's name.",
  },
  {
    id: "halden",
    name: "Sister Halden",
    role: "Cantor",
    art: "halden",
    maxHp: 22,
    atk: 4,
    def: 2,
    mov: 3,
    rng: 2,
    skill: "pyre",
    cost: 50,
    blurb: "Turns a brand into a hymn. Hire her after the orchard if the wounded start stacking.",
  },
  {
    id: "bran",
    name: "Bran the Hound",
    role: "Berserk",
    art: "bran",
    maxHp: 36,
    atk: 9,
    def: 2,
    mov: 3,
    rng: 1,
    skill: "owe",
    cost: 72,
    blurb: "Primes Blooddebt with a cleaver. Whoever spends the debt is stitched for it.",
  },
  {
    id: "quill",
    name: "Quill",
    role: "Standard",
    art: "quill",
    maxHp: 20,
    atk: 5,
    def: 3,
    mov: 3,
    rng: 1,
    skill: "standard",
    cost: 58,
    blurb: "Raises the banner so the whole company can brand. Quiet, and hard to replace.",
  },
];

export const ENEMY_DEFS: Record<string, ActorDef> = {
  risen: {
    id: "risen",
    name: "Risen",
    role: "Spear",
    art: "risen",
    maxHp: 15,
    atk: 6,
    def: 2,
    mov: 3,
    rng: 1,
    skill: "none",
    blurb: "Toll-dead. They still know how to walk in a line.",
  },
  crow: {
    id: "crow",
    name: "Blight Crow",
    role: "Beast",
    art: "crow",
    maxHp: 12,
    atk: 7,
    def: 0,
    mov: 4,
    rng: 2,
    skill: "peck",
    fly: true,
    blurb: "Ignores mud and brush. Spends a mark if you were careless enough to wear one.",
  },
  cultist: {
    id: "cultist",
    name: "Cultist",
    role: "Hex",
    art: "cultist",
    maxHp: 14,
    atk: 5,
    def: 1,
    mov: 3,
    rng: 1,
    skill: "whisper",
    blurb: "Primes Hexrot. Kill them or spend the rot before it spends you.",
  },
  revenant: {
    id: "revenant",
    name: "Iron Revenant",
    role: "Plate",
    art: "revenant",
    maxHp: 30,
    atk: 8,
    def: 4,
    mov: 2,
    rng: 1,
    skill: "sentence",
    blurb: "Slow plate. Rubble is a gift to anything that shoots them.",
  },
  knight: {
    id: "knight",
    name: "The Unnamed",
    role: "Knight",
    art: "knight",
    maxHp: 40,
    atk: 10,
    def: 4,
    mov: 3,
    rng: 1,
    skill: "unname",
    blurb: "Spends your marks. If you have none, it writes Hexrot on you and waits.",
  },
  brander: {
    id: "brander",
    name: "Name-Taker",
    role: "Brand",
    art: "knight",
    maxHp: 28,
    atk: 8,
    def: 3,
    mov: 3,
    rng: 1,
    skill: "none",
    brandsOnStrike: true,
    blurb: "Their strike lays Ashbrand. Spend it, or wear it while they do.",
  },
  debtor: {
    id: "debtor",
    name: "Debt Cleaver",
    role: "Debt",
    art: "revenant",
    maxHp: 34,
    atk: 9,
    def: 3,
    mov: 3,
    rng: 1,
    skill: "owe",
    blurb: "Primes Blooddebt. Whoever spends it is paid in their own blood.",
  },
  spender: {
    id: "spender",
    name: "Ash Crow",
    role: "Spender",
    art: "crow",
    maxHp: 16,
    atk: 7,
    def: 1,
    mov: 4,
    rng: 4,
    skill: "split",
    fly: true,
    blurb: "Spends whatever mark is on you. Ashbrand cuts. Blooddebt stitches the bird.",
  },
  lantern: {
    id: "lantern",
    name: "Corpse Lantern",
    role: "Wisp",
    art: "lantern",
    maxHp: 11,
    atk: 5,
    def: 0,
    mov: 4,
    rng: 2,
    skill: "whisper",
    fly: true,
    blurb: "A jaw in a pale fire. It writes Hexrot and does not care about mud.",
  },
  wolf: {
    id: "wolf",
    name: "Ash Wolf",
    role: "Beast",
    art: "wolf",
    maxHp: 18,
    atk: 8,
    def: 1,
    mov: 4,
    rng: 1,
    skill: "none",
    brandsOnStrike: true,
    blurb: "The bite lays Ashbrand. Spend it before the next mouth does.",
  },
  thorn: {
    id: "thorn",
    name: "Thorn Wife",
    role: "Briar",
    art: "thorn",
    maxHp: 22,
    atk: 6,
    def: 2,
    mov: 3,
    rng: 1,
    skill: "whisper",
    blurb: "A saint's mask on a body of briar. She primes Hexrot from the trees.",
  },
  saint: {
    id: "saint",
    name: "Drowned Saint",
    role: "Radiant",
    art: "saint",
    maxHp: 36,
    atk: 9,
    def: 3,
    mov: 2,
    rng: 2,
    skill: "unname",
    blurb: "Cold fire in the ribs. It spends your marks, or writes Hexrot and waits.",
  },
  wyrm: {
    id: "wyrm",
    name: "Grave Wyrm",
    role: "Wyrm",
    art: "wyrm",
    maxHp: 44,
    atk: 11,
    def: 3,
    mov: 2,
    rng: 1,
    skill: "sentence",
    blurb: "Bone plates and a man's jaw. Slow. It spends whatever mark you are wearing.",
  },
};

export function mercDef(id: string): ActorDef {
  const found = MERC_DEFS.find((d) => d.id === id);
  if (!found) throw new Error(`missing merc ${id}`);
  return found;
}

export type Mission = {
  id: string;
  name: string;
  place: string;
  brief: string;
  rows: string[];
  playerSpawns: { x: number; y: number }[];
  enemies: { id: string; defId: string; name: string; x: number; y: number; leader?: boolean }[];
  objective: "rout" | "leader";
  gold: number;
  renown: number;
  opening: string;
  win: string;
  loss: string;
  march?: 2;
  ground?: string;
  radiant?: boolean;
  after?: string;
};

const SPAWNS = [
  { x: 0, y: 6 },
  { x: 1, y: 6 },
  { x: 2, y: 6 },
  { x: 3, y: 6 },
];

export const MISSIONS: Mission[] = [
  {
    id: "toll",
    name: "The Toll Road",
    place: "West march",
    brief:
      "The dead still collect at the ash gate. Put a brand on one and let someone else spend it. That is the whole trade.",
    rows: ["........", "..r..r..", "..r..r..", "........", "...tt...", "........", "........"],
    playerSpawns: SPAWNS,
    enemies: [
      { id: "e-toll-1", defId: "risen", name: "Toll Corpse", x: 6, y: 1 },
      { id: "e-toll-2", defId: "risen", name: "Ditch Corpse", x: 7, y: 0 },
    ],
    objective: "rout",
    gold: 40,
    renown: 12,
    opening: "Brand with Sera's strike. Spend it with Isk's Split Shaft. A friend's mark cuts deeper.",
    win: "The gate is quiet. A carter asks what to call you, and does not like the silence that follows.",
    loss: "You leave the toll to the dead. They do not waive the fee.",
  },
  {
    id: "orchard",
    name: "Ash Orchard",
    place: "Crow trees",
    brief:
      "Blight-crows nest in the thickets, and thickets break a shot. Marrow can rot one. Do not stand in the open and argue.",
    rows: ["t.t..t.t", ".t....t.", "t..rr..t", "...rr...", "t......t", ".t....t.", "........"],
    playerSpawns: SPAWNS,
    enemies: [
      { id: "e-orch-1", defId: "crow", name: "Orchard Crow", x: 1, y: 0 },
      { id: "e-orch-2", defId: "crow", name: "Second Crow", x: 6, y: 0 },
      { id: "e-orch-3", defId: "risen", name: "Root-Dead", x: 4, y: 2 },
    ],
    objective: "rout",
    gold: 48,
    renown: 14,
    opening: "Thickets block sight. Crows ignore mud and brush. Hexrot on a crow, then spend it.",
    win: "Feathers in the mud. A sister watching from the ditch offers steel and a hymn, for coin.",
    loss: "The orchard keeps your blood and none of your name.",
  },
  {
    id: "chapel",
    name: "The Weeping Chapel",
    place: "Nave",
    brief:
      "The Mouth primes Hexrot on the living. End the Mouth and the nave empties. Spend the rot if it lands on you — or on them.",
    rows: ["t##..##t", ".#....#.", ".#.tt.#.", ".#....#.", "..#..#..", "........", "........"],
    playerSpawns: SPAWNS,
    enemies: [
      { id: "e-chap-1", defId: "cultist", name: "The Mouth", x: 4, y: 1, leader: true },
      { id: "e-chap-2", defId: "risen", name: "Pew Dead", x: 2, y: 3 },
      { id: "e-chap-3", defId: "risen", name: "Pew Dead", x: 5, y: 3 },
    ],
    objective: "leader",
    gold: 62,
    renown: 16,
    opening: "Kill the Mouth, or break every body in the nave. Hexrot on your own can be spent by a friend.",
    win: "The hymn dies in the rafters. Somewhere a cleaver laughs and asks the rate for a hound.",
    loss: "You spill out of the nave with their prayer still in your teeth.",
  },
  {
    id: "iron",
    name: "Iron Mile",
    place: "Causeway",
    brief:
      "Revenants hold the narrows. Rubble shelters them from arrows. Walk the gap, brand the plate, and do not duel them one at a time.",
    rows: ["..m..m..", ".##..##.", ".##..##.", "...rr...", ".##..##.", ".##..##.", "........"],
    playerSpawns: SPAWNS,
    enemies: [
      { id: "e-iron-1", defId: "revenant", name: "Mile Warden", x: 3, y: 0 },
      { id: "e-iron-2", defId: "revenant", name: "Mile Warden", x: 4, y: 0 },
      { id: "e-iron-3", defId: "cultist", name: "Mile Cantor", x: 5, y: 1 },
    ],
    objective: "rout",
    gold: 74,
    renown: 18,
    opening: "The gap is the fight. Plate is miserable to chip. Marks make the arithmetic kind.",
    win: "The causeway is a rumor you own. A banner-bearer without a lord is waiting at the far post.",
    loss: "Iron does not pursue. It does not need to.",
  },
  {
    id: "naming",
    name: "The Naming",
    place: "Black keep",
    brief:
      "The Unnamed has heard the word you are becoming. Kill that knight and the marches have to say you out loud.",
    rows: ["t......t", ".t....t.", "..r..r..", "........", "..r..r..", ".t....t.", "........"],
    playerSpawns: SPAWNS,
    enemies: [
      { id: "e-name-1", defId: "knight", name: "The Unnamed", x: 4, y: 0, leader: true },
      { id: "e-name-2", defId: "revenant", name: "Keep Plate", x: 1, y: 2 },
      { id: "e-name-3", defId: "cultist", name: "Keep Mouth", x: 6, y: 2 },
    ],
    objective: "leader",
    gold: 90,
    renown: 24,
    opening: "The knight spends marks. Do not wear Hexrot into its reach. Brand it, then spend the brand together.",
    win: "The helm comes off to no face anyone will claim. What is left says your company's name, and means it.",
    loss: "The Unnamed keeps the field, and your name stays a private joke.",
  },
  {
    id: "answer",
    name: "The Answered Road",
    place: "The name, heard",
    march: 2,
    ground: "toll",
    brief:
      "They heard what the marches called you. One writes Ashbrand when they hit. The crow spends it. Do not leave a brand on your own.",
    rows: ["........", "..r..r..", "........", "...tt...", "........", "..m..m..", "........"],
    playerSpawns: SPAWNS,
    enemies: [
      { id: "e-ans-1", defId: "brander", name: "Name-Taker", x: 3, y: 1 },
      { id: "e-ans-2", defId: "spender", name: "Ash Crow", x: 6, y: 0 },
      { id: "e-ans-3", defId: "risen", name: "Road Dead", x: 1, y: 2 },
    ],
    objective: "rout",
    gold: 44,
    renown: 16,
    opening: "Their strike brands you. The crow spends Ashbrand. Spend theirs first, or do not wear one.",
    win: "The road goes quiet with your name still in it. The market down the march is already pricing the rot.",
    loss: "They spend the brand you earned and keep the purse.",
  },
  {
    id: "market",
    name: "Hex Market",
    place: "The stalls",
    march: 2,
    ground: "orchard",
    brief:
      "Two mouths prime Hexrot. A cleaver leaves Blooddebt. Thickets hide them. Spend the rot, or it spends you.",
    rows: ["t.t..t.t", ".t....t.", "t..rr..t", "...rr...", "t......t", ".t....t.", "........"],
    playerSpawns: SPAWNS,
    enemies: [
      { id: "e-mkt-1", defId: "cultist", name: "Stall Mouth", x: 1, y: 0 },
      { id: "e-mkt-2", defId: "cultist", name: "Stall Mouth", x: 6, y: 1 },
      { id: "e-mkt-3", defId: "debtor", name: "Debt Cleaver", x: 4, y: 2 },
    ],
    objective: "rout",
    gold: 56,
    renown: 18,
    opening: "Hexrot from the stalls. Blooddebt from the cleaver. A friend's mark still cuts deeper — so does theirs.",
    win: "The stalls close. Something in the keep is saying your name back, and it is not a compliment.",
    loss: "You leave wearing their marks. The market does not give refunds.",
  },
  {
    id: "echo",
    name: "The Echo",
    place: "The keep, again",
    march: 2,
    ground: "naming",
    brief:
      "The Echo wears your name and spends every mark it can reach. End it. The brand and the debt are only the choir.",
    rows: ["t......t", ".t....t.", "..r..r..", "........", "..##....", ".t....t.", "........"],
    playerSpawns: SPAWNS,
    enemies: [
      { id: "e-echo-1", defId: "knight", name: "The Echo", x: 4, y: 0, leader: true },
      { id: "e-echo-2", defId: "brander", name: "Name-Taker", x: 1, y: 2 },
      { id: "e-echo-3", defId: "debtor", name: "Debt Cleaver", x: 6, y: 2 },
    ],
    objective: "leader",
    gold: 80,
    renown: 22,
    opening: "The Echo spends marks. The taker writes Ashbrand. The cleaver leaves Blooddebt. Point the same rules back.",
    win: "The echo says the name once more, and then it is only yours. The company keeps the marches, and the debt, and the word.",
    loss: "The echo keeps the name. You leave without it.",
  },
  {
    id: "mere",
    name: "The Lantern Mere",
    place: "Radiant",
    radiant: true,
    after: "toll",
    ground: "toll",
    brief: "Lights over the black water. They write Hexrot. The wolf writes Ashbrand when it bites.",
    rows: ["........", "..m..m..", ".m....m.", "...tt...", "..m..m..", "........", "........"],
    playerSpawns: SPAWNS,
    enemies: [
      { id: "e-mere-1", defId: "lantern", name: "Corpse Lantern", x: 2, y: 0 },
      { id: "e-mere-2", defId: "lantern", name: "Corpse Lantern", x: 5, y: 1 },
      { id: "e-mere-3", defId: "wolf", name: "Ash Wolf", x: 3, y: 2 },
    ],
    objective: "rout",
    gold: 46,
    renown: 8,
    opening: "The lanterns prime Hexrot and ignore the mire. The wolf's bite is Ashbrand. Spend both before they do.",
    win: "The mere goes dark. The carters will pay, and they will not ask what the lights were.",
    loss: "You leave the lights burning. They follow the ditch home.",
  },
  {
    id: "thornwife",
    name: "The Thorn Wife",
    place: "Radiant",
    radiant: true,
    after: "orchard",
    ground: "orchard",
    brief: "Something in the crow trees wears a saint's mask. She hides in the thicket and writes Hexrot. The wolves brand.",
    rows: ["t.t..t.t", ".t....t.", "t..r...t", "...tt...", "t......t", ".t....t.", "........"],
    playerSpawns: SPAWNS,
    enemies: [
      { id: "e-thorn-1", defId: "thorn", name: "Thorn Wife", x: 4, y: 1 },
      { id: "e-thorn-2", defId: "wolf", name: "Ash Wolf", x: 1, y: 2 },
      { id: "e-thorn-3", defId: "wolf", name: "Ash Wolf", x: 6, y: 2 },
    ],
    objective: "rout",
    gold: 52,
    renown: 10,
    opening: "Thickets hide her past a step. The wolves lay Ashbrand. Cut the mask, or spend the brand first.",
    win: "The mask splits. The orchard keeps the briar and nothing else.",
    loss: "The wife keeps the trees. You leave wearing her rot.",
  },
  {
    id: "drown",
    name: "Saint's Drown",
    place: "Radiant",
    radiant: true,
    after: "chapel",
    ground: "chapel",
    brief: "A drowned saint stands in the chapel water and spends every mark it can reach. The lanterns only feed it.",
    rows: ["t......t", ".m....m.", "..r..r..", "........", "...##...", ".t....t.", "........"],
    playerSpawns: SPAWNS,
    enemies: [
      { id: "e-drown-1", defId: "saint", name: "Drowned Saint", x: 4, y: 0, leader: true },
      { id: "e-drown-2", defId: "lantern", name: "Corpse Lantern", x: 1, y: 1 },
      { id: "e-drown-3", defId: "lantern", name: "Corpse Lantern", x: 6, y: 1 },
    ],
    objective: "leader",
    gold: 64,
    renown: 12,
    opening: "End the saint. It spends your marks, and if you have none it writes Hexrot and waits. The lanterns are only mouths.",
    win: "The cold fire goes out of the ribs. The chapel is only stone again.",
    loss: "The saint keeps your marks and the water.",
  },
  {
    id: "wyrmmile",
    name: "The Grave Wyrm",
    place: "Radiant",
    radiant: true,
    after: "iron",
    ground: "iron",
    brief: "A wyrm has come up through the iron plates. It spends whatever you are wearing. The wolves write the brand for it.",
    rows: ["........", "..r..r..", "........", "...rr...", "..#..#..", "........", "........"],
    playerSpawns: SPAWNS,
    enemies: [
      { id: "e-wyrm-1", defId: "wyrm", name: "Grave Wyrm", x: 3, y: 1, leader: true },
      { id: "e-wyrm-2", defId: "wolf", name: "Ash Wolf", x: 1, y: 2 },
      { id: "e-wyrm-3", defId: "wolf", name: "Ash Wolf", x: 6, y: 0 },
    ],
    objective: "leader",
    gold: 70,
    renown: 12,
    opening: "The wyrm is slow and spends marks. Do not stand in its mouth while you are still branded.",
    win: "The plates close over the wyrm. The mile is only iron again, and it pays.",
    loss: "The wyrm keeps the mile. You are a mark it already spent.",
  },
  {
    id: "choir",
    name: "The Pale Choir",
    place: "Radiant",
    radiant: true,
    after: "naming",
    ground: "naming",
    brief: "After the name, the marches answer with a saint, a lantern, and the wyrm. Same rules. Older mouths.",
    rows: ["t......t", ".t.mm.t.", "..r..r..", "........", "...tt...", ".m....m.", "........"],
    playerSpawns: SPAWNS,
    enemies: [
      { id: "e-choir-1", defId: "saint", name: "Drowned Saint", x: 4, y: 0, leader: true },
      { id: "e-choir-2", defId: "lantern", name: "Corpse Lantern", x: 1, y: 1 },
      { id: "e-choir-3", defId: "wyrm", name: "Grave Wyrm", x: 6, y: 2 },
    ],
    objective: "leader",
    gold: 84,
    renown: 14,
    opening: "The saint spends. The lantern primes Hexrot. The wyrm spends whatever is left. Kill the saint.",
    win: "The choir stops. The name is still yours. The marches are not emptier, only quieter.",
    loss: "The choir keeps the field and says your name the wrong way.",
  },
];

export const MISSION_ORDER = MISSIONS.filter((mission) => !mission.radiant).map((mission) => mission.id);

export function missionById(id: string): Mission {
  const found = MISSIONS.find((m) => m.id === id);
  if (!found) throw new Error(`missing mission ${id}`);
  return found;
}

export function makeMerc(def: ActorDef): Merc {
  return {
    id: `m-${def.id}`,
    defId: def.id,
    name: def.name,
    role: def.role,
    art: def.art,
    hp: def.maxHp,
    maxHp: def.maxHp,
    atk: def.atk,
    def: def.def,
    mov: def.mov,
    rng: def.rng,
    skill: def.skill,
    fly: Boolean(def.fly),
    brandsOnStrike: Boolean(def.brandsOnStrike),
    scars: 0,
    alive: true,
    known: [],
    cost: def.cost ?? 0,
    blurb: def.blurb,
  };
}

export function rankFor(renown: number, named: boolean): string {
  if (named) return "A spoken name";
  if (renown >= 56) return "Feared on the mile";
  if (renown >= 38) return "Known in the nave";
  if (renown >= 22) return "Tollroad steel";
  if (renown >= 10) return "Mentioned once";
  return "Nameless";
}

export const MARK_LABEL: Record<"ashbrand" | "hexrot" | "blooddebt", string> = {
  ashbrand: "Ashbrand",
  hexrot: "Hexrot",
  blooddebt: "Blooddebt",
};

export const MARK_SHORT: Record<"ashbrand" | "hexrot" | "blooddebt", string> = {
  ashbrand: "Ash",
  hexrot: "Hex",
  blooddebt: "Debt",
};

export const HOT_MEAL = 16;
