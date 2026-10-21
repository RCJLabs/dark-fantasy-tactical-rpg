import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Eye, Flag, Swords, Undo2 } from "lucide-react";
import { MARK_LABEL, MARK_SHORT, SKILLS, missionById } from "@/game/data";
import { talentNames } from "@/game/talents";
import { playCue } from "@/game/audio";
import { decodeImage, fieldFiles, pickLoadingArt } from "@/game/terrain";
import { asset } from "@/game/assets";
import {
  aimChip,
  forecastSkill,
  forecastStrike,
  reachable,
  resolveEnemyPhase,
  skillReady,
  skillTargets,
  strikeTargets,
  threatCells,
  watchTriggers,
} from "@/game/sim";
import type { BattleAction, BattleState, BattleUnit, FxKind } from "@/game/types";
import type { Action } from "@/game/campaign";
import { ScarMarks, woundClass } from "./Scars";

type Float = { id: number; x: number; y: number; text: string; tone: string };

type Swing = {
  id: number;
  kind: FxKind;
  ax: number;
  ay: number;
  tx: number;
  ty: number;
};

type Motion = { id: number; dx: number; dy: number; kind: FxKind };

const TERRAIN_NAME: Record<string, string> = {
  ".": "open ground",
  "#": "stone, nothing passes",
  r: "rubble, cover from arrows",
  t: "forest, hidden unless they stand next to you",
  m: "mire, slow, less grit, will not hold a Watch",
};

export function Battle({
  battle,
  company,
  muted,
  shakeOn,
  dispatch,
}: {
  battle: BattleState;
  company: string;
  muted: boolean;
  shakeOn: boolean;
  dispatch: (action: Action) => void;
}) {
  const mission = missionById(battle.missionId);
  const [selected, setSelected] = useState<string | null>(null);
  const [intent, setIntent] = useState<"skill" | "none">("none");
  const [hover, setHover] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [floats, setFloats] = useState<Float[]>([]);
  const [swings, setSwings] = useState<Swing[]>([]);
  const [hits, setHits] = useState<Record<string, number>>({});
  const [motions, setMotions] = useState<Record<string, Motion>>({});
  const played = useRef(0);
  const battleRef = useRef(battle);
  battleRef.current = battle;
  const fxSeen = useRef(-1);
  const boardRef = useRef<HTMLDivElement>(null);
  const outcomeSeen = useRef<string | null>(null);

  const w = battle.map[0]?.length ?? 8;
  const h = battle.map.length;
  const portraits = useMemo(
    () => [...new Set(battle.units.map((unit) => asset(`/art/${unit.art}.png`)))],
    [battle.missionId],
  );
  const [fieldOpen, setFieldOpen] = useState(false);
  const [fieldPct, setFieldPct] = useState(0);
  const [loadingArt] = useState(pickLoadingArt);
  useEffect(() => {
    let live = true;
    const files = [...new Set([...fieldFiles(mission.ground ?? mission.id), ...portraits, loadingArt])];
    const started = performance.now();
    let done = 0;
    setFieldOpen(false);
    setFieldPct(0);
    Promise.all(
      files.map((src) =>
        decodeImage(src).then(() => {
          done += 1;
          if (live) setFieldPct(done / files.length);
        }),
      ),
    ).then(async () => {
      const hold = 900 - (performance.now() - started);
      if (hold > 0) await new Promise((resolve) => window.setTimeout(resolve, hold));
      if (live) setFieldOpen(true);
    });
    return () => {
      live = false;
    };
  }, [mission.id, portraits, loadingArt]);
  const resolving = battle.phase === "enemy" && !battle.outcome;
  const sel = battle.units.find((u) => u.id === selected) ?? null;
  const prevSelected = useRef<string | null>(null);
  useEffect(() => {
    if (prevSelected.current !== selected) {
      prevSelected.current = selected;
      setIntent("none");
    }
  }, [selected]);

  useEffect(() => {
    const units = battleRef.current.units;
    const next = units.find((u) => u.team === "player" && !u.downed && !u.acted);
    setSelected(next?.id ?? units.find((u) => u.team === "player" && !u.downed)?.id ?? null);
    setIntent("none");
  }, [battle.round, battle.phase]);

  useEffect(() => {
    setSelected((cur) => {
      const units = battle.units;
      const current = units.find((u) => u.id === cur);
      if (current && !current.downed && !(current.team === "player" && current.acted)) return cur;
      const next = units.find((u) => u.team === "player" && !u.downed && !u.acted);
      return next?.id ?? current?.id ?? null;
    });
  }, [battle.units]);

  useEffect(() => {
    const log = battle.fxLog ?? (battle.lastFx ? [battle.lastFx] : []);
    if (fxSeen.current < 0) {
      fxSeen.current = log.reduce((max, fx) => Math.max(max, fx.serial), 0);
      return;
    }
    const fresh = log.filter((fx) => fx.serial > fxSeen.current);
    if (!fresh.length) return;
    fxSeen.current = fresh[fresh.length - 1].serial;
    const born: Float[] = [];
    const nextSwings: Swing[] = [];
    const nextHits: Record<string, number> = {};
    const nextMotions: Record<string, Motion> = {};
    for (const fx of fresh) {
      const unit = battle.units.find((u) => u.id === fx.unitId);
      if (unit) born.push({ id: fx.serial, x: unit.x, y: unit.y, text: fx.text, tone: fx.tone });
      if (fx.tone === "hurt" || fx.tone === "down" || fx.tone === "heal") nextHits[fx.unitId] = fx.serial;
      if ((fx.tone === "hurt" || fx.tone === "heal") && fx.sourceId && fx.kind) {
        const src = battle.units.find((u) => u.id === fx.sourceId);
        if (src && unit && !(src.id === unit.id && fx.kind === "heal")) {
          nextSwings.push({ id: fx.serial, kind: fx.kind, ax: src.x, ay: src.y, tx: unit.x, ty: unit.y });
          if (fx.kind === "melee" || fx.kind === "shot") {
            nextMotions[src.id] = { id: fx.serial, dx: unit.x - src.x, dy: unit.y - src.y, kind: fx.kind };
          }
        }
      }
      if (fx.tone === "hurt") playCue("hit", muted);
      if (fx.tone === "heal" || fx.tone === "mark") playCue("skill", muted);
      if (fx.tone === "down") playCue("down", muted);
    }
    if (born.length) {
      setFloats((prev) => [...prev, ...born]);
      window.setTimeout(() => {
        const ids = new Set(born.map((f) => f.id));
        setFloats((prev) => prev.filter((f) => !ids.has(f.id)));
      }, 900);
    }
    if (nextSwings.length) {
      setSwings((prev) => [...prev, ...nextSwings].slice(-6));
      const ids = new Set(nextSwings.map((s) => s.id));
      window.setTimeout(() => setSwings((prev) => prev.filter((s) => !ids.has(s.id))), 520);
    }
    if (Object.keys(nextHits).length) setHits((prev) => ({ ...prev, ...nextHits }));
    if (Object.keys(nextMotions).length) setMotions((prev) => ({ ...prev, ...nextMotions }));
    if (fresh.some((fx) => fx.tone === "hurt" || fx.tone === "down")) {
      setShake(true);
      const t = window.setTimeout(() => setShake(false), 280);
      return () => window.clearTimeout(t);
    }
  }, [battle.fxLog, battle.lastFx, battle.units, muted]);

  useEffect(() => {
    if (!battle.outcome) {
      outcomeSeen.current = null;
      return;
    }
    if (outcomeSeen.current === battle.outcome) return;
    outcomeSeen.current = battle.outcome;
    playCue(battle.outcome === "victory" ? "win" : "lose", muted);
  }, [battle.outcome, muted]);

  useEffect(() => {
    const snap = battleRef.current;
    if (snap.phase !== "enemy" || snap.outcome) return;
    const nonceNow = snap.enemyNonce;
    const local: number[] = [];
    const arm = (fn: () => void, ms: number) => {
      local.push(window.setTimeout(fn, ms));
    };
    arm(() => {
      if (played.current >= nonceNow) return;
      played.current = nonceNow;
      const frames = resolveEnemyPhase(battleRef.current);
      let i = 0;
      let prev = battleRef.current;
      const step = () => {
        if (i >= frames.length) return;
        const next = frames[i];
        const hit = next.fxSerial > (prev.fxSerial ?? 0);
        const moved = next.units.some((unit) => {
          const before = prev.units.find((other) => other.id === unit.id);
          return before && (before.x !== unit.x || before.y !== unit.y);
        });
        dispatch({ type: "replace-battle", battle: next });
        prev = next;
        i += 1;
        if (i < frames.length) arm(step, hit ? 560 : moved ? 340 : 220);
      };
      if (frames.length) step();
    }, 40);
    return () => {
      for (const id of local) window.clearTimeout(id);
    };
  }, [battle.enemyNonce, dispatch]);

  const threats = useMemo(() => {
    if (battle.phase !== "player" || battle.outcome) return new Set<string>();
    return new Set(threatCells(battle));
  }, [battle]);
  const watches = useMemo(() => new Set(watchTriggers(battle)), [battle]);
  const moveTiles = sel && sel.team === "player" && !sel.acted && !sel.downed ? reachable(battle, sel) : [];
  const strikes =
    sel && sel.team === "player" && !sel.acted && !sel.downed ? strikeTargets(battle, sel) : [];
  const skills =
    sel && sel.team === "player" && !sel.acted && !sel.downed && intent === "skill"
      ? skillTargets(battle, sel)
      : [];
  const chips = useMemo(() => {
    const next = new Map<string, string>();
    if (!sel || sel.team !== "player" || sel.acted || sel.downed || battle.outcome) return next;
    const aiming = intent === "skill";
    const targets = aiming ? skillTargets(battle, sel) : strikeTargets(battle, sel);
    for (const target of targets) next.set(target.id, aimChip(battle, sel, target, aiming));
    return next;
  }, [battle, sel, intent]);
  const acting =
    battle.phase === "enemy"
      ? (battle.units.find((u) => u.team === "enemy" && !u.downed && !u.acted) ?? null)
      : sel && sel.team === "player" && !sel.acted && !sel.downed
        ? sel
        : null;

  function commit(action: BattleAction) {
    if (battle.outcome || resolving) return;
    if (action.type === "move") playCue("move", muted);
    dispatch({ type: "battle", action });
    if (action.type !== "move" && action.type !== "undo") setIntent("none");
  }

  function onCell(x: number, y: number) {
    if (battle.outcome || resolving || battle.phase !== "player") return;
    const occ = battle.units.find((u) => !u.downed && u.x === x && u.y === y) ?? null;
    if (sel && sel.team === "player" && !sel.acted && !sel.downed) {
      if (intent === "skill" && occ && skills.some((t) => t.id === occ.id)) {
        commit({ type: "skill", unitId: sel.id, targetId: occ.id });
        return;
      }
      if (occ && occ.team === "enemy" && strikes.some((t) => t.id === occ.id) && intent !== "skill") {
        commit({ type: "strike", unitId: sel.id, targetId: occ.id });
        return;
      }
      if (!occ && moveTiles.some((t) => t.x === x && t.y === y)) {
        commit({ type: "move", unitId: sel.id, x, y });
        return;
      }
    }
    if (occ) {
      setSelected(occ.id);
      setIntent("none");
      playCue("ui", muted);
    }
  }

  const hoverUnit = hover ? battle.units.find((u) => u.id === hover && !u.downed) : undefined;
  const forecast = (() => {
    if (!sel || sel.team !== "player" || sel.acted || sel.downed) return null;
    if (intent === "skill") {
      const st = hoverUnit && skills.some((t) => t.id === hoverUnit.id) ? hoverUnit : null;
      if (!st) {
        if (!skills.length) return "No one in reach of that skill.";
        if (skills.length === 1) return `${skills[0].name}. ${forecastSkill(battle, sel, skills[0])}`;
        return "The numbers are the skill, before you spend it.";
      }
      return `${st.name}. ${forecastSkill(battle, sel, st)}`;
    }
    const target = hoverUnit && strikes.some((t) => t.id === hoverUnit.id) ? hoverUnit : null;
    if (!target) {
      if (!strikes.length) return sel.moved ? `${sel.name}. No strike from here.` : `${sel.name}. Move, then strike. The numbers land before you spend them.`;
      if (strikes.length === 1) return `${strikes[0].name}. ${forecastStrike(battle, sel, strikes[0])}`;
      return `${sel.name}. The numbers are the strike, before you spend it.`;
    }
    return `${target.name}. ${forecastStrike(battle, sel, target)}`;
  })();

  return (
    <section className="battle" data-place={mission.ground ?? mission.id} style={{ ["--cols" as string]: String(w), ["--rows" as string]: String(h) }}>
      {!fieldOpen && <FieldLoading title={mission.name} place={mission.place} pct={fieldPct} src={loadingArt} />}
      <header className="field-bar">
        <div>
          <strong>{mission.name}</strong>
          <span>
            Round {battle.round}
            <span className="dot" />
            {battle.objective === "leader" ? "Fell the leader" : "Rout them"}
            <span className="dot" />
            {battle.phase === "player"
              ? acting
                ? `${acting.name} acts`
                : "Every blade has acted"
              : acting
                ? `${acting.name} steps`
                : "Their turn"}
          </span>
        </div>
        <button type="button" className="btn btn-gold" disabled={resolving || Boolean(battle.outcome)} onClick={() => commit({ type: "end-phase" })}>
          End phase
        </button>
      </header>

      <div className={`board-wrap ${shake && shakeOn ? "shake" : ""}`}>
        <div className="board-frame">
        <div
          ref={boardRef}
          className={`board${fieldOpen ? " is-ready" : ""}`}
          data-place={mission.ground ?? mission.id}
          style={{
            gridTemplateColumns: `repeat(${w}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${h}, minmax(0, 1fr))`,
            ["--cols" as string]: String(w),
            ["--rows" as string]: String(h),
          }}
          onPointerLeave={() => setHover(null)}
        >
          {battle.map.flatMap((row, y) =>
            row.split("").map((tile, x) => {
              const occ = battle.units.find((u) => !u.downed && u.x === x && u.y === y);
              const isMove = moveTiles.some((t) => t.x === x && t.y === y);
              const isStrike = Boolean(occ && strikes.some((t) => t.id === occ.id) && intent !== "skill");
              const isSkill = Boolean(occ && skills.some((t) => t.id === occ.id));
              const threatened = threats.has(`${x},${y}`);
              const watched = watches.has(`${x},${y}`);
              const placed = {
                gridColumn: x + 1,
                gridRow: y + 1,
                ["--x" as string]: String(x),
                ["--y" as string]: String(y),
              };
              const cls = [
                "cell",
                tile === "#" ? "cell-wall" : "",
                tile === "r" ? "cell-rubble" : "",
                tile === "t" ? "cell-thicket" : "",
                tile === "m" ? "cell-mire" : "",
                tile === "." ? "cell-open" : "",
                isMove ? "cell-move" : "",
                isStrike ? "cell-strike" : "",
                isSkill ? "cell-skill" : "",
                threatened && !isMove && !isStrike && !isSkill && occ?.id !== selected ? "cell-threat" : "",
                threatened && isMove ? "cell-move-threat" : "",
                watched ? "cell-watch" : "",
                occ?.id === selected ? (occ.team === "player" ? "cell-selected" : "cell-selected-foe") : "",
              ]
                .filter(Boolean)
                .join(" ");
              if (tile === "#") {
                return <div key={`${x}-${y}`} className={cls} style={placed} data-cell={`${x},${y}`} data-var={(x + y) % 2} aria-hidden />;
              }
              const chip = occ ? chips.get(occ.id) : undefined;
              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  className={cls}
                  style={placed}
                  data-cell={`${x},${y}`}
                  data-var={(x + y) % 2}
                  aria-label={[
                    TERRAIN_NAME[tile] ?? "ground",
                    threatened ? "in their reach" : "",
                    watched ? "a foe who steps here eats the Watch" : "",
                    occ ? readUnit(occ) : "",
                    chip ? `before you spend it, ${chip}` : "",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                  onClick={() => onCell(x, y)}
                  onPointerEnter={() => occ && setHover(occ.id)}
                />
              );
            }),
          )}
          <span className="ash" aria-hidden />
          <span className="ash ash-2" aria-hidden />
          <span className="ash ash-3" aria-hidden />
          <span className="ash ash-4" aria-hidden />
          {battle.units.map((unit) => (
            <Token
              key={unit.id}
              unit={unit}
              ground={battle.map[unit.y]?.[unit.x] ?? "."}
              selected={unit.id === selected}
              acting={unit.id === acting?.id}
              chip={chips.get(unit.id) ?? null}
              hit={hits[unit.id] ?? 0}
              motion={motions[unit.id] ?? null}
            />
          ))}
          <StrikeLayer swings={swings} />
        </div>
        {floats.map((f) => (
          <span
            key={f.id}
            className={`floater floater-${f.tone}`}
            style={{ left: `${((f.x + 0.5) / w) * 100}%`, top: `${((f.y + 0.15) / h) * 100}%` }}
          >
            {f.text}
          </span>
        ))}
        </div>
      </div>

      <ul className="roster-mini field-roster">
        {battle.units
          .filter((u) => u.team === "player")
          .map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className={`mini ${u.id === selected ? "is-on" : ""} ${u.id === acting?.id ? "is-acting" : ""} ${u.downed ? "is-down" : ""} ${woundClass(u.scars ?? 0, Boolean(u.frail))}`}
                onClick={() => {
                  setSelected(u.id);
                  setIntent("none");
                }}
              >
                <span className={`portrait ${woundClass(u.scars ?? 0, Boolean(u.frail))}`}>
                  <img src={asset(`/art/${u.art}.png`)} alt="" />
                  <ScarMarks scars={u.scars ?? 0} frail={Boolean(u.frail)} />
                </span>
                <span className="mini-meta">
                  <strong>{u.name}</strong>
                  <em>{u.downed ? "Down" : u.acted ? "Acted" : "Ready"}</em>
                </span>
              </button>
            </li>
          ))}
      </ul>

      {sel && sel.team === "player" && !sel.downed && !battle.outcome && (
        <div className="field-hud">
          <span className="field-who">
            <strong>{sel.name}</strong>
            <em>
              {sel.hp}/{sel.maxHp}
            </em>
          </span>
          <button
            type="button"
            className={`btn ${intent === "skill" ? "btn-gold" : "btn-ghost"}`}
            disabled={resolving || sel.acted || !skillReady(sel)}
            onClick={() => {
              playCue("ui", muted);
              if (SKILLS[sel.skill].kind === "banner") {
                commit({ type: "skill", unitId: sel.id, targetId: sel.id });
                return;
              }
              setIntent((v) => (v === "skill" ? "none" : "skill"));
            }}
          >
            {SKILLS[sel.skill].name}
          </button>
          <button type="button" className="btn btn-ghost" disabled={resolving || sel.acted} onClick={() => commit({ type: "wait", unitId: sel.id })}>
            Watch
          </button>
          <button type="button" className="btn btn-ghost" disabled={resolving || sel.acted || !sel.moved} onClick={() => commit({ type: "undo", unitId: sel.id })}>
            Undo
          </button>
          <p>{forecast}</p>
          <button
            type="button"
            className="text-btn"
            disabled={Boolean(battle.outcome) || resolving}
            onClick={() => {
              const next = structuredClone(battle);
              next.outcome = "retreat";
              next.log = [...next.log, "The company withdraws from the contract."];
              dispatch({ type: "replace-battle", battle: next });
            }}
          >
            Withdraw
          </button>
        </div>
      )}

      {battle.outcome && (
        <div className="veil">
          <div className="plate">
            <p className="kicker">{battle.outcome === "victory" ? "Contract kept" : "Contract broken"}</p>
            <h2 className="display">{battle.outcome === "victory" ? "The field is yours" : "The company falls back"}</h2>
            <p>{battle.log[battle.log.length - 1]}</p>
            <button type="button" className="btn btn-gold" onClick={() => dispatch({ type: "to-aftermath" })}>
              <Flag />
              Count the cost
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function FieldLoading({ title, place, pct, src }: { title: string; place: string; pct: number; src: string }) {
  return (
    <div className="field-load" role="status" aria-live="polite" aria-label={`Loading ${title}`}>
      <img src={src} alt="" />
      <div className="field-load-copy">
        <p className="kicker">{place}</p>
        <h2 className="display">{title}</h2>
        <p className="quiet">The ground is being walked.</p>
        <span className="load-track" aria-hidden>
          <i style={{ transform: `scaleX(${pct})` }} />
        </span>
      </div>
    </div>
  );
}

function readUnit(unit: BattleUnit): string {
  const bits = [`${unit.name}, ${unit.hp} of ${unit.maxHp}`];
  if (unit.mark) bits.push(`${MARK_LABEL[unit.mark.kind]}, ${unit.mark.turns} ${unit.mark.turns === 1 ? "turn" : "turns"} left`);
  if (unit.pinned > 0) bits.push(`pinned for ${unit.pinned}`);
  if (unit.watch) bits.push("watching");
  return bits.join(", ");
}

function Token({
  unit,
  ground,
  selected,
  acting,
  chip,
  hit,
  motion,
}: {
  unit: BattleUnit;
  ground: string;
  selected: boolean;
  acting: boolean;
  chip: string | null;
  hit: number;
  motion: Motion | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef({ x: unit.x, y: unit.y, id: unit.id });
  const hitSeen = useRef(0);
  const motionSeen = useRef(0);
  const [stepping, setStepping] = useState(false);
  const [flash, setFlash] = useState(false);
  const motionRef = useRef(motion);
  motionRef.current = motion;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = prev.current;
    const same = from.id === unit.id && from.x === unit.x && from.y === unit.y;
    if (same || from.id !== unit.id) {
      prev.current = { x: unit.x, y: unit.y, id: unit.id };
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gap = Number.parseFloat(getComputedStyle(el.parentElement ?? el).columnGap) || 0;
    const rect = el.getBoundingClientRect();
    const dx = (from.x - unit.x) * (rect.width + gap);
    const dy = (from.y - unit.y) * (rect.height + gap);
    prev.current = { x: unit.x, y: unit.y, id: unit.id };
    if (reduce || (dx === 0 && dy === 0) || rect.width === 0) return;

    setStepping(true);
    el.style.zIndex = "6";
    const lean = Math.sign(unit.x - from.x) * 7;
    const slide = el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) rotate(0deg)` },
        { transform: `translate(${dx * 0.55}px, ${dy * 0.55}px) rotate(${lean}deg)`, offset: 0.46 },
        { transform: "translate(0px, 0px) rotate(0deg)" },
      ],
      { duration: 420, easing: "cubic-bezier(.22,.75,.25,1)", fill: "both" },
    );
    const img = el.querySelector("img");
    const hop = img?.animate(
      [
        { transform: "translateX(-50%) translateY(0px)" },
        { transform: "translateX(-50%) translateY(-12px)", offset: 0.42 },
        { transform: "translateX(-50%) translateY(0px)" },
      ],
      { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
    let done = false;
    let alive = true;
    const finish = () => {
      if (!alive || done) return;
      done = true;
      el.style.zIndex = "";
      setStepping(false);
    };
    slide.onfinish = finish;
    slide.oncancel = finish;
    return () => {
      alive = false;
      slide.cancel();
      hop?.cancel();
    };
  }, [unit.id, unit.x, unit.y]);

  useLayoutEffect(() => {
    const swing = motionRef.current;
    if (!swing || swing.id === motionSeen.current) return;
    motionSeen.current = swing.id;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || (swing.dx === 0 && swing.dy === 0)) return;
    const gap = Number.parseFloat(getComputedStyle(el.parentElement ?? el).columnGap) || 0;
    const stepX = swing.dx * (rect.width + gap);
    const stepY = swing.dy * (rect.height + gap);
    const dist = Math.hypot(stepX, stepY) || 1;
    const travel = swing.kind === "melee" ? Math.min(rect.width * 0.48, dist * 0.45) : rect.width * 0.14;
    const sign = swing.kind === "melee" ? 1 : -1;
    const ux = (stepX / dist) * travel * sign;
    const uy = (stepY / dist) * travel * sign;
    el.style.zIndex = "7";
    const anim = el.animate(
      [
        { transform: "translate(0px, 0px) rotate(0deg)" },
        { transform: `translate(${ux}px, ${uy}px) rotate(${Math.sign(swing.dx) * 8}deg)`, offset: 0.38 },
        { transform: "translate(0px, 0px) rotate(0deg)" },
      ],
      { duration: swing.kind === "melee" ? 320 : 240, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
    const finish = () => {
      el.style.zIndex = "";
    };
    anim.onfinish = finish;
    anim.oncancel = finish;
    return () => anim.cancel();
  }, [motion?.id]);

  useLayoutEffect(() => {
    if (!hit || hit === hitSeen.current) return;
    hitSeen.current = hit;
    setFlash(true);
    const el = ref.current;
    const img = el?.querySelector("img");
    let anim: Animation | undefined;
    if (img && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      anim = img.animate(
        [
          { transform: "translateX(-50%) translate(0px, 0px)", filter: "brightness(1)" },
          { transform: "translateX(-50%) translate(5px, -2px)", filter: "brightness(2.2)", offset: 0.25 },
          { transform: "translateX(-50%) translate(-3px, 1px)", filter: "brightness(1.3)", offset: 0.55 },
          { transform: "translateX(-50%) translate(0px, 0px)", filter: "brightness(1)" },
        ],
        { duration: 280, easing: "ease-out" },
      );
    }
    const t = window.setTimeout(() => setFlash(false), 320);
    return () => {
      window.clearTimeout(t);
      anim?.cancel();
    };
  }, [hit]);

  if (unit.downed) return null;
  const cls = [
    "token",
    unit.team === "player" ? "token-ally" : "token-enemy",
    selected ? "is-selected" : "",
    unit.acted && unit.team === "player" ? "is-acted" : "",
    unit.watch ? "is-watch" : "",
    acting ? "is-acting" : "",
    stepping ? "is-stepping" : "",
    flash ? "is-hit" : "",
    woundClass(unit.scars ?? 0, Boolean(unit.frail)),
  ]
    .filter(Boolean)
    .join(" ");
  const bob = `${((unit.x * 7 + unit.y * 5) % 11) * 0.18}s`;
  return (
    <div ref={ref} className={cls} style={{ gridColumn: unit.x + 1, gridRow: unit.y + 1, ["--bob" as string]: bob }}>
      {acting && <span className="acting-ring" aria-hidden />}
      <img src={asset(`/art/${unit.art}.png`)} alt={unit.name} />
      {(selected || acting) && <em className="who">{unit.name.split(" ")[0]}</em>}
      <ScarMarks scars={unit.scars ?? 0} frail={Boolean(unit.frail)} />
      <HealthBar hp={unit.hp} max={unit.maxHp} team={unit.team} />
      <span className="seals">
        {unit.mark && (
          <em className={`seal-pip pip-${unit.mark.kind}`}>
            {MARK_SHORT[unit.mark.kind]} <b>{unit.mark.turns}</b>
          </em>
        )}
        {unit.pinned > 0 && (
          <em className="seal-pip pip-pin">
            Pin <b>{unit.pinned}</b>
          </em>
        )}
        {unit.watch && <em className="seal-pip pip-watch">Watch</em>}
        {ground === "t" && <em className="seal-pip pip-hid">Hid</em>}
        {ground === "m" && <em className="seal-pip pip-bog">Bog</em>}
        {ground === "r" && <em className="seal-pip pip-cover">Cover</em>}
      </span>
      {chip && <em className="aim-chip">{chip}</em>}
    </div>
  );
}

function UnitCard({
  unit,
  ground,
  forecast,
  source,
}: {
  unit: BattleUnit;
  ground: string;
  forecast: string | null;
  source?: string;
}) {
  const skill = SKILLS[unit.skill];
  return (
    <div className={`unit-card ${woundClass(unit.scars ?? 0, Boolean(unit.frail))}`}>
      <span className={`portrait ${woundClass(unit.scars ?? 0, Boolean(unit.frail))}`}>
        <img src={asset(`/art/${unit.art}.png`)} alt="" />
        <ScarMarks scars={unit.scars ?? 0} frail={Boolean(unit.frail)} />
      </span>
      <div>
        <p className="kicker">
          {unit.role}
          {unit.leader ? " · leader" : ""}
          {unit.frail ? " · last blood" : ""}
          {unit.team === "player" && !unit.downed ? (unit.watch ? " · watching" : unit.acted ? " · acted" : " · ready") : ""}
        </p>
        <h2>{unit.name}</h2>
        <HealthBar hp={unit.hp} max={unit.maxHp} team={unit.team} inline />
        <p className="stats">
          {unit.hp}/{unit.maxHp} hp
          <span className="dot" />
          {unit.atk} strike
          <span className="dot" />
          {unit.def} grit
          <span className="dot" />
          move {unit.mov}
          <span className="dot" />
          reach {unit.rng}
        </p>
        {unit.mark && (
          <p className={`mark-line mark-${unit.mark.kind}`}>
            {MARK_LABEL[unit.mark.kind]} · {unit.mark.turns} {unit.mark.turns === 1 ? "turn" : "turns"} left
            {source ? ` · laid by ${source}` : ""}
          </p>
        )}
        {unit.pinned > 0 && (
          <p className="mark-line mark-pin">Pinned · {unit.pinned} {unit.pinned === 1 ? "turn" : "turns"} left</p>
        )}
        {ground === "t" && <p className="quiet">Hidden in the trees. Only a blade beside them, or something in the air, can pick them out.</p>}
        {ground === "r" && <p className="quiet">Rubble covers them from arrows.</p>}
        {ground === "m" && <p className="quiet">Bogged. Two less grit. The mire will not hold a Watch.</p>}
        {skill.kind !== "none" && <p className="quiet">{skill.blurb}</p>}
        {talentNames(unit.known).length > 0 && <p className="quiet">{talentNames(unit.known).join(" · ")}</p>}
        {unit.brandsOnStrike && <p className="quiet">Strikes lay Ashbrand.</p>}
        {unit.watch && <p className="quiet">Watching. Gold stripes are the step that eats the cut.</p>}
        {forecast && <p className="forecast">{forecast}</p>}
      </div>
    </div>
  );
}

function HealthBar({
  hp,
  max,
  team,
  inline = false,
}: {
  hp: number;
  max: number;
  team: "player" | "enemy";
  inline?: boolean;
}) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (hp / max) * 100));
  const low = pct > 0 && pct <= 35;
  return (
    <span
      className={`hp ${team === "player" ? "hp-ally" : "hp-foe"} ${low ? "is-low" : ""} ${inline ? "hp-inline" : ""}`}
      role={inline ? undefined : "meter"}
      aria-hidden={inline ? true : undefined}
      aria-valuenow={inline ? undefined : Math.max(0, hp)}
      aria-valuemin={inline ? undefined : 0}
      aria-valuemax={inline ? undefined : max}
      aria-label={inline ? undefined : `${Math.max(0, hp)} of ${max} health`}
    >
      <span className="hp-track">
        <i className="hp-ghost" style={{ width: `${pct}%` }} />
        <i className="hp-fill" style={{ width: `${pct}%` }} />
      </span>
      {!inline && <b>{Math.max(0, hp)}</b>}
    </span>
  );
}

function StrikeLayer({ swings }: { swings: Swing[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const [frame, setFrame] = useState<{
    w: number;
    h: number;
    items: (Swing & { x1: number; y1: number; x2: number; y2: number })[];
  } | null>(null);

  useLayoutEffect(() => {
    const board = ref.current?.parentElement;
    if (!board || swings.length === 0) {
      setFrame(null);
      return;
    }
    const br = board.getBoundingClientRect();
    const items = swings.flatMap((swing) => {
      const from = board.querySelector(`[data-cell="${swing.ax},${swing.ay}"]`);
      const to = board.querySelector(`[data-cell="${swing.tx},${swing.ty}"]`);
      if (!from || !to) return [];
      const ar = from.getBoundingClientRect();
      const tr = to.getBoundingClientRect();
      return [
        {
          ...swing,
          x1: ar.left + ar.width / 2 - br.left,
          y1: ar.top + ar.height * 0.36 - br.top,
          x2: tr.left + tr.width / 2 - br.left,
          y2: tr.top + tr.height * 0.36 - br.top,
        },
      ];
    });
    setFrame({ w: Math.max(1, br.width), h: Math.max(1, br.height), items });
  }, [swings]);

  return (
    <>
      <svg ref={ref} className="fx-layer" viewBox={frame ? `0 0 ${frame.w} ${frame.h}` : "0 0 1 1"} aria-hidden>
        {frame?.items.map((swing) => (
          <SwingMark key={swing.id} swing={swing} />
        ))}
      </svg>
      {frame?.items
        .filter((swing) => swing.kind === "shot")
        .map((swing) => <Bolt key={swing.id} swing={swing} />)}
    </>
  );
}

function Bolt({ swing }: { swing: Swing & { x1: number; y1: number; x2: number; y2: number } }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const anim = el.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.55)" },
        { transform: `translate(${swing.x2 - swing.x1}px, ${swing.y2 - swing.y1}px) translate(-50%, -50%) scale(1)` },
      ],
      { duration: 200, easing: "cubic-bezier(.25,.1,.2,1)", fill: "forwards" },
    );
    return () => anim.cancel();
  }, [swing.x1, swing.y1, swing.x2, swing.y2]);
  return <span ref={ref} className="bolt" style={{ left: swing.x1, top: swing.y1 }} />;
}

function SwingMark({ swing }: { swing: Swing & { x1: number; y1: number; x2: number; y2: number } }) {
  if (swing.kind === "hex" || swing.kind === "heal") {
    return <circle className={swing.kind === "heal" ? "heal-ring" : "hex-ring"} cx={swing.x2} cy={swing.y2} r="16" />;
  }
  const start = swing.kind === "melee" ? 0.55 : 0;
  const x1 = swing.x1 + (swing.x2 - swing.x1) * start;
  const y1 = swing.y1 + (swing.y2 - swing.y1) * start;
  const cross = Math.atan2(swing.y2 - swing.y1, swing.x2 - swing.x1) + Math.PI / 2;
  const len = 20;
  return (
    <g className={`swing swing-${swing.kind}`}>
      <line x1={x1} y1={y1} x2={swing.x2} y2={swing.y2} pathLength={1} />
      {swing.kind === "melee" && (
        <line
          pathLength={1}
          x1={swing.x2 - Math.cos(cross) * len}
          y1={swing.y2 - Math.sin(cross) * len}
          x2={swing.x2 + Math.cos(cross) * len}
          y2={swing.y2 + Math.sin(cross) * len}
        />
      )}
    </g>
  );
}
