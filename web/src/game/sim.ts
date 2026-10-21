import { ENEMY_DEFS, missionById, SKILLS } from "./data";
import { appliedStats, bannerReach, cooldownOf, healAmount, mods, skillPower, skillRange } from "./talents";
import type { BattleAction, BattleState, BattleUnit, FxKind, FxTone, MarkKind, Team } from "./types";

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export function cheb(x0: number, y0: number, x1: number, y1: number): number {
  return Math.max(Math.abs(x0 - x1), Math.abs(y0 - y1));
}

export function living(units: BattleUnit[], team?: Team): BattleUnit[] {
  return units.filter((u) => !u.downed && (team ? u.team === team : true));
}

export function foeTeam(team: Team): Team {
  return team === "player" ? "enemy" : "player";
}

export function hasLos(map: string[], x0: number, y0: number, x1: number, y1: number): boolean {
  if (x0 === x1 && y0 === y1) return true;
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  while (x !== x1 || y !== y1) {
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
    if (x === x1 && y === y1) return true;
    const tile = map[y]?.[x];
    if (tile === "#" || tile === "t") return false;
  }
  return true;
}

function veiled(attacker: BattleUnit, ax: number, ay: number, map: string[], tx: number, ty: number): boolean {
  if (attacker.fly) return false;
  if (map[ty]?.[tx] !== "t") return false;
  return cheb(ax, ay, tx, ty) > 1;
}

export function skillReady(unit: BattleUnit): boolean {
  const skill = SKILLS[unit.skill];
  if (skill.kind === "none") return false;
  const cd = unit.ticked ? unit.cooldown : Math.max(0, unit.cooldown - 1);
  return cd === 0;
}

export function reachable(state: BattleState, unit: BattleUnit): { x: number; y: number; cost: number }[] {
  if (unit.pinned > 0 || unit.downed || unit.moved) return [];
  const h = state.map.length;
  const w = state.map[0]?.length ?? 0;
  const best = new Map<string, number>();
  const startK = `${unit.x},${unit.y}`;
  best.set(startK, 0);
  const pq: { x: number; y: number; c: number }[] = [{ x: unit.x, y: unit.y, c: 0 }];
  while (pq.length) {
    pq.sort((a, b) => a.c - b.c);
    const cur = pq.shift();
    if (!cur) break;
    const ck = `${cur.x},${cur.y}`;
    if (cur.c !== best.get(ck)) continue;
    for (const [dx, dy] of DIRS) {
      const x = cur.x + dx;
      const y = cur.y + dy;
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const tile = state.map[y][x];
      if (tile === "#") continue;
      const blocker = state.units.find((u) => !u.downed && u.x === x && u.y === y && u.id !== unit.id);
      if (blocker && blocker.team !== unit.team) continue;
      let step = 1;
      if (!unit.fly && (tile === "r" || tile === "t" || tile === "m")) step = 2;
      const nc = cur.c + step;
      if (nc > unit.mov) continue;
      const k = `${x},${y}`;
      if (nc < (best.get(k) ?? 99)) {
        best.set(k, nc);
        pq.push({ x, y, c: nc });
      }
    }
  }
  const out: { x: number; y: number; cost: number }[] = [];
  for (const [k, cost] of best) {
    if (k === startK) continue;
    const occupied = state.units.some((u) => !u.downed && `${u.x},${u.y}` === k);
    if (occupied) continue;
    const [x, y] = k.split(",").map(Number);
    out.push({ x, y, cost });
  }
  return out;
}

function defenseOf(state: BattleState, target: BattleUnit, range: number, attacker?: BattleUnit): number {
  let def = target.def;
  const tile = state.map[target.y]?.[target.x];
  const attackerMods = mods(attacker?.known);
  if (range > 1 && tile === "r") def += Math.max(0, 2 - attackerMods.ignoreCover);
  if (tile === "m") def = Math.max(0, def - 2);
  def = Math.max(0, def - attackerMods.pierce);
  if (target.watch) def += mods(target.known).watchGrit;
  for (const ally of living(state.units, target.team)) {
    if (ally.id === target.id || ally.downed) continue;
    if (cheb(ally.x, ally.y, target.x, target.y) <= 1) def += mods(ally.known).guardAura;
  }
  return def;
}

function rollOf(state: BattleState): number {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return state.seed % 3;
}

export function rawDamage(power: number, defense: number, roll: number, mult: number, flat: number): number {
  const base = Math.max(1, power - Math.floor(defense / 2) + roll);
  return Math.max(1, Math.round(base * mult) + flat);
}

export function damageSpan(
  power: number,
  defense: number,
  mult: number,
  flat: number,
): { min: number; max: number } {
  return {
    min: rawDamage(power, defense, 0, mult, flat),
    max: rawDamage(power, defense, 2, mult, flat),
  };
}

function pushLog(state: BattleState, line: string) {
  state.log = [...state.log, line].slice(-18);
}

function setFx(
  state: BattleState,
  unitId: string,
  text: string,
  tone: FxTone,
  sourceId?: string,
  kind?: FxKind,
) {
  state.fxSerial += 1;
  const fx = {
    serial: state.fxSerial,
    unitId,
    text,
    tone,
    ...(sourceId ? { sourceId } : {}),
    ...(kind ? { kind } : {}),
  };
  state.lastFx = fx;
  state.fxLog = [...(state.fxLog ?? []), fx].slice(-8);
}

function reachKind(attacker: BattleUnit): FxKind {
  return attacker.rng > 1 ? "shot" : "melee";
}

function harm(
  state: BattleState,
  target: BattleUnit,
  amount: number,
  line: string,
  attacker?: BattleUnit,
  kind?: FxKind,
  echo = false,
) {
  if (target.downed) return;
  const stands = mods(target.known).lastStand;
  if (!echo && target.hp <= amount && stands > (target.lastStood ?? 0)) {
    const dealt = Math.max(0, target.hp - 1);
    target.hp = 1;
    target.lastStood = (target.lastStood ?? 0) + 1;
    if (dealt > 0) setFx(state, target.id, `−${dealt}`, "hurt", attacker?.id, kind);
    pushLog(state, `${line} ${target.name} holds at 1.`);
    biteBack(state, attacker, target, echo);
    return;
  }
  target.hp = Math.max(0, target.hp - amount);
  setFx(state, target.id, `−${amount}`, "hurt", attacker?.id, kind);
  pushLog(state, line);
  biteBack(state, attacker, target, echo);
  if (target.hp <= 0) {
    target.hp = 0;
    target.downed = true;
    target.acted = true;
    setFx(state, target.id, "Falls", "down");
    pushLog(state, `${target.name} falls.`);
  }
}

function biteBack(state: BattleState, attacker: BattleUnit | undefined, target: BattleUnit, echo: boolean) {
  if (echo || !attacker || attacker.id === target.id || attacker.downed || attacker.rng > 1) return;
  const bone = mods(target.known).thorns;
  if (bone <= 0) return;
  harm(state, attacker, bone, `${target.name}'s bones bite ${attacker.name} for ${bone}.`, target, "melee", true);
}

function mend(state: BattleState, target: BattleUnit, amount: number, healer?: BattleUnit): number {
  const before = target.hp;
  target.hp = Math.min(target.maxHp, target.hp + amount);
  const got = target.hp - before;
  if (got > 0) {
    setFx(state, target.id, `+${got}`, "heal", healer?.id, healer ? "heal" : undefined);
    pushLog(state, `${target.name} mends ${got}.`);
    const ease = healer ? mods(healer.known).clearPin : 0;
    if (ease > 0 && target.pinned > 0) {
      target.pinned = Math.max(0, target.pinned - ease);
      if (target.pinned === 0) target.pinBite = 0;
      pushLog(state, `The pin on ${target.name} eases.`);
    }
  }
  return got;
}

function checkOutcome(state: BattleState) {
  if (state.outcome) return;
  const players = living(state.units, "player");
  if (players.length === 0) {
    state.outcome = "retreat";
    pushLog(state, "The company falls back.");
    return;
  }
  const enemies = living(state.units, "enemy");
  const leader = state.units.find((u) => u.leader);
  const leaderDown = state.objective === "leader" && Boolean(leader?.downed);
  if (leaderDown || enemies.length === 0) {
    for (const e of state.units) {
      if (e.team === "enemy" && !e.downed) {
        e.downed = true;
        e.hp = 0;
      }
    }
    state.outcome = "victory";
    pushLog(state, leaderDown ? "The head of the contract drops. The rest scatter." : "The field breaks.");
  }
}

function beginActivation(state: BattleState, unit: BattleUnit) {
  if (unit.ticked || unit.downed) return;
  unit.ticked = true;
  if (unit.cooldown > 0) unit.cooldown -= 1;
  if (unit.pinned > 0 && (unit.pinBite ?? 0) > 0) {
    harm(state, unit, unit.pinBite ?? 0, `The pin bites ${unit.name} for ${unit.pinBite}.`);
    if (unit.downed) {
      checkOutcome(state);
      return;
    }
  }
  let gift = 0;
  for (const ally of living(state.units, unit.team)) {
    if (ally.id === unit.id) continue;
    if (cheb(ally.x, ally.y, unit.x, unit.y) <= 1) gift += mods(ally.known).auraMend;
  }
  if (gift > 0) mend(state, unit, gift);
  if (unit.mark?.kind === "hexrot") {
    const bite = unit.mark.bite ?? 2;
    harm(state, unit, bite, `Hexrot gnaws ${unit.name} for ${bite}.`);
    if (unit.downed) {
      checkOutcome(state);
      return;
    }
  }
  if (unit.mark) {
    unit.mark = { ...unit.mark, turns: unit.mark.turns - 1 };
    if (unit.mark.turns <= 0) {
      pushLog(state, `${MARKNAME[unit.mark.kind]} fades from ${unit.name}.`);
      unit.mark = null;
    }
  }
}

const MARKNAME = { ashbrand: "Ashbrand", hexrot: "Hexrot", blooddebt: "Blooddebt" } as const;

function finish(unit: BattleUnit) {
  unit.acted = true;
  if (unit.pinned > 0) {
    unit.pinned -= 1;
    if (unit.pinned === 0) unit.pinBite = 0;
  }
}

function unitById(state: BattleState, id: string): BattleUnit | undefined {
  return state.units.find((u) => u.id === id);
}

export function strikeTargets(state: BattleState, unit: BattleUnit, x = unit.x, y = unit.y): BattleUnit[] {
  const reach = unit.rng + (unit.watch ? mods(unit.known).watchReach : 0);
  return living(state.units, foeTeam(unit.team)).filter((t) => {
    const dist = cheb(x, y, t.x, t.y);
    return dist > 0 && dist <= reach && hasLos(state.map, x, y, t.x, t.y) && !veiled(unit, x, y, state.map, t.x, t.y);
  });
}

function inArc(state: BattleState, watcher: BattleUnit, x: number, y: number): boolean {
  const reach = watcher.rng + mods(watcher.known).watchReach;
  const dist = cheb(watcher.x, watcher.y, x, y);
  return dist > 0 && dist <= reach && hasLos(state.map, watcher.x, watcher.y, x, y) && !veiled(watcher, watcher.x, watcher.y, state.map, x, y);
}

function entersWatch(state: BattleState, mover: BattleUnit, x: number, y: number): boolean {
  if (mover.x === x && mover.y === y) return false;
  return living(state.units, "player").some(
    (w) => w.watch && inArc(state, w, x, y) && !inArc(state, w, mover.x, mover.y),
  );
}

export function watchCells(state: BattleState): string[] {
  const height = state.map.length;
  const width = state.map[0]?.length ?? 0;
  const seen = new Set<string>();
  for (const watcher of living(state.units, "player")) {
    if (!watcher.watch) continue;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (state.map[y]?.[x] === "#") continue;
        if (!inArc(state, watcher, x, y)) continue;
        seen.add(`${x},${y}`);
      }
    }
  }
  return [...seen];
}

export function watchTriggers(state: BattleState): string[] {
  const watchers = living(state.units, "player").filter((w) => w.watch);
  if (!watchers.length) return [];
  const seen = new Set<string>();
  for (const enemy of living(state.units, "enemy")) {
    const already = new Set(
      watchers.filter((w) => strikeTargets(state, w).some((t) => t.id === enemy.id)).map((w) => w.id),
    );
    for (const tile of reachable(state, enemy)) {
      const fresh = watchers.some((w) => !already.has(w.id) && inArc(state, w, tile.x, tile.y));
      if (fresh) seen.add(`${tile.x},${tile.y}`);
    }
  }
  return [...seen];
}

export function threatCells(state: BattleState): string[] {
  const height = state.map.length;
  const width = state.map[0]?.length ?? 0;
  const seen = new Set<string>();
  for (const enemy of living(state.units, "enemy")) {
    const spots = [{ x: enemy.x, y: enemy.y }, ...reachable(state, enemy)];
    for (const spot of spots) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (state.map[y]?.[x] === "#") continue;
          if (!inArc(state, { ...enemy, x: spot.x, y: spot.y }, x, y)) continue;
          seen.add(`${x},${y}`);
        }
      }
    }
  }
  return [...seen];
}

export function skillTargets(state: BattleState, unit: BattleUnit, x = unit.x, y = unit.y): BattleUnit[] {
  const skill = SKILLS[unit.skill];
  if (skill.kind === "none") return [];
  if (skill.kind === "banner") return [unit];
  const foes = living(state.units, foeTeam(unit.team));
  const friends = living(state.units, unit.team);
  const reach = skillRange(unit);
  const near = (t: BattleUnit) => cheb(x, y, t.x, t.y) <= reach && hasLos(state.map, x, y, t.x, t.y);
  const seen = (t: BattleUnit) => near(t) && !veiled(unit, x, y, state.map, t.x, t.y);
  if (skill.kind === "heal") {
    const allies = friends.filter((t) => near(t));
    const smite = foes.filter(
      (t) => seen(t) && t.mark && (t.mark.kind === "ashbrand" || t.mark.kind === "hexrot"),
    );
    return [...allies, ...smite];
  }
  return foes.filter((t) => cheb(x, y, t.x, t.y) > 0 && seen(t));
}

function layMark(state: BattleState, attacker: BattleUnit, target: BattleUnit, kind: MarkKind, spread = true) {
  const bonus = mods(attacker.known);
  const bite = kind === "hexrot" ? 2 + bonus.hexBite : undefined;
  target.mark = { kind, turns: 2 + bonus.markTurns, sourceId: attacker.id, ...(bite ? { bite } : {}) };
  const chip = kind === "ashbrand" ? "Ash" : kind === "blooddebt" ? "Debt" : "Hex";
  setFx(state, target.id, chip, "mark");
  pushLog(state, `${attacker.name} lays ${MARKNAME[kind]} on ${target.name}.`);
  if (!spread || bonus.markSpread <= 0) return;
  const extras = living(state.units, foeTeam(attacker.team))
    .filter((foe) => foe.id !== target.id && !foe.mark && cheb(target.x, target.y, foe.x, foe.y) === 1)
    .slice(0, bonus.markSpread);
  for (const foe of extras) layMark(state, attacker, foe, kind, false);
}

function extraPower(state: BattleState, attacker: BattleUnit, target: BattleUnit): number {
  const bonus = mods(attacker.known);
  let extra = 0;
  if (target.maxHp > 0 && target.hp * 2 <= target.maxHp) extra += bonus.execute;
  if (target.mark) extra += bonus.markSight;
  if (cheb(attacker.x, attacker.y, target.x, target.y) >= attacker.rng) extra += bonus.longShot;
  for (const ally of living(state.units, attacker.team)) {
    if (ally.id === attacker.id) continue;
    if (cheb(ally.x, ally.y, target.x, target.y) <= 2) extra += mods(ally.known).kinCut;
  }
  return extra;
}

function markBonus(state: BattleState, attacker: BattleUnit, mark: BattleUnit["mark"]): { mult: number; flat: number } {
  if (!mark) return { mult: 1, flat: 0 };
  const source = unitById(state, mark.sourceId);
  let flat = mark.sourceId !== attacker.id ? 2 : 0;
  if (mark.kind === "ashbrand") flat += 2;
  flat += mods(source?.known).laidFlat;
  flat += mods(attacker.known).spendFlat;
  return { mult: 1.5, flat };
}

function applyBrand(state: BattleState, attacker: BattleUnit, target: BattleUnit) {
  if (target.downed) return;
  layMark(state, attacker, target, "ashbrand");
}

function spendMark(state: BattleState, attacker: BattleUnit, target: BattleUnit): { mult: number; flat: number; kind: BattleUnit["mark"] } {
  const mark = target.mark;
  if (!mark) return { mult: 1, flat: 0, kind: null };
  const bonus = markBonus(state, attacker, mark);
  target.mark = null;
  return { ...bonus, kind: mark };
}

function applyStrike(state: BattleState, attacker: BattleUnit, target: BattleUnit, cut = false) {
  const def = defenseOf(state, target, attacker.rng, attacker);
  const bonus = mods(attacker.known);
  let power = attacker.atk + (attacker.inspiredBonus ?? 0) + (attacker.inspiredSharp ? 2 : 0) + bonus.strikeFlat;
  if (cut) power += bonus.watchFlat;
  power += extraPower(state, attacker, target);
  const amount = rawDamage(power, def, rollOf(state), 1, 0);
  const line = cut
    ? `${attacker.name} cuts ${target.name} for ${amount} as they cross.`
    : `${attacker.name} strikes ${target.name} for ${amount}.`;
  harm(state, target, amount, line, attacker, reachKind(attacker));
  if (bonus.leech > 0 && !attacker.downed) mend(state, attacker, bonus.leech, attacker);
  if (cut && bonus.watchPin > 0 && !target.downed) {
    target.pinned = Math.max(target.pinned, bonus.watchPin);
    pushLog(state, `${target.name} is pinned.`);
  }
  if (attacker.brandsOnStrike) applyBrand(state, attacker, target);
  else if (attacker.inspired && !target.downed) {
    applyBrand(state, attacker, target);
    attacker.inspired = false;
    attacker.inspiredSharp = false;
    attacker.inspiredBonus = 0;
  }
}

function payLaid(state: BattleState, mark: BattleUnit["mark"]) {
  if (!mark) return;
  const source = unitById(state, mark.sourceId);
  const amount = mods(source?.known).laidMend;
  if (amount > 0 && source && !source.downed) mend(state, source, amount, source);
}

function applySkill(state: BattleState, attacker: BattleUnit, target: BattleUnit) {
  const skill = SKILLS[attacker.skill];
  const power = skillPower(attacker);
  const reach = skillRange(attacker);
  const arm = () => {
    attacker.cooldown = cooldownOf(attacker, skill.cooldown);
  };
  if (skill.kind === "banner") {
    let n = 0;
    const radius = bannerReach(attacker);
    const sharp = mods(attacker.known).inspiredFlat;
    for (const ally of living(state.units, attacker.team)) {
      if (ally.id === attacker.id) continue;
      if (cheb(attacker.x, attacker.y, ally.x, ally.y) <= radius) {
        ally.inspired = true;
        if (sharp) ally.inspiredBonus = (ally.inspiredBonus ?? 0) + sharp;
        const gift = mods(attacker.known).bannerMend;
        if (gift > 0) mend(state, ally, gift, attacker);
        n += 1;
      }
    }
    pushLog(state, `${attacker.name} raises the standard. ${n} ${n === 1 ? "blade brands" : "blades brand"} on their next strike.`);
    setFx(state, attacker.id, "Standard", "mark");
    arm();
    return;
  }
  if (skill.kind === "heal" && target.team === attacker.team) {
    const got = mend(state, target, healAmount(attacker), attacker);
    if (got <= 0) pushLog(state, `${target.name} is already whole.`);
    arm();
    return;
  }
  if (skill.kind === "heal" && target.team !== attacker.team && target.mark) {
    const spent = spendMark(state, attacker, target);
    const amount = rawDamage(7 + mods(attacker.known).skillPower + extraPower(state, attacker, target), defenseOf(state, target, reach, attacker), rollOf(state), spent.mult, spent.flat);
    harm(state, target, amount, `${attacker.name} spends the mark. Pyre hits ${target.name} for ${amount}.`, attacker, "hex");
    payLaid(state, spent.kind);
    const choir = mods(attacker.known);
    for (const ally of living(state.units, attacker.team)) {
      if (cheb(attacker.x, attacker.y, ally.x, ally.y) <= 2 + choir.choirReach) mend(state, ally, 6 + choir.choirMend, attacker);
    }
    arm();
    return;
  }
  if (skill.kind === "prime" && skill.mark) {
    const amount = rawDamage(power + extraPower(state, attacker, target), defenseOf(state, target, reach, attacker), rollOf(state), 1, 0);
    harm(state, target, amount, `${attacker.name} uses ${skill.name} on ${target.name} for ${amount}.`, attacker, "hex");
    if (!target.downed) layMark(state, attacker, target, skill.mark);
    arm();
    return;
  }
  if (skill.kind === "hexlord" && !target.mark) {
    const amount = rawDamage(5 + extraPower(state, attacker, target), defenseOf(state, target, reach, attacker), rollOf(state), 1, 0);
    harm(state, target, amount, `${attacker.name} writes on ${target.name} for ${amount}.`, attacker, "hex");
    if (!target.downed) layMark(state, attacker, target, "hexrot");
    arm();
    return;
  }
  if (skill.kind === "detonate" || skill.kind === "hexlord") {
    const spent = spendMark(state, attacker, target);
    const amount = rawDamage(power + extraPower(state, attacker, target), defenseOf(state, target, reach, attacker), rollOf(state), spent.mult, spent.flat);
    const company = Boolean(spent.kind && spent.flat >= 2);
    harm(
      state,
      target,
      amount,
      spent.kind
        ? `${attacker.name} spends ${MARKNAME[spent.kind.kind]} on ${target.name} for ${amount}.${company ? " The company bites deeper." : ""}`
        : `${attacker.name} uses ${skill.name} on ${target.name} for ${amount}. No mark to spend.`,
      attacker,
      reachKind(attacker),
    );
    if (spent.kind?.kind === "hexrot" && !target.downed) {
      const source = unitById(state, spent.kind.sourceId);
      target.pinned = Math.max(target.pinned, 1 + mods(source?.known).pinTurns);
      const bite = mods(source?.known).pinHurt;
      if (bite > 0) target.pinBite = Math.max(target.pinBite ?? 0, bite);
      pushLog(state, `${target.name} is pinned.`);
    }
    if (spent.kind?.kind === "blooddebt") {
      const source = unitById(state, spent.kind.sourceId);
      mend(state, attacker, 5 + mods(source?.known).bloodMend, attacker);
    }
    payLaid(state, spent.kind);
    arm();
  }
}

export function forecastStrike(state: BattleState, attacker: BattleUnit, target: BattleUnit): string {
  const bonus = mods(attacker.known);
  const power = attacker.atk + (attacker.inspiredBonus ?? 0) + (attacker.inspiredSharp ? 2 : 0) + bonus.strikeFlat + extraPower(state, attacker, target);
  const span = damageSpan(power, defenseOf(state, target, attacker.rng, attacker), 1, 0);
  const brand = attacker.brandsOnStrike || attacker.inspired ? " Lays Ashbrand." : "";
  return `${span.min}–${span.max}${brand}`;
}

export function forecastSkill(state: BattleState, attacker: BattleUnit, target: BattleUnit): string {
  const skill = SKILLS[attacker.skill];
  const power = skillPower(attacker);
  const reach = skillRange(attacker);
  if (skill.kind === "banner") {
    const gift = mods(attacker.known).bannerMend;
    return `Allies within ${bannerReach(attacker)} brand on their next strike.${gift > 0 ? ` Mend ${gift}.` : ""}`;
  }
  if (skill.kind === "heal" && target.team === attacker.team) return `Mend ${healAmount(attacker)}.`;
  if (skill.kind === "prime" && skill.mark) {
    const span = damageSpan(power + extraPower(state, attacker, target), defenseOf(state, target, reach, attacker), 1, 0);
    return `${span.min}–${span.max}. Lays ${MARKNAME[skill.mark]}.`;
  }
  if (skill.kind === "heal") {
    const spent = target.mark && (target.mark.kind === "ashbrand" || target.mark.kind === "hexrot");
    const bonus = spent ? markBonus(state, attacker, target.mark) : { mult: 1, flat: 0 };
    const span = damageSpan(7 + mods(attacker.known).skillPower + extraPower(state, attacker, target), defenseOf(state, target, reach, attacker), bonus.mult, bonus.flat);
    return `${span.min}–${span.max}. Hymn mends allies near you.`;
  }
  if (skill.kind === "hexlord" && !target.mark) {
    const span = damageSpan(5 + extraPower(state, attacker, target), defenseOf(state, target, reach, attacker), 1, 0);
    return `${span.min}–${span.max}. Lays Hexrot.`;
  }
  const mark = target.mark;
  const bonus = markBonus(state, attacker, mark);
  const span = damageSpan(power + extraPower(state, attacker, target), defenseOf(state, target, reach, attacker), mark ? bonus.mult : 1, mark ? bonus.flat : 0);
  if (!mark) return `${span.min}–${span.max}. No mark to spend.`;
  const debt = mark.kind === "blooddebt" ? 5 + mods(unitById(state, mark.sourceId)?.known).bloodMend : 0;
  const rider = mark.kind === "hexrot" ? " Pins." : mark.kind === "blooddebt" ? ` You mend ${debt}.` : "";
  const company = mark.sourceId !== attacker.id ? " Company." : "";
  return `${span.min}–${span.max}. Spends ${MARKNAME[mark.kind]}.${company}${rider}`;
}

export function aimChip(state: BattleState, attacker: BattleUnit, target: BattleUnit, asSkill: boolean): string {
  if (!asSkill) {
    const line = forecastStrike(state, attacker, target);
    const range = line.match(/^\d+–\d+/)?.[0] ?? line;
    return line.includes("Ashbrand") ? `${range} ash` : range;
  }
  const skill = SKILLS[attacker.skill];
  const line = forecastSkill(state, attacker, target);
  const range = line.match(/^\d+–\d+/)?.[0];
  if (skill.kind === "banner") return "Banner";
  if (skill.kind === "heal" && target.team === attacker.team) {
    const mend = line.match(/Mend (\d+)/);
    return mend ? `+${mend[1]}` : "Mend";
  }
  if (skill.kind === "prime" && skill.mark) {
    const tag = skill.mark === "ashbrand" ? "ash" : skill.mark === "hexrot" ? "hex" : "debt";
    return range ? `${range} ${tag}` : tag;
  }
  if (skill.kind === "hexlord" && !target.mark) return range ? `${range} hex` : "Hex";
  if (!target.mark) return range ?? line;
  const tag = target.mark.kind === "hexrot" ? "pin" : target.mark.kind === "blooddebt" ? "debt" : "spend";
  return range ? `${range} ${tag}` : tag;
}

function canCommand(state: BattleState, unit: BattleUnit, team: Team): boolean {
  if (state.outcome) return false;
  if (unit.downed || unit.acted) return false;
  if (unit.team !== team) return false;
  if (state.phase === "player" && team !== "player") return false;
  if (state.phase === "enemy" && team !== "enemy") return false;
  return true;
}

export function applyBattle(input: BattleState, action: BattleAction): BattleState {
  const state = structuredClone(input);
  if (action.type === "start-player") {
    if (state.outcome) return state;
    state.phase = "player";
    state.round += 1;
    for (const u of state.units) {
      if (u.team === "player" && !u.downed) {
        u.acted = false;
        u.moved = false;
        u.ticked = false;
        u.watch = false;
        u.fromX = null;
        u.fromY = null;
      }
    }
    pushLog(state, `Round ${state.round}.`);
    return state;
  }
  if (action.type === "end-phase") {
    if (state.phase !== "player" || state.outcome) return state;
    for (const u of state.units) {
      if (u.team !== "player" || u.downed) continue;
      if (!u.ticked) beginActivation(state, u);
      u.acted = true;
    }
    checkOutcome(state);
    if (state.outcome) return state;
    state.phase = "enemy";
    state.enemyNonce += 1;
    for (const u of state.units) {
      if (u.team === "enemy" && !u.downed) {
        u.acted = false;
        u.moved = false;
        u.ticked = false;
        u.fromX = null;
        u.fromY = null;
      }
    }
    pushLog(state, "The other side moves.");
    return state;
  }

  if (action.type === "react") {
    const watcher = unitById(state, action.unitId);
    const target = unitById(state, action.targetId);
    if (!watcher?.watch || watcher.downed || !target || target.downed || target.team === watcher.team) return state;
    if (!strikeTargets(state, watcher).some((t) => t.id === target.id)) return state;
    watcher.watch = false;
    applyStrike(state, watcher, target, true);
    checkOutcome(state);
    return state;
  }

  const unit = unitById(state, action.unitId);
  if (!unit) return state;
  const team = unit.team;
  if (action.type === "undo") {
    if (!canCommand(state, unit, team) || !unit.moved || unit.fromX === null || unit.fromY === null) return state;
    unit.x = unit.fromX;
    unit.y = unit.fromY;
    unit.moved = false;
    return state;
  }
  if (!canCommand(state, unit, team)) return state;
  beginActivation(state, unit);
  if (unit.downed || state.outcome) {
    unit.acted = true;
    checkOutcome(state);
    return state;
  }

  if (action.type === "move") {
    if (unit.moved || unit.pinned > 0) return state;
    const tile = reachable(state, unit).find((t) => t.x === action.x && t.y === action.y);
    if (!tile) return state;
    if (unit.fromX === null) {
      unit.fromX = unit.x;
      unit.fromY = unit.y;
    }
    unit.x = action.x;
    unit.y = action.y;
    unit.moved = true;
    pushLog(state, `${unit.name} steps.`);
    const gift = mods(unit.known).roadMend;
    if (gift > 0) {
      for (const ally of living(state.units, unit.team)) {
        if (ally.id === unit.id) continue;
        if (cheb(unit.x, unit.y, ally.x, ally.y) <= 1) mend(state, ally, gift, unit);
      }
    }
    return state;
  }

  if (action.type === "wait") {
    if (unit.team === "player") {
      if (state.map[unit.y]?.[unit.x] === "m") {
        pushLog(state, `${unit.name} sinks. The mire will not hold a watch.`);
      } else {
        unit.watch = true;
        pushLog(state, unit.moved ? `${unit.name} watches the lane.` : `${unit.name} holds the lane.`);
      }
    } else if (!unit.moved) {
      pushLog(state, `${unit.name} holds.`);
    }
    finish(unit);
    checkOutcome(state);
    return state;
  }

  if (action.type === "strike") {
    const target = unitById(state, action.targetId);
    if (!target || !strikeTargets(state, unit).some((t) => t.id === target.id)) return state;
    applyStrike(state, unit, target);
    finish(unit);
    checkOutcome(state);
    return state;
  }

  if (action.type === "skill") {
    if (!skillReady(unit)) {
      pushLog(state, `${SKILLS[unit.skill].name} is not ready.`);
      return state;
    }
    const target = unitById(state, action.targetId);
    if (!target || !skillTargets(state, unit).some((t) => t.id === target.id)) return state;
    applySkill(state, unit, target);
    finish(unit);
    checkOutcome(state);
    return state;
  }

  return state;
}

function optionsAt(
  state: BattleState,
  unit: BattleUnit,
  x: number,
  y: number,
): { score: number; action: BattleAction }[] {
  const opts: { score: number; action: BattleAction }[] = [];
  for (const t of strikeTargets(state, unit, x, y)) {
    const span = damageSpan(unit.atk, defenseOf(state, t, unit.rng, unit), 1, 0);
    let score = (span.min + span.max) / 2;
    if (span.max >= t.hp) score += 55;
    score += Math.max(0, 22 - t.hp) * 0.35;
    if (t.leader) score += 8;
    if (unit.brandsOnStrike && !t.mark) score += 10;
    const foes = living(state.units, foeTeam(unit.team));
    const lowest = foes.reduce((min, foe) => Math.min(min, foe.hp), 99);
    if (t.hp === lowest) score += 7;
    opts.push({ score, action: { type: "strike", unitId: unit.id, targetId: t.id } });
  }
  if (!skillReady(unit)) return opts;
  const skill = SKILLS[unit.skill];
  if (skill.kind === "banner") {
    const n = living(state.units, unit.team).filter(
      (a) => a.id !== unit.id && cheb(x, y, a.x, a.y) <= 2,
    ).length;
    opts.push({ score: 14 + n * 7, action: { type: "skill", unitId: unit.id, targetId: unit.id } });
    return opts;
  }
  for (const t of skillTargets(state, { ...unit, x, y })) {
    if (skill.kind === "heal" && t.team === unit.team) {
      const missing = t.maxHp - t.hp;
      if (missing >= 4) {
        opts.push({
          score: 10 + missing,
          action: { type: "skill", unitId: unit.id, targetId: t.id },
        });
      }
      continue;
    }
    if (skill.kind === "prime" && skill.mark) {
      if (t.mark?.kind === skill.mark) continue;
      const span = damageSpan(skill.power, defenseOf(state, t, skill.range, unit), 1, 0);
      let score = 18 + span.min * 0.4;
      if (!t.mark) score += 8;
      if (t.leader) score += 6;
      opts.push({ score, action: { type: "skill", unitId: unit.id, targetId: t.id } });
      continue;
    }
    if (skill.kind === "hexlord" && !t.mark) {
      opts.push({ score: 20 + (t.leader ? 8 : 0), action: { type: "skill", unitId: unit.id, targetId: t.id } });
      continue;
    }
    const mark = t.mark;
    const mult = mark ? 1.5 : 1;
    let flat = 0;
    if (mark && mark.sourceId !== unit.id) flat += 2;
    if (mark?.kind === "ashbrand") flat += 2;
    const power = skill.kind === "heal" ? 7 : skill.power;
    const span = damageSpan(power, defenseOf(state, t, skill.range, unit), mult, flat);
    let score = (span.min + span.max) / 2;
    if (mark) score += 26;
    if (span.max >= t.hp) score += 55;
    if (t.leader) score += 8;
    if (!mark && skill.kind === "detonate") score *= 0.55;
    opts.push({ score, action: { type: "skill", unitId: unit.id, targetId: t.id } });
  }
  return opts;
}

export function scriptEnemy(state: BattleState, unitId: string): BattleAction[] {
  const unit = state.units.find((u) => u.id === unitId);
  if (!unit || unit.downed || unit.acted) return [];
  const foes = living(state.units, "player");
  if (foes.length === 0) return [{ type: "wait", unitId }];
  const tiles = [{ x: unit.x, y: unit.y, cost: 0 }, ...reachable(state, unit)];
  let best: { score: number; x: number; y: number; action: BattleAction } | null = null;
  for (const tile of tiles) {
    for (const opt of optionsAt(state, unit, tile.x, tile.y)) {
      const watch = entersWatch(state, unit, tile.x, tile.y) ? 16 : 0;
      const score = opt.score - tile.cost * 0.25 - watch;
      if (!best || score > best.score) best = { score, x: tile.x, y: tile.y, action: opt.action };
    }
  }
  if (!best || best.score < 4) {
    const goal = foes.slice().sort((a, b) => cheb(unit.x, unit.y, a.x, a.y) - cheb(unit.x, unit.y, b.x, b.y))[0];
    const step = tiles
      .slice()
      .sort((a, b) => {
        const da = cheb(a.x, a.y, goal.x, goal.y) - cheb(b.x, b.y, goal.x, goal.y);
        if (da !== 0) return da;
        const wa = entersWatch(state, unit, a.x, a.y) ? 1 : 0;
        const wb = entersWatch(state, unit, b.x, b.y) ? 1 : 0;
        if (wa !== wb) return wa - wb;
        return a.cost - b.cost;
      })[0];
    if (step && (step.x !== unit.x || step.y !== unit.y)) {
      return [
        { type: "move", unitId, x: step.x, y: step.y },
        { type: "wait", unitId },
      ];
    }
    return [{ type: "wait", unitId }];
  }
  const actions: BattleAction[] = [];
  if (best.x !== unit.x || best.y !== unit.y) actions.push({ type: "move", unitId, x: best.x, y: best.y });
  actions.push(best.action);
  return actions;
}

export function resolveEnemyPhase(state: BattleState): BattleState[] {
  let sim = state;
  const frames: BattleState[] = [];
  let guard = 0;
  while (guard++ < 32) {
    if (sim.outcome || sim.phase !== "enemy") break;
    const next = sim.units.find((u) => u.team === "enemy" && !u.downed && !u.acted);
    if (!next) {
      sim = applyBattle(sim, { type: "start-player" });
      frames.push(sim);
      break;
    }
    const script = scriptEnemy(sim, next.id);
    const steps = script.length > 0 ? script : [{ type: "wait" as const, unitId: next.id }];
    for (const step of steps) {
      const actor = sim.units.find((u) => u.id === next.id);
      if (!actor || actor.downed) break;
      const already = new Set(
        step.type === "move"
          ? living(sim.units, "player")
              .filter((w) => w.watch && strikeTargets(sim, w).some((t) => t.id === actor.id))
              .map((w) => w.id)
          : [],
      );
      sim = applyBattle(sim, step);
      frames.push(sim);
      if (sim.outcome) return frames;
      if (step.type !== "move") continue;
      const mover = sim.units.find((u) => u.id === next.id);
      if (!mover || mover.downed) continue;
      const cutters = living(sim.units, "player")
        .filter((w) => w.watch && !already.has(w.id) && strikeTargets(sim, w).some((t) => t.id === mover.id))
        .sort((a, b) => cheb(a.x, a.y, mover.x, mover.y) - cheb(b.x, b.y, mover.x, mover.y));
      for (const cutter of cutters) {
        sim = applyBattle(sim, { type: "react", unitId: cutter.id, targetId: mover.id });
        frames.push(sim);
        if (sim.outcome) return frames;
        const still = sim.units.find((u) => u.id === mover.id);
        if (!still || still.downed) break;
      }
    }
  }
  return frames;
}

export function bootBattle(
  missionId: string,
  mercs: {
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
    skill: BattleUnit["skill"];
    fly: boolean;
    brandsOnStrike: boolean;
    known?: string[];
    scars?: number;
  }[],
  seed: number,
  bitter = false,
): BattleState {
  const mission = missionById(missionId);
  const units: BattleUnit[] = mercs.map((m, i) => {
    const spawn = mission.playerSpawns[i] ?? mission.playerSpawns[0];
    const stats = appliedStats(m);
    return {
      id: m.id,
      defId: m.defId,
      name: m.name,
      team: "player",
      role: m.role,
      art: m.art,
      x: spawn.x,
      y: spawn.y,
      hp: Math.min(m.hp, stats.maxHp),
      maxHp: stats.maxHp,
      atk: stats.atk,
      def: stats.def,
      mov: stats.mov,
      rng: stats.rng,
      skill: m.skill,
      fly: m.fly,
      leader: false,
      brandsOnStrike: m.brandsOnStrike,
      inspired: false,
      known: m.known ?? [],
      mark: null,
      pinned: 0,
      cooldown: 0,
      acted: false,
      moved: false,
      ticked: false,
      watch: false,
      downed: false,
      scars: m.scars ?? 0,
      frail: m.maxHp < 12,
      fromX: null,
      fromY: null,
    };
  });
  for (const e of mission.enemies) {
    const def = ENEMY_DEFS[e.defId];
    units.push({
      id: e.id,
      defId: e.defId,
      name: e.name,
      team: "enemy",
      role: def.role,
      art: def.art,
      x: e.x,
      y: e.y,
      hp: def.maxHp,
      maxHp: def.maxHp,
      atk: def.atk,
      def: def.def,
      mov: def.mov,
      rng: def.rng,
      skill: def.skill,
      fly: Boolean(def.fly),
      leader: Boolean(e.leader),
      brandsOnStrike: Boolean(def.brandsOnStrike),
      inspired: false,
      known: [],
      mark: null,
      pinned: 0,
      cooldown: 0,
      acted: false,
      moved: false,
      ticked: false,
      watch: false,
      downed: false,
      scars: 0,
      frail: false,
      fromX: null,
      fromY: null,
    });
  }
  if (bitter) {
    const extra: Record<string, { defId: string; name: string }> = {
      toll: { defId: "risen", name: "Gate Straggler" },
      orchard: { defId: "crow", name: "Third Crow" },
      chapel: { defId: "cultist", name: "Side Mouth" },
      iron: { defId: "revenant", name: "Mile Shade" },
      answer: { defId: "risen", name: "Road Straggler" },
      market: { defId: "cultist", name: "Stall Straggler" },
      echo: { defId: "revenant", name: "Keep Shade" },
    };
    const pick = extra[missionId] ?? { defId: "risen", name: "Straggler" };
    const def = ENEMY_DEFS[pick.defId];
    const used = new Set(units.map((unit) => `${unit.x},${unit.y}`));
    let spot: { x: number; y: number } | null = null;
    for (let y = 0; y < mission.rows.length && !spot; y += 1) {
      if (y > 2) break;
      for (let x = 0; x < mission.rows[y].length; x += 1) {
        if (mission.rows[y][x] !== "." || used.has(`${x},${y}`)) continue;
        spot = { x, y };
        break;
      }
    }
    if (spot) {
      units.push({
        id: `e-bitter-${missionId}`,
        defId: pick.defId,
        name: pick.name,
        team: "enemy",
        role: def.role,
        art: def.art,
        x: spot.x,
        y: spot.y,
        hp: def.maxHp,
        maxHp: def.maxHp,
        atk: def.atk,
        def: def.def,
        mov: def.mov,
        rng: def.rng,
        skill: def.skill,
        fly: Boolean(def.fly),
        leader: false,
        brandsOnStrike: false,
        inspired: false,
        known: [],
        mark: null,
        pinned: 0,
        cooldown: 0,
        acted: false,
        moved: false,
        ticked: false,
        watch: false,
        downed: false,
        scars: 0,
        frail: false,
        fromX: null,
        fromY: null,
      });
    }
  }
  return {
    missionId,
    objective: mission.objective,
    map: mission.rows,
    units,
    phase: "player",
    round: 1,
    log: bitter
      ? [mission.opening, "You turned the last work down. This field brought another."]
      : [mission.opening],
    outcome: null,
    lastFx: null,
    fxLog: [],
    fxSerial: 0,
    enemyNonce: 0,
    seed: seed || 1,
  };
}
