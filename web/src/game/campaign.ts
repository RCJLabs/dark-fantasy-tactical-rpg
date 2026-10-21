import { HOT_MEAL, MERC_DEFS, MISSIONS, MISSION_ORDER, makeMerc, missionById, rankFor } from "./data";
import { bootBattle, applyBattle } from "./sim";
import { talentById, talentsFor } from "./talents";
import type { Aftermath, BattleAction, BattleState, Campaign, Merc } from "./types";

export const SAVE_KEY = "ashmark-save-v1";

export const initialCampaign = (): Campaign => ({
  version: 1,
  companyName: "",
  gold: 0,
  renown: 0,
  muted: false,
  roster: [],
  cleared: [],
  refused: [],
  bitter: [],
  chronicle: [],
  screen: "title",
  battle: null,
  deployId: null,
  selectedDeploy: [],
  aftermath: null,
  ending: null,
});

function scar(merc: Merc): string {
  const next = merc.maxHp - 4;
  merc.scars += 1;
  if (next < 8) {
    merc.alive = false;
    merc.hp = 0;
    return `${merc.name} does not get up. The marches keep the body.`;
  }
  merc.maxHp = next;
  merc.hp = 1;
  return `${merc.name} is dragged clear, scarred. ${merc.maxHp} left in them.`;
}

export function visibleMissions(state: Campaign) {
  const second = state.cleared.includes("naming");
  return MISSIONS.filter((mission) => !mission.radiant && (mission.march === 2) === second);
}

export function radiantOffers(state: Campaign) {
  return MISSIONS.filter((mission) => mission.radiant && mission.after && state.cleared.includes(mission.after));
}

export function nextOffer(state: Campaign): string | null {
  const list = visibleMissions(state);
  for (let index = 0; index < list.length; index += 1) {
    const id = list[index].id;
    if (state.cleared.includes(id)) continue;
    const prev = index === 0 ? null : list[index - 1].id;
    if (!prev || state.cleared.includes(prev)) return id;
    return null;
  }
  return null;
}

function normalize(save: Campaign): Campaign {
  return {
    ...initialCampaign(),
    ...save,
    version: 1,
    roster: (save.roster ?? []).map((m) => ({ ...m, known: m.known ?? [] })),
    cleared: save.cleared ?? [],
    refused: save.refused ?? [],
    bitter: save.bitter ?? [],
  };
}

function settle(state: Campaign): Campaign {
  const battle = state.battle;
  if (!battle?.outcome) return state;
  const mission = missionById(battle.missionId);
  const victory = battle.outcome === "victory";
  const first = !state.cleared.includes(mission.id);
  const roster = state.roster.map((m) => ({ ...m }));
  const lines: string[] = [];
  const buried: string[] = [];
  let gold = state.gold;
  let renown = state.renown;
  if (victory) {
    const pay = first ? mission.gold : Math.ceil(mission.gold / 2);
    const fame = first ? mission.renown : 0;
    gold += pay;
    renown += fame;
    lines.push(mission.win);
    lines.push(first ? `+${pay} coin. +${fame} renown.` : `Old work. +${pay} coin.`);
  } else {
    renown = Math.max(0, renown - 6);
    lines.push(mission.loss);
    lines.push("No coin. Renown frays.");
  }
  for (const u of battle.units) {
    if (u.team !== "player") continue;
    const merc = roster.find((m) => m.id === u.id);
    if (!merc?.alive) continue;
    if (u.downed) {
      const line = scar(merc);
      lines.push(line);
      if (!merc.alive) buried.push(merc.name);
    } else {
      merc.hp = Math.max(1, Math.min(merc.maxHp, u.hp));
    }
  }
  const cleared = victory && first ? [...state.cleared, mission.id] : state.cleared;
  const aftermath: Aftermath = { missionId: mission.id, victory, lines, buried };
  const chronicle = [
    ...state.chronicle,
    { id: `${mission.id}-${state.chronicle.length}`, title: mission.name, body: lines.join(" ") },
  ];
  return { ...state, gold, renown, roster, cleared, aftermath, chronicle, screen: "aftermath" };
}

export type Action =
  | { type: "hydrate"; save: Campaign }
  | { type: "new-game"; name: string }
  | { type: "disband" }
  | { type: "open-deploy"; missionId: string }
  | { type: "toggle-deploy"; id: string }
  | { type: "start-battle" }
  | { type: "battle"; action: BattleAction }
  | { type: "replace-battle"; battle: BattleState }
  | { type: "to-aftermath" }
  | { type: "close-aftermath" }
  | { type: "rest"; kind: "cold" | "hot" }
  | { type: "recruit"; defId: string }
  | { type: "refuse"; missionId: string }
  | { type: "learn"; mercId: string; talentId: string }
  | { type: "mute"; muted?: boolean }
  | { type: "table" };

export function reducer(state: Campaign, action: Action): Campaign {
  switch (action.type) {
    case "hydrate":
      return normalize(action.save);
    case "disband":
      return { ...initialCampaign(), muted: state.muted };
    case "mute":
      return { ...state, muted: action.muted ?? !state.muted };
    case "table":
      return { ...state, screen: "table", deployId: null };
    case "new-game": {
      const name = action.name.replace(/\s+/g, " ").trim().slice(0, 28) || "The Nameless";
      const roster = MERC_DEFS.filter((d) => !d.cost).map(makeMerc);
      return {
        ...initialCampaign(),
        muted: state.muted,
        companyName: name,
        gold: 28,
        roster,
        screen: "table",
        chronicle: [
          {
            id: "founding",
            title: "The founding",
            body: `${name} is not a name yet. It is three sellswords and a debt, standing in the Pale Marches of Veyr.`,
          },
        ],
      };
    }
    case "open-deploy": {
      return { ...state, screen: "deploy", deployId: action.missionId, selectedDeploy: [], battle: null, aftermath: null };
    }
    case "toggle-deploy": {
      const has = state.selectedDeploy.includes(action.id);
      if (has) return { ...state, selectedDeploy: state.selectedDeploy.filter((id) => id !== action.id) };
      if (state.selectedDeploy.length >= 4) return state;
      return { ...state, selectedDeploy: [...state.selectedDeploy, action.id] };
    }
    case "start-battle": {
      if (!state.deployId) return state;
      const mercs = state.selectedDeploy
        .map((id) => state.roster.find((m) => m.id === id))
        .filter((m): m is Merc => Boolean(m && m.alive && m.hp > 0));
      if (mercs.length === 0) return state;
      const battle = bootBattle(state.deployId, mercs, (Date.now() >>> 0) || 1, state.bitter.includes(state.deployId));
      return { ...state, screen: "battle", battle, aftermath: null };
    }
    case "battle": {
      if (!state.battle) return state;
      return { ...state, battle: applyBattle(state.battle, action.action) };
    }
    case "replace-battle":
      return { ...state, battle: action.battle };
    case "to-aftermath":
      return settle(state);
    case "close-aftermath": {
      const living = state.roster.filter((m) => m.alive);
      if (living.length === 0) {
        return { ...state, screen: "ending", ending: "ruin", battle: null, aftermath: null, deployId: null };
      }
      if (state.cleared.includes("echo")) {
        return { ...state, screen: "ending", ending: "kept", battle: null, aftermath: null, deployId: null };
      }
      return { ...state, screen: "table", battle: null, aftermath: null, deployId: null, ending: null };
    }
    case "rest": {
      if (state.screen !== "table") return state;
      const roster = state.roster.map((m) => ({ ...m }));
      if (action.kind === "hot") {
        if (state.gold < HOT_MEAL) return state;
        for (const m of roster) if (m.alive) m.hp = m.maxHp;
        return { ...state, gold: state.gold - HOT_MEAL, roster };
      }
      for (const m of roster) {
        if (!m.alive) continue;
        const gain = Math.max(3, Math.floor(m.maxHp * 0.4));
        m.hp = Math.min(m.maxHp, m.hp + gain);
      }
      return { ...state, roster };
    }
    case "recruit": {
      if (state.roster.some((m) => m.defId === action.defId)) return state;
      const def = MERC_DEFS.find((d) => d.id === action.defId);
      if (!def?.cost || state.gold < def.cost) return state;
      const merc = makeMerc(def);
      return {
        ...state,
        gold: state.gold - def.cost,
        roster: [...state.roster, merc],
        chronicle: [
          ...state.chronicle,
          {
            id: `hire-${def.id}`,
            title: `${def.name} signs`,
            body: `${def.name} takes the coin and the company's not-yet-name. ${def.blurb}`,
          },
        ],
      };
    }
    case "refuse": {
      if (state.screen !== "table") return state;
      if (nextOffer(state) !== action.missionId) return state;
      if (state.refused.includes(action.missionId) || state.cleared.includes(action.missionId)) return state;
      const index = MISSION_ORDER.indexOf(action.missionId);
      const afterId = MISSION_ORDER[index + 1] ?? action.missionId;
      const roster = state.roster.map((m) => ({ ...m }));
      const living = roster.filter((m) => m.alive && m.hp > 0).sort((a, b) => a.hp - b.hp || a.maxHp - b.maxHp);
      const victim = living[0];
      const wound = victim ? scar(victim) : "No one was left for the road to take.";
      const after = missionById(afterId);
      const worse =
        afterId === action.missionId
          ? `${after.name} will be worse if you go back to it.`
          : `${after.name} hears that you flinched. It will be worse.`;
      const turned = missionById(action.missionId);
      return {
        ...state,
        roster,
        refused: [...state.refused, action.missionId],
        bitter: state.bitter.includes(afterId) ? state.bitter : [...state.bitter, afterId],
        chronicle: [
          ...state.chronicle,
          {
            id: `refuse-${action.missionId}`,
            title: `${turned.name} refused`,
            body: `${state.companyName} turns the work down. ${wound} ${worse}`,
          },
        ],
      };
    }
    case "learn": {
      if (state.screen !== "table") return state;
      const talent = talentById(action.talentId);
      const merc = state.roster.find((m) => m.id === action.mercId);
      if (!talent || !merc?.alive || merc.defId !== talent.merc) return state;
      const known = merc.known ?? [];
      if (known.includes(talent.id) || state.renown < talent.cost) return state;
      if (talent.tier > 1) {
        const prev = talentsFor(talent.merc).find(
          (t) => t.branch === talent.branch && t.sub === talent.sub && t.tier === talent.tier - 1,
        );
        if (!prev || !known.includes(prev.id)) return state;
      }
      const otherPath = talentsFor(talent.merc).some(
        (t) => t.branch === talent.branch && t.sub !== talent.sub && known.includes(t.id),
      );
      if (otherPath) return state;
      return {
        ...state,
        renown: state.renown - talent.cost,
        roster: state.roster.map((m) => (m.id === merc.id ? { ...m, known: [...known, talent.id] } : m)),
        chronicle: [
          ...state.chronicle,
          {
            id: `learn-${talent.id}-${state.chronicle.length}`,
            title: talent.name,
            body: `${merc.name} learns ${talent.name}. ${talent.blurb}`,
          },
        ],
      };
    }
    default:
      return state;
  }
}

export function loadCampaign(): Campaign | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Campaign;
    if (!parsed || parsed.version !== 1 || !parsed.companyName || !Array.isArray(parsed.roster)) return null;
    return normalize(parsed);
  } catch {
    return null;
  }
}

export function saveCampaign(state: Campaign) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    /* private mode or quota — keep playing in memory */
  }
}

export function renownTitle(state: Campaign): string {
  const spent = state.roster.reduce(
    (sum, merc) => sum + (merc.known ?? []).reduce((inner, id) => inner + (talentById(id)?.cost ?? 0), 0),
    0,
  );
  return rankFor(state.renown + spent, state.cleared.includes("naming"));
}

/** Battle actions stay pure so enemy playback can step a local copy. */
export function withBattle(state: Campaign, battle: BattleState): Campaign {
  return { ...state, battle };
}
