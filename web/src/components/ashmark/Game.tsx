import { useEffect, useReducer, useRef, useState } from "react";
import { Coins, Crosshair, Eye, Flag, Flame, Footprints, GitBranch, Hourglass, Moon, Music, Shield, Skull, Swords, Tent, Volume2, VolumeX, X, type LucideIcon } from "lucide-react";
import { HOT_MEAL, ENEMY_DEFS, MERC_DEFS, SKILLS, missionById } from "@/game/data";
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
import { pickLoadingArt, prepareTerrain } from "@/game/terrain";
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
    <main className="game" data-screen={boot === "play" ? state.screen : boot}>
      {boot === "play" && (
        <div className="chrome">
          <button type="button" className="menu-back" onClick={() => setBoot("menu")}>
            Menu
          </button>
          <button
            type="button"
            className="mute"
            aria-label={state.muted ? "Unmute" : "Mute"}
            onClick={() => applySettings({ ...settings, muted: !state.muted })}
          >
            {state.muted ? <VolumeX /> : <Volume2 />}
          </button>
        </div>
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
        <WarTable state={state} dispatch={go} sure={sure} setSure={setSure} />
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
  sure,
  setSure,
}: {
  state: Campaign;
  dispatch: (a: Action) => void;
  sure: boolean;
  setSure: (v: boolean) => void;
}) {
  const living = state.roster.filter((m) => m.alive);
  const dead = state.roster.filter((m) => !m.alive);
  const [treeId, setTreeId] = useState<string | null>(null);
  const [refuseId, setRefuseId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"hub" | "contracts" | "camp">("hub");
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
      {sheet === "hub" && (
        <div className="hub">
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
          <ul className="hub-roster">
            {living.map((merc) => (
              <MercCard key={merc.id} merc={merc} />
            ))}
          </ul>
          {dead.length > 0 && <p className="hub-dead">In the ground: {dead.map((m) => m.name).join(", ")}</p>}
          <nav className="hub-actions">
            <button type="button" className="btn btn-gold" onClick={() => setSheet("contracts")}>
              <Swords />
              Contracts
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={state.roster.length === 0}
              onClick={() => setTreeId(living[0]?.id ?? state.roster[0]?.id ?? null)}
            >
              <GitBranch />
              Skill trees
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setSheet("camp")}>
              <Tent />
              Camp
            </button>
          </nav>
        </div>
      )}

      {sheet === "contracts" && (
        <div className="sheet">
          <header className="sheet-bar">
            <button type="button" className="btn btn-ghost" onClick={() => setSheet("hub")}>
              Back
            </button>
            <div>
              <p className="kicker">{second ? "The second table" : "War table"}</p>
              <h2>Contracts</h2>
            </div>
          </header>
          <div className={radiant.length ? "contract-bands" : "contract-bands is-one"}>
            <div className="contract-band">
              {contracts.map((mission, index) => {
                const prev = index === 0 ? null : contracts[index - 1].id;
                const done = state.cleared.includes(mission.id);
                const open = index === 0 || Boolean(prev && state.cleared.includes(prev));
                return (
                  <article key={mission.id} className={`contract-card ${open ? "is-open" : "is-locked"}`}>
                    <p className="kicker">{done ? "Kept" : open ? mission.place : "Sealed"}</p>
                    <h3>{mission.name}</h3>
                    <p>{open ? mission.brief : "Finish the contract before this one."}</p>
                    {open && (
                      <p className="quiet">
                        {done ? `March again for ${Math.ceil(mission.gold / 2)} coin.` : `${mission.gold} coin · ${mission.renown} renown`}
                      </p>
                    )}
                    {open && (
                      <div className="contract-acts">
                        <button type="button" className="btn btn-gold" onClick={() => dispatch({ type: "open-deploy", missionId: mission.id })}>
                          {done ? "Again" : "Take it"}
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
                            {refuseId === mission.id ? "Certain" : "Refuse"}
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
            {radiant.length > 0 && (
              <div className="contract-band">
                {radiant.map((mission) => {
                  const done = state.cleared.includes(mission.id);
                  return (
                    <article key={mission.id} className="contract-card is-open is-radiant">
                      <p className="kicker">{done ? "Kept" : "Radiant"}</p>
                      <h3>{mission.name}</h3>
                      <p>{mission.brief}</p>
                      <p className="quiet">
                        {done ? `Hunt again for ${Math.ceil(mission.gold / 2)} coin.` : `${mission.gold} coin · ${mission.renown} renown`}
                      </p>
                      <div className="contract-acts">
                        <button type="button" className="btn btn-gold" onClick={() => dispatch({ type: "open-deploy", missionId: mission.id })}>
                          {done ? "Again" : "Take it"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {sheet === "camp" && (
        <div className="camp">
          <header className="deploy-bar">
            <div>
              <strong>Camp</strong>
              <span>
                {state.gold} coin on the table
                <span className="dot" />
                {state.renown} renown
              </span>
            </div>
            <div className="deploy-acts">
              <button type="button" className="btn btn-ghost" onClick={() => setSheet("hub")}>
                Back
              </button>
            </div>
          </header>
          <ul className="roster-mini field-roster">
            {living.map((merc) => {
              const frail = isFrail(merc.maxHp);
              const signedOn = MERC_DEFS.some((def) => def.id === merc.defId && def.cost);
              return (
                <li key={merc.id}>
                  <div className={`mini is-on ${woundClass(merc.scars, frail)}`} title={signedOn ? `${merc.name} signed on` : merc.name}>
                    <span className={`portrait ${woundClass(merc.scars, frail)}`}>
                      <img src={asset(`/art/${merc.art}.png`)} alt={merc.name} />
                      <ScarMarks scars={merc.scars} frail={frail} />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="camp-ground">
            <section className="camp-morning">
              <p className="kicker">The morning</p>
              <h2>{offer ? missionById(offer).name : "No road open"}</h2>
              <p>{offer ? missionById(offer).brief : "The table is clear. Nothing waits until you take a contract."}</p>
              {offer && state.bitter.includes(offer) && <p className="mark-line">This one is worse. You turned the last work down.</p>}
              <p className="quiet">
                Standing: {living.map((merc) => `${merc.name.split(" ")[0]} ${merc.hp}/${merc.maxHp}`).join(" · ") || "No one"}
              </p>
              <p className="quiet">
                Signed on:{" "}
                {living.filter((merc) => MERC_DEFS.some((def) => def.id === merc.defId && def.cost)).map((merc) => merc.name).join(", ") ||
                  "No one has taken the coin."}
              </p>
              <p className="quiet">
                Turned down: {state.refused.map((id) => missionById(id).name).join(", ") || "Nothing."}
              </p>
              {dead.length > 0 && <p className="quiet">In the ground: {dead.map((merc) => merc.name).join(", ")}</p>}
            </section>
            <section className="camp-night">
              <p className="kicker">The night</p>
              <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: "rest", kind: "cold" })}>
                <Moon />
                Cold camp
                <small>Free. Mend a portion.</small>
              </button>
              <button type="button" className="btn btn-ghost" disabled={state.gold < HOT_MEAL} onClick={() => dispatch({ type: "rest", kind: "hot" })}>
                <Tent />
                Hot meal
                <small>{HOT_MEAL} coin. Full mend.</small>
              </button>
              {hires[0] ? (
                <button
                  type="button"
                  className="btn btn-gold"
                  disabled={state.gold < (hires[0].cost ?? 0)}
                  onClick={() => dispatch({ type: "recruit", defId: hires[0].id })}
                >
                  Sign {hires[0].name}
                  <small>
                    {hires[0].role} · {hires[0].cost} coin. One offer.
                  </small>
                </button>
              ) : (
                <p className="quiet">No one is asking for coin tonight.</p>
              )}
              <button type="button" className="text-btn" onClick={() => setSure(!sure)}>
                {sure ? "Disband for certain?" : "Disband"}
              </button>
              {sure && (
                <button type="button" className="btn btn-blood" onClick={() => dispatch({ type: "disband" })}>
                  Burn the book
                </button>
              )}
            </section>
          </div>
        </div>
      )}

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
    <div className="tree tree-fit" aria-label={`${merc.name} skill tree`}>
      {shape.length === 0 && <p className="quiet">Coin bought the knife. There is no doctrine to walk.</p>}
      <div className="tree-board">
        {shape.map((item) => (
          <section key={item.branch} className={`tree-col ${item.branch === branch?.branch ? "is-on" : ""}`}>
            <button
              type="button"
              className="tree-col-name"
              aria-pressed={item.branch === branch?.branch}
              onClick={() => {
                setBranchName(item.branch);
                setFocusId(null);
              }}
            >
              {item.branch}
            </button>
            {item.subs.map((sub) => {
              const locked = item.subs.some((other) => other.sub !== sub.sub && other.nodes.some((node) => known.includes(node.id)));
              const Icon = MARK_ICON[sub.icon] ?? Swords;
              const next = nextOf(sub.nodes);
              return (
                <div key={sub.sub} className={`twig ${locked ? "is-locked" : ""}`}>
                  <span>{sub.sub}</span>
                  <div className="twig-nodes">
                    {sub.nodes.map((node) => {
                      const owned = known.includes(node.id);
                      const open = !locked && next?.id === node.id && canLearn && renown >= node.cost;
                      const state = owned ? "is-owned" : locked ? "is-locked" : open ? "is-open" : "is-short";
                      return (
                        <button
                          key={node.id}
                          type="button"
                          className={`seal-btn ${state} ${focus?.id === node.id ? "is-focus" : ""}`}
                          aria-pressed={focus?.id === node.id}
                          aria-label={`${item.branch}, ${sub.sub}, step ${node.tier}, ${node.name}`}
                          onClick={() => {
                            setBranchName(item.branch);
                            setFocusId(node.id);
                          }}
                        >
                          <Icon aria-hidden />
                          <small>{node.tier}</small>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </div>
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
                  ? "Another path"
                  : needsPrev
                    ? `Needs ${prevFocus?.name}`
                    : `Learn · ${focus.cost}`}
          </button>
        </div>
      )}
    </div>
  );
}

function Deploy({ state, dispatch, missionId }: { state: Campaign; dispatch: (a: Action) => void; missionId: string }) {
  const mission = missionById(missionId);
  const living = state.roster.filter((m) => m.alive && m.hp > 0);
  const walking = state.selectedDeploy
    .map((id) => living.find((m) => m.id === id))
    .filter((m): m is Merc => Boolean(m));
  const full = walking.length >= 4;
  const rows = mission.rows;
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const place = mission.ground ?? mission.id;
  useEffect(() => {
    void prepareTerrain(place);
  }, [place]);
  const placed = new Map<string, Merc>(walking.map((merc, index) => {
    const spawn = mission.playerSpawns[index] ?? mission.playerSpawns[0];
    return [`${spawn.x},${spawn.y}`, merc];
  }));
  return (
    <section className="deploy" data-place={place} style={{ ["--cols" as string]: String(width), ["--rows" as string]: String(height) }}>
      <header className="deploy-bar">
        <div>
          <strong>{mission.name}</strong>
          <span>
            {walking.length === 0
              ? "Choose who walks. Four at most."
              : full
                ? "Four are walking. The rest sit this fight and stay on the roll."
                : `${walking.length} of 4. Whoever sits out stays on the roll. The road can still scar them.`}
          </span>
        </div>
        <div className="deploy-acts">
          <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: "table" })}>
            Back
          </button>
          <button type="button" className="btn btn-gold" disabled={walking.length === 0} onClick={() => dispatch({ type: "start-battle" })}>
            Take the field
          </button>
        </div>
      </header>
      <ul className="roster-mini field-roster">
        {living.map((merc) => {
          const on = state.selectedDeploy.includes(merc.id);
          const frail = isFrail(merc.maxHp);
          return (
            <li key={merc.id}>
              <button
                type="button"
                className={`mini ${on ? "is-on" : "is-out"} ${woundClass(merc.scars, frail)}`}
                aria-pressed={on}
                title={on ? `${merc.name} walks` : `${merc.name} sits this fight out`}
                onClick={() => dispatch({ type: "toggle-deploy", id: merc.id })}
              >
                <span className={`portrait ${woundClass(merc.scars, frail)}`}>
                  <img src={asset(`/art/${merc.art}.png`)} alt={merc.name} />
                  <ScarMarks scars={merc.scars} frail={frail} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="board-wrap">
        <div className="board-frame">
          <div
            className="board is-ready"
            data-place={place}
            style={{
              gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
            }}
          >
            {rows.flatMap((row, y) =>
              row.split("").map((tile, x) => {
                const key = `${x},${y}`;
                const merc = placed.get(key);
                const spawnIndex = mission.playerSpawns.findIndex((spawn) => spawn.x === x && spawn.y === y);
                const openSpawn = spawnIndex >= 0 && spawnIndex < 4 && !merc;
                const cls = [
                  "cell",
                  tile === "#" ? "cell-wall" : "",
                  tile === "r" ? "cell-rubble" : "",
                  tile === "t" ? "cell-thicket" : "",
                  tile === "m" ? "cell-mire" : "",
                  tile === "." ? "cell-open" : "",
                  openSpawn ? "cell-spawn" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return <div key={key} className={cls} data-var={(x + y) % 2} style={{ gridColumn: x + 1, gridRow: y + 1 }} aria-hidden={tile === "#" ? true : undefined} />;
              }),
            )}
            {mission.enemies.map((enemy) => {
              const def = ENEMY_DEFS[enemy.defId];
              if (!def) return null;
              return (
                <div key={enemy.id} className="token token-enemy" style={{ gridColumn: enemy.x + 1, gridRow: enemy.y + 1 }}>
                  <img src={asset(`/art/${def.art}.png`)} alt={enemy.name} />
                </div>
              );
            })}
            {walking.map((merc, index) => {
              const spawn = mission.playerSpawns[index] ?? mission.playerSpawns[0];
              return (
                <div key={merc.id} className="token token-ally is-selected" style={{ gridColumn: spawn.x + 1, gridRow: spawn.y + 1 }}>
                  <img src={asset(`/art/${merc.art}.png`)} alt="" />
                  <em className="who">{merc.name.split(" ")[0]}</em>
                </div>
              );
            })}
          </div>
        </div>
      </div>
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
