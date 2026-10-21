import { useEffect, useReducer, useRef, useState } from "react";
import { BookOpen, Coins, Crosshair, Eye, Flag, Flame, Footprints, GitBranch, Hourglass, Moon, Music, Shield, Skull, Swords, Tent, Volume2, VolumeX, X, type LucideIcon } from "lucide-react";
import { HOT_MEAL, MERC_DEFS, SKILLS, missionById } from "@/game/data";
import { appliedStats, branchesOf, talentNames } from "@/game/talents";
import {
  initialCampaign,
  nextOffer,
  radiantOffers,
  reducer,
  renownTitle,
  visibleMissions,
  type Action,
} from "@/game/campaign";
import {
  clearSlot,
  loadSettings,
  loadSlots,
  migrateLegacySave,
  restoreShelved,
  saveSettings,
  shelvedCompanies,
  writeSlot,
  type Settings,
  type SlotFile,
} from "@/game/saves";
import { pickLoadingArt } from "@/game/terrain";
import { asset } from "@/game/assets";
import { playCue, resumeAudio, unlockAudio } from "@/game/audio";
import type { Campaign, Merc } from "@/game/types";
import { Battle } from "./Battle";
import { MainMenu, TitleMenu, BootScreen } from "./Menu";
import { isFrail, ScarMarks, woundClass } from "./Scars";

export function Game() {
  const [state, dispatch] = useReducer(reducer, null, initialCampaign);
  const [ready, setReady] = useState(false);
  const [painted, setPainted] = useState(false);
  const [boot, setBoot] = useState<"title" | "menu" | "play">("title");
  const [slot, setSlot] = useState<number | null>(null);
  const [slots, setSlots] = useState<(SlotFile | null)[]>([]);
  const [settings, setSettings] = useState<Settings>({ muted: false, shake: true });
  const [chronicle, setChronicle] = useState(false);
  const [sure, setSure] = useState(false);
  const [bootArt] = useState(pickLoadingArt);
  const slotRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  slotRef.current = slot;
  stateRef.current = state;

  useEffect(() => {
    let gone = false;
    const started = performance.now();
    const art = [bootArt, asset("/art/title.webp"), asset("/art/marches.jpg")].map((src) => {
      const img = new Image();
      img.src = src;
      return img.decode().catch(() => undefined);
    });
    void Promise.all(art).then(() => {
      const hold = Math.max(0, 900 - (performance.now() - started));
      window.setTimeout(() => {
        if (!gone) setPainted(true);
      }, hold);
    });
    return () => {
      gone = true;
    };
  }, [bootArt]);

  useEffect(() => {
    migrateLegacySave();
    setSlots(loadSlots());
    setSettings(loadSettings());
    setReady(true);
    const onPointer = () => unlockAudio();
    const onVis = () => {
      if (document.visibilityState === "visible") resumeAudio();
    };
    const onHide = () => {
      if (document.visibilityState !== "hidden") return;
      const index = slotRef.current;
      if (index === null) return;
      writeSlot(index, stateRef.current);
    };
    window.addEventListener("pointerdown", onPointer);
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  useEffect(() => {
    if (!ready || slot === null || state.screen === "title" || state.roster.length === 0) return;
    if (!writeSlot(slot, state)) return;
    setSlots(loadSlots());
  }, [state, ready, slot]);

  if (!ready || !painted) return <BootScreen src={bootArt} />;

  const go = (action: Action) => {
    if (action.type === "disband") {
      if (slotRef.current !== null) clearSlot(slotRef.current);
      setSlot(null);
      setSlots(loadSlots());
      setBoot("menu");
    }
    if (action.type !== "hydrate") playCue("ui", action.type === "mute" ? (action.muted ?? !state.muted) : state.muted);
    dispatch(action);
  };

  const applySettings = (next: Settings) => {
    setSettings(next);
    saveSettings(next);
    if (state.muted !== next.muted) dispatch({ type: "mute", muted: next.muted });
    playCue("ui", next.muted);
  };

  const loadFile = (index: number) => {
    const file = loadSlots()[index];
    if (!file) return;
    setSlot(index);
    dispatch({ type: "hydrate", save: { ...file.campaign, muted: settings.muted } });
    setBoot("play");
    playCue("ui", settings.muted);
  };

  const createFile = (index: number, name: string) => {
    setSlot(index);
    dispatch({ type: "new-game", name });
    dispatch({ type: "mute", muted: settings.muted });
    setBoot("play");
    playCue("ui", settings.muted);
  };

  return (
    <main className="game">
      {boot === "play" && (
        <button type="button" className="menu-back" onClick={() => setBoot("menu")}>
          Menu
        </button>
      )}
      {boot === "play" && (
        <button
          type="button"
          className="mute"
          aria-label={state.muted ? "Unmute" : "Mute"}
          onClick={() => applySettings({ ...settings, muted: !state.muted })}
        >
          {state.muted ? <VolumeX /> : <Volume2 />}
        </button>
      )}
      {boot === "title" && <TitleMenu onEnter={() => setBoot("menu")} />}
      {boot === "menu" && (
        <MainMenu
          slots={slots}
          settings={settings}
          onSettings={applySettings}
          onLoad={loadFile}
          onCreate={createFile}
          onDelete={(index) => {
            if (slot === index) go({ type: "disband" });
            else {
              clearSlot(index);
              setSlots(loadSlots());
            }
          }}
          shelved={shelvedCompanies()}
          onRestore={(name) => {
            if (!restoreShelved(name)) return;
            setSlots(loadSlots());
          }}
          onTitle={() => setBoot("title")}
        />
      )}
      {boot === "play" && state.screen === "table" && (
        <WarTable
          state={state}
          dispatch={go}
          chronicle={chronicle}
          setChronicle={setChronicle}
          sure={sure}
          setSure={setSure}
        />
      )}
      {boot === "play" && state.screen === "deploy" && state.deployId && (
        <Deploy state={state} dispatch={go} missionId={state.deployId} />
      )}
      {boot === "play" && state.screen === "battle" && state.battle && (
        <Battle
          battle={state.battle}
          company={state.companyName}
          muted={state.muted}
          shakeOn={settings.shake}
          dispatch={dispatch}
        />
      )}
      {boot === "play" && state.screen === "aftermath" && state.aftermath && (
        <AftermathView state={state} dispatch={go} />
      )}
      {boot === "play" && state.screen === "ending" && <Ending state={state} dispatch={go} />}
    </main>
  );
}

function WarTable({
  state,
  dispatch,
  chronicle,
  setChronicle,
  sure,
  setSure,
}: {
  state: Campaign;
  dispatch: (a: Action) => void;
  chronicle: boolean;
  setChronicle: (v: boolean) => void;
  sure: boolean;
  setSure: (v: boolean) => void;
}) {
  const living = state.roster.filter((m) => m.alive);
  const dead = state.roster.filter((m) => !m.alive);
  const [treeId, setTreeId] = useState<string | null>(null);
  const [refuseId, setRefuseId] = useState<string | null>(null);
  const owned = new Set(state.roster.map((m) => m.defId));
  const offer = nextOffer(state);
  const second = state.cleared.includes("naming");
  const contracts = visibleMissions(state);
  const radiant = radiantOffers(state);
  const hires = MERC_DEFS.filter((d) => {
    if (!d.cost || owned.has(d.id)) return false;
    if (d.id === "vetch") return state.cleared.includes("toll");
    if (d.id === "halden") return state.cleared.includes("orchard");
    if (d.id === "bran") return state.cleared.includes("chapel");
    if (d.id === "quill") return state.cleared.includes("iron");
    return false;
  });

  return (
    <section className="table">
      <header className="mast">
        <div>
          <p className="kicker">{renownTitle(state)}</p>
          <h1 className="display">{state.companyName}</h1>
          <p className="quiet">Pale Marches of Veyr</p>
        </div>
        <div className="purse">
          <span>
            <Coins /> {state.gold}
          </span>
          <span>
            <Flag /> {state.renown} renown
          </span>
        </div>
      </header>

      <figure className="march-banner">
        <img src={asset("/art/marches.jpg")} alt="A soot-stained map of the Pale Marches" />
        <figcaption>{second ? "The second table" : "Contracts on the war table"}</figcaption>
      </figure>

      <ol className="doctrine">
        <li>Move, then strike or use a skill. One action after the step.</li>
        <li>Watch, and the first foe who steps into reach eats the cut.</li>
        {second ? (
          <li>They lay Ashbrand, Hexrot, and Blooddebt. Spend theirs, or wear them.</li>
        ) : (
          <li>Sera's strikes lay Ashbrand. Marrow lays Hexrot. Marks wait to be spent.</li>
        )}
        <li>A mark spent by someone else cuts deeper. That is how a company gets a name.</li>
      </ol>

      <div className="table-grid">
        <div>
          <h2>{second ? "The second table" : "Contracts"}</h2>
          {second && <p className="quiet">The name was said. The trees still take renown. The next work points the marks back at you.</p>}
          <ul className="contracts">
            {contracts.map((mission, index) => {
              const prev = index === 0 ? null : contracts[index - 1].id;
              const done = state.cleared.includes(mission.id);
              const open = index === 0 || (prev && state.cleared.includes(prev));
              return (
                <li key={mission.id} className={open ? "is-open" : "is-locked"}>
                  <div>
                    <p className="kicker">{done ? "Kept" : open ? mission.place : "Sealed"}</p>
                    <h3>{mission.name}</h3>
                    <p>{open ? mission.brief : "Finish the contract before this one."}</p>
                    {open && (
                      <p className="quiet">
                        {done ? `March again for ${Math.ceil(mission.gold / 2)} coin.` : `${mission.gold} coin · ${mission.renown} renown`}
                      </p>
                    )}
                    {state.bitter.includes(mission.id) && (
                      <p className="mark-line">Worse. You turned the last work down, and more of them came.</p>
                    )}
                    {state.refused.includes(mission.id) && !done && (
                      <p className="quiet">Turned down once. It is still there if you change your mind.</p>
                    )}
                  </div>
                  {open && (
                    <div className="contract-acts">
                      <button type="button" className="btn btn-gold" onClick={() => dispatch({ type: "open-deploy", missionId: mission.id })}>
                        {done ? "March again" : "Take it"}
                      </button>
                      {!done && offer === mission.id && !state.refused.includes(mission.id) && (
                        <button
                          type="button"
                          className="btn btn-blood"
                          onClick={() => {
                            if (refuseId === mission.id) {
                              dispatch({ type: "refuse", missionId: mission.id });
                              setRefuseId(null);
                            } else {
                              setRefuseId(mission.id);
                            }
                          }}
                        >
                          {refuseId === mission.id ? "Turn it down for certain" : "Turn it down"}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {radiant.length > 0 && (
            <>
              <h2>Radiant contracts</h2>
              <p className="quiet">Not men. The marches pay when the thing you kill was never a soldier.</p>
              <ul className="contracts">
                {radiant.map((mission) => {
                  const done = state.cleared.includes(mission.id);
                  return (
                    <li key={mission.id} className="is-open is-radiant">
                      <div>
                        <p className="kicker">{done ? "Kept" : "Radiant"}</p>
                        <h3>{mission.name}</h3>
                        <p>{mission.brief}</p>
                        <p className="quiet">
                          {done ? `Hunt again for ${Math.ceil(mission.gold / 2)} coin.` : `${mission.gold} coin · ${mission.renown} renown`}
                        </p>
                      </div>
                      <div className="contract-acts">
                        <button type="button" className="btn btn-gold" onClick={() => dispatch({ type: "open-deploy", missionId: mission.id })}>
                          {done ? "Hunt again" : "Take it"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div>
          <div className="section-head">
            <h2>Roster</h2>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={state.roster.length === 0}
              onClick={() => setTreeId(living[0]?.id ?? state.roster[0]?.id ?? null)}
            >
              <GitBranch />
              Skill trees
            </button>
          </div>
          <ul className="roster">
            {living.map((merc) => (
              <MercCard key={merc.id} merc={merc} />
            ))}
          </ul>
          {dead.length > 0 && (
            <>
              <h2 className="with-icon">
                <Skull /> In the ground
              </h2>
              <ul className="dead-list">
                {dead.map((m) => (
                  <li key={m.id}>{m.name}</li>
                ))}
              </ul>
            </>
          )}

          <h2>Camp</h2>
          <div className="camp-row">
            <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: "rest", kind: "cold" })}>
              <Moon />
              Cold camp
              <small>Free. Mend a portion.</small>
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={state.gold < HOT_MEAL}
              onClick={() => dispatch({ type: "rest", kind: "hot" })}
            >
              <Tent />
              Hot meal
              <small>{HOT_MEAL} coin. Full mend.</small>
            </button>
          </div>

          {hires.length > 0 ? (
            <>
              <h2>Hire</h2>
              <ul className="contracts">
                {hires.map((def) => (
                  <li key={def.id} className="is-open">
                    <div>
                      <p className="kicker">{def.role} · {def.cost} coin</p>
                      <h3>{def.name}</h3>
                      <p>{def.blurb}</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-gold"
                      disabled={state.gold < (def.cost ?? 0)}
                      onClick={() => dispatch({ type: "recruit", defId: def.id })}
                    >
                      Sign them
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : !state.cleared.includes("toll") ? (
            <p className="quiet">No blade is for sale until the toll is kept.</p>
          ) : null}

          <div className="camp-row">
            <button type="button" className="btn btn-ghost" onClick={() => setChronicle(!chronicle)}>
              <BookOpen />
              Chronicle
            </button>
            <button type="button" className="text-btn" onClick={() => setSure(!sure)}>
              {sure ? "Disband for certain?" : "Disband the company"}
            </button>
            {sure && (
              <button type="button" className="btn btn-blood" onClick={() => dispatch({ type: "disband" })}>
                Burn the book
              </button>
            )}
          </div>
          {chronicle && (
            <ol className="chronicle">
              {[...state.chronicle].reverse().map((entry) => (
                <li key={entry.id}>
                  <h3>{entry.title}</h3>
                  <p>{entry.body}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
      {treeId && (
        <TreeSheet
          state={state}
          mercId={treeId}
          dispatch={dispatch}
          onPick={setTreeId}
          onClose={() => setTreeId(null)}
        />
      )}
    </section>
  );
}

function MercCard({ merc }: { merc: Merc }) {
  const skill = SKILLS[merc.skill];
  const stats = appliedStats(merc);
  const learned = talentNames(merc.known);
  const frail = isFrail(merc.maxHp);
  return (
    <li className={`merc ${woundClass(merc.scars, frail)}`}>
      <span className={`portrait ${woundClass(merc.scars, frail)}`}>
        <img src={asset(`/art/${merc.art}.png`)} alt="" />
        <ScarMarks scars={merc.scars} frail={frail} />
      </span>
      <div>
        <p className="kicker">
          {merc.role}
          {frail ? " · last blood" : ""}
        </p>
        <h3>{merc.name}</h3>
        <p className="stats">
          {merc.hp}/{stats.maxHp}
          <span className="dot" />
          {skill.name}
          {stats.atk !== merc.atk || stats.def !== merc.def || stats.mov !== merc.mov || stats.rng !== merc.rng ? (
            <>
              <span className="dot" />
              {stats.atk} strike · {stats.def} grit · move {stats.mov} · reach {stats.rng}
            </>
          ) : null}
          {merc.scars > 0 && (
            <>
              <span className="dot" />
              {merc.scars} {merc.scars === 1 ? "scar" : "scars"}
            </>
          )}
        </p>
        <p className="quiet">{merc.blurb}</p>
        {learned.length > 0 && <p className="quiet">{learned.join(" · ")}</p>}
      </div>
    </li>
  );
}

function TreeSheet({
  state,
  mercId,
  dispatch,
  onPick,
  onClose,
}: {
  state: Campaign;
  mercId: string;
  dispatch: (a: Action) => void;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const merc = state.roster.find((m) => m.id === mercId) ?? state.roster[0];
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!merc) return null;
  return (
    <div className="tree-sheet" onClick={onClose}>
      <div
        className="tree-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tree-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="section-head">
          <div>
            <p className="kicker">{state.renown} renown left</p>
            <h2 id="tree-title">Skill trees</h2>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            <X />
            Close
          </button>
        </header>
        <div className="tree-picks">
          {state.roster.map((blade) => (
            <button
              key={blade.id}
              type="button"
              className={`${blade.id === merc.id ? "is-on" : ""} ${woundClass(blade.scars, isFrail(blade.maxHp))}`}
              aria-pressed={blade.id === merc.id}
              onClick={() => onPick(blade.id)}
            >
              <span className={`portrait ${woundClass(blade.scars, isFrail(blade.maxHp))}`}>
                <img src={asset(`/art/${blade.art}.png`)} alt="" />
                <ScarMarks scars={blade.scars} frail={isFrail(blade.maxHp)} />
              </span>
              <span>
                {blade.name}
                {!blade.alive ? " · ground" : ""}
              </span>
            </button>
          ))}
        </div>
        <p className="quiet">Five branches, each with its own trade. A branch splits three ways. You walk only one.</p>
        <SkillTree merc={merc} renown={state.renown} dispatch={dispatch} canLearn={merc.alive} />
      </div>
    </div>
  );
}
const MARK_ICON: Record<string, LucideIcon> = {
  flame: Flame,
  swords: Swords,
  hourglass: Hourglass,
  crosshair: Crosshair,
  eye: Eye,
  skull: Skull,
  shield: Shield,
  footprints: Footprints,
  music: Music,
  flag: Flag,
};

const SKILL_ICON: Record<string, LucideIcon> = {
  due: Swords,
  rothex: Skull,
  split: Crosshair,
  pyre: Music,
  owe: Swords,
  standard: Flag,
};

function SkillTree({
  merc,
  renown,
  dispatch,
  canLearn,
}: {
  merc: Merc;
  renown: number;
  dispatch: (a: Action) => void;
  canLearn: boolean;
}) {
  const skill = SKILLS[merc.skill];
  const shape = branchesOf(merc.defId);
  const known = merc.known ?? [];
  const [branchName, setBranchName] = useState(shape[0]?.branch ?? "");
  const [focusId, setFocusId] = useState<string | null>(null);
  useEffect(() => {
    setBranchName(branchesOf(merc.defId)[0]?.branch ?? "");
    setFocusId(null);
  }, [merc.id, merc.defId]);
  const branch = shape.find((item) => item.branch === branchName) ?? shape[0];
  const focus = branch?.subs.flatMap((sub) => sub.nodes).find((node) => node.id === focusId) ?? branch?.subs[0]?.nodes[0];
  const RootIcon = SKILL_ICON[merc.skill] ?? Swords;
  const takenSub = (subName: string) =>
    branch?.subs.some((sub) => sub.sub !== subName && sub.nodes.some((node) => known.includes(node.id))) ?? false;
  const nextOf = (nodes: { id: string; tier: number }[]) => nodes.find((node) => !known.includes(node.id));
  const prevFocus = branch?.subs.find((sub) => sub.sub === focus?.sub)?.nodes.find((node) => node.tier === (focus?.tier ?? 1) - 1);
  const needsPrev = Boolean(focus && focus.tier > 1 && prevFocus && !known.includes(prevFocus.id));
  const canBuy = Boolean(
    canLearn &&
      focus &&
      !known.includes(focus.id) &&
      renown >= focus.cost &&
      !takenSub(focus.sub) &&
      !needsPrev,
  );
  return (
    <div className="tree" aria-label={`${merc.name} skill tree`}>
      <div className="tree-figure">
        <svg className="tree-wood" viewBox="0 0 300 470" preserveAspectRatio="none" aria-hidden>
          <path className="wood" d="M150 32 V78" />
          {shape.map((item, index) => {
            const x = 46 + index * 52;
            const lit = item.subs.some((sub) => sub.nodes.some((node) => known.includes(node.id)));
            return <path key={item.branch} className={`wood ${lit ? "is-lit" : ""} ${item.branch === branch?.branch ? "is-chosen" : ""}`} d={`M150 48 Q150 78 ${x} 96`} />;
          })}
          {branch &&
            branch.subs.map((sub, index) => {
              const locked = takenSub(sub.sub);
              const side = index - 1;
              const owned = sub.nodes.filter((node) => known.includes(node.id)).length;
              const vine = (count: number) => {
                let d = `M150 128`;
                for (let step = 0; step < count; step += 1) {
                  const x = 150 + side * (64 + step * 5);
                  const y = 176 + step * 56;
                  const prevY = step === 0 ? 128 : 176 + (step - 1) * 56;
                  const prevX = step === 0 ? 150 : 150 + side * (64 + (step - 1) * 5);
                  d += ` Q ${(prevX + x) / 2} ${prevY + 22} ${x} ${y}`;
                }
                return d;
              };
              return (
                <g key={sub.sub}>
                  <path className={`wood ${locked ? "is-locked" : ""}`} d={vine(5)} />
                  {owned > 0 && <path className="wood is-lit" d={vine(owned)} />}
                </g>
              );
            })}
        </svg>
        <div className="tree-root tree-root-float">
          <span className="seal is-owned">
            <RootIcon aria-hidden />
          </span>
          <strong>{skill.name}</strong>
        </div>
        {shape.map((item, index) => {
          const started = item.subs.some((sub) => sub.nodes.some((node) => known.includes(node.id)));
          const Icon = MARK_ICON[item.subs[0]?.icon ?? "swords"] ?? Swords;
          return (
            <button
              key={item.branch}
              type="button"
              className={`tree-bud ${item.branch === branch?.branch ? "is-on" : ""} ${started ? "is-started" : ""}`}
              style={{ left: `${((46 + index * 52) / 300) * 100}%`, top: "20.4%" }}
              aria-pressed={item.branch === branch?.branch}
              onClick={() => {
                setBranchName(item.branch);
                setFocusId(null);
              }}
            >
              <span className="seal">
                <Icon aria-hidden />
              </span>
              <b>{item.branch}</b>
            </button>
          );
        })}
        {branch?.subs.map((sub, index) => {
          const locked = takenSub(sub.sub);
          const side = index - 1;
          const Icon = MARK_ICON[sub.icon] ?? Swords;
          const next = nextOf(sub.nodes);
          return sub.nodes.map((node, step) => {
            const x = 150 + side * (64 + step * 5);
            const y = 176 + step * 56;
            const owned = known.includes(node.id);
            const open = !locked && next?.id === node.id && canLearn && renown >= node.cost;
            const state = owned ? "is-owned" : locked ? "is-locked" : open ? "is-open" : "is-short";
            return (
              <button
                key={node.id}
                type="button"
                className={`tree-spot ${state} ${focus?.id === node.id ? "is-focus" : ""}`}
                style={{ left: `${(x / 300) * 100}%`, top: `${(y / 470) * 100}%` }}
                aria-pressed={focus?.id === node.id}
                aria-label={`${sub.sub}, step ${node.tier}, ${node.name}`}
                onClick={() => setFocusId(node.id)}
              >
                <span className="seal">
                  <Icon aria-hidden />
                  <small>{node.tier}</small>
                </span>
                {step === 0 && <b className="twig-name">{sub.sub}</b>}
              </button>
            );
          });
        })}
      </div>
      {shape.length === 0 && <p className="quiet">Coin bought the knife. There is no doctrine to walk.</p>}
      {focus && (
        <div className="node-detail">
          <p className="kicker">
            {branch?.branch} · {focus.sub} · step {focus.tier}
          </p>
          <h3>{focus.name}</h3>
          <p>{focus.blurb}</p>
          <button
            type="button"
            className="btn btn-gold"
            disabled={!canBuy}
            onClick={() => focus && dispatch({ type: "learn", mercId: merc.id, talentId: focus.id })}
          >
            {known.includes(focus.id)
              ? "Learned"
              : !canLearn
                ? "Too late"
                : takenSub(focus.sub)
                  ? "Another path of this branch"
                  : needsPrev
                    ? `Needs ${prevFocus?.name}`
                    : `Learn · ${focus.cost} renown`}
          </button>
        </div>
      )}
    </div>
  );
}

function Deploy({ state, dispatch, missionId }: { state: Campaign; dispatch: (a: Action) => void; missionId: string }) {
  const mission = missionById(missionId);
  const first = !state.cleared.includes(mission.id);
  const living = state.roster.filter((m) => m.alive && m.hp > 0);
  return (
    <section className="deploy">
      <header className="mast">
        <div>
          <p className="kicker">{mission.place}</p>
          <h1 className="display">{mission.name}</h1>
          <p>{mission.brief}</p>
          <p className="quiet">
            {mission.objective === "leader" ? "End the leader and the rest break." : "Leave none of them standing."}{" "}
            {first ? `${mission.gold} coin, ${mission.renown} renown.` : `${Math.ceil(mission.gold / 2)} coin. No new renown.`}
          </p>
          {state.bitter.includes(mission.id) && (
            <p className="mark-line">This work is worse. You turned the last one down, and another came.</p>
          )}
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: "table" })}>
          Back
        </button>
      </header>
      <p className="quiet">Four blades at most. Choose who walks.</p>
      <ul className="roster">
        {living.map((merc) => {
          const on = state.selectedDeploy.includes(merc.id);
          const frail = isFrail(merc.maxHp);
          return (
            <li key={merc.id}>
              <button
                type="button"
                className={`merc merc-btn ${on ? "is-on" : ""} ${woundClass(merc.scars, frail)}`}
                aria-pressed={on}
                onClick={() => dispatch({ type: "toggle-deploy", id: merc.id })}
              >
                <span className={`portrait ${woundClass(merc.scars, frail)}`}>
                  <img src={asset(`/art/${merc.art}.png`)} alt="" />
                  <ScarMarks scars={merc.scars} frail={frail} />
                </span>
                <div>
                  <p className="kicker">{on ? "Walking" : merc.role}</p>
                  <h3>{merc.name}</h3>
                  <p className="stats">
                    {merc.hp}/{appliedStats(merc).maxHp}
                    <span className="dot" />
                    {SKILLS[merc.skill].name}
                    {talentNames(merc.known).length > 0 && (
                      <>
                        <span className="dot" />
                        {talentNames(merc.known).join(", ")}
                      </>
                    )}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="btn btn-gold"
        disabled={state.selectedDeploy.length === 0}
        onClick={() => dispatch({ type: "start-battle" })}
      >
        Take the field ({state.selectedDeploy.length})
      </button>
    </section>
  );
}

function AftermathView({ state, dispatch }: { state: Campaign; dispatch: (a: Action) => void }) {
  const aftermath = state.aftermath;
  if (!aftermath) return null;
  const mission = missionById(aftermath.missionId);
  return (
    <section className="aftermath">
      <p className="kicker">{aftermath.victory ? "Paid" : "Unpaid"}</p>
      <h1 className="display">{mission.name}</h1>
      <ul>
        {aftermath.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {aftermath.buried.length > 0 && (
        <p className="mark-line">Buried: {aftermath.buried.join(", ")}</p>
      )}
      <p className="quiet">
        {state.companyName} · {state.gold} coin · {renownTitle(state)}
      </p>
      <button type="button" className="btn btn-gold" onClick={() => dispatch({ type: "close-aftermath" })}>
        {state.roster.some((m) => m.alive)
          ? state.cleared.includes("echo")
            ? "The name holds"
            : "Back to the war table"
          : "Close the book"}
      </button>
    </section>
  );
}

function Ending({ state, dispatch }: { state: Campaign; dispatch: (a: Action) => void }) {
  const named = state.ending === "name" || state.ending === "kept";
  return (
    <section className="ending">
      <img src={asset("/art/marches.jpg")} alt="" />
      <div>
        <p className="kicker">{named ? "The marches answer" : "Nothing left to hire"}</p>
        <h1 className="display display-xl">{named ? state.companyName : "Unburied and unnamed"}</h1>
        <p className="lede">
          {state.ending === "kept"
            ? `They tried to spend ${state.companyName} the way a mark is spent. The echo stopped. The name did not.`
            : named
              ? `They say ${state.companyName} the way they say a road they trust in the dark. The debt is still there. The name is not a debt.`
              : "Every blade is in the ground. The Pale Marches go back to forgetting. A new company can be raised, if anyone is fool enough."}
        </p>
        <button type="button" className="btn btn-gold" onClick={() => dispatch({ type: "disband" })}>
          {named ? "Raise another company" : "Begin again"}
        </button>
      </div>
    </section>
  );
}
