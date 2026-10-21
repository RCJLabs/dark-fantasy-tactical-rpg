export type Terrain = "." | "#" | "r" | "t" | "m";

export type MarkKind = "ashbrand" | "hexrot" | "blooddebt";

export type SkillId =
  | "due"
  | "rothex"
  | "split"
  | "pyre"
  | "owe"
  | "standard"
  | "whisper"
  | "peck"
  | "sentence"
  | "unname"
  | "none";

export type SkillKind = "prime" | "detonate" | "heal" | "banner" | "hexlord" | "none";

export type Team = "player" | "enemy";

export type Mark = {
  kind: MarkKind;
  turns: number;
  sourceId: string;
  bite?: number;
};

export type BattleUnit = {
  id: string;
  defId: string;
  name: string;
  team: Team;
  role: string;
  art: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  mov: number;
  rng: number;
  skill: SkillId;
  fly: boolean;
  leader: boolean;
  brandsOnStrike: boolean;
  inspired: boolean;
  inspiredSharp?: boolean;
  inspiredBonus?: number;
  known?: string[];
  mark: Mark | null;
  pinned: number;
  pinBite?: number;
  lastStood?: number;
  cooldown: number;
  acted: boolean;
  moved: boolean;
  ticked: boolean;
  watch: boolean;
  downed: boolean;
  scars: number;
  frail: boolean;
  fromX: number | null;
  fromY: number | null;
};

export type FxTone = "hurt" | "heal" | "mark" | "down";

export type FxKind = "melee" | "shot" | "hex" | "heal";

export type BattleFx = {
  serial: number;
  unitId: string;
  text: string;
  tone: FxTone;
  sourceId?: string;
  kind?: FxKind;
};

export type BattleState = {
  missionId: string;
  objective: "rout" | "leader";
  map: string[];
  units: BattleUnit[];
  phase: "player" | "enemy";
  round: number;
  log: string[];
  outcome: null | "victory" | "retreat";
  lastFx: BattleFx | null;
  fxLog: BattleFx[];
  fxSerial: number;
  enemyNonce: number;
  seed: number;
};

export type BattleAction =
  | { type: "move"; unitId: string; x: number; y: number }
  | { type: "strike"; unitId: string; targetId: string }
  | { type: "skill"; unitId: string; targetId: string }
  | { type: "wait"; unitId: string }
  | { type: "react"; unitId: string; targetId: string }
  | { type: "undo"; unitId: string }
  | { type: "end-phase" }
  | { type: "start-player" };

export type Merc = {
  id: string;
  defId: string;
  name: string;
  role: string;
  art: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  mov: number;
  rng: number;
  skill: SkillId;
  fly: boolean;
  brandsOnStrike: boolean;
  scars: number;
  alive: boolean;
  known: string[];
  cost: number;
  blurb: string;
};

export type Screen = "title" | "table" | "deploy" | "battle" | "aftermath" | "ending";

export type Aftermath = {
  missionId: string;
  victory: boolean;
  lines: string[];
  buried: string[];
};

export type ChronicleEntry = { id: string; title: string; body: string };

export type Campaign = {
  version: 1;
  companyName: string;
  gold: number;
  renown: number;
  muted: boolean;
  roster: Merc[];
  cleared: string[];
  refused: string[];
  bitter: string[];
  chronicle: ChronicleEntry[];
  screen: Screen;
  battle: BattleState | null;
  deployId: string | null;
  selectedDeploy: string[];
  aftermath: Aftermath | null;
  ending: null | "name" | "ruin" | "kept";
};
