import { SKILLS } from "./data";
import type { SkillId } from "./types";

export type EffectKind =
  | "atk"
  | "def"
  | "mov"
  | "rng"
  | "maxHp"
  | "skillPower"
  | "skillRange"
  | "cooldown"
  | "markTurns"
  | "hexBite"
  | "pinTurns"
  | "spendFlat"
  | "laidFlat"
  | "laidMend"
  | "watchFlat"
  | "strikeFlat"
  | "healPower"
  | "choirReach"
  | "choirMend"
  | "bannerReach"
  | "inspiredFlat"
  | "bloodMend"
  | "pierce"
  | "guardAura"
  | "kinCut"
  | "watchGrit"
  | "watchReach"
  | "watchPin"
  | "execute"
  | "leech"
  | "thorns"
  | "pinHurt"
  | "markSpread"
  | "ignoreCover"
  | "markSight"
  | "longShot"
  | "clearPin"
  | "auraMend"
  | "roadMend"
  | "lastStand"
  | "bannerMend";

export type Talent = {
  id: string;
  merc: string;
  branch: string;
  sub: string;
  icon: string;
  tier: 1 | 2 | 3 | 4 | 5;
  name: string;
  cost: number;
  blurb: string;
  effect: { kind: EffectKind; amount: number };
};

type NodeSpec = [string, string, EffectKind, number];

const COSTS = [4, 6, 8, 10, 14];

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function path(merc: string, branch: string, sub: string, icon: string, nodes: NodeSpec[]): Talent[] {
  return nodes.map((node, index) => ({
    id: `${merc}-${slug(branch)}-${slug(sub)}-${index + 1}`,
    merc,
    branch,
    sub,
    icon,
    tier: (index + 1) as Talent["tier"],
    name: node[0],
    blurb: node[1],
    cost: COSTS[index] ?? 14,
    effect: { kind: node[2], amount: node[3] },
  }));
}

export const TALENTS: Talent[] = [
  ...path("sera", "Brand", "Ember", "flame", [
    ["Live coal", "Ashbrand she lays lasts one turn longer.", "markTurns", 1],
    ["It clings", "Ashbrand she lays lasts another turn.", "markTurns", 1],
    ["Named cut", "Spending her brand cuts for 2 more.", "laidFlat", 2],
    ["Still burning", "Ashbrand she lays lasts another turn.", "markTurns", 1],
    ["The name", "Spending her brand cuts for 2 more.", "laidFlat", 2],
  ]),
  ...path("sera", "Brand", "Cinder", "flame", [
    ["Jumping spark", "Her brand also catches one foe beside the target.", "markSpread", 1],
    ["Hot name", "Spending her brand cuts for 2 more.", "laidFlat", 2],
    ["Two sparks", "Her brand catches one more foe beside the target.", "markSpread", 1],
    ["Deeper name", "Spending her brand cuts for 2 more.", "laidFlat", 2],
    ["Wildfire", "Spending her brand cuts for 3 more.", "laidFlat", 3],
  ]),
  ...path("sera", "Brand", "Pyre", "flame", [
    ["Warmth", "When her brand is spent, she mends 2.", "laidMend", 2],
    ["Hearth", "When her brand is spent, she mends 2.", "laidMend", 2],
    ["Shared burn", "Spending her brand cuts for 1 more.", "laidFlat", 1],
    ["Company fire", "When her brand is spent, she mends 3.", "laidMend", 3],
    ["Long hearth", "Ashbrand she lays lasts one turn longer.", "markTurns", 1],
  ]),
  ...path("sera", "Due", "Arm", "swords", [
    ["Long arm", "Name's Due reaches one tile farther.", "skillRange", 1],
    ["Hard due", "Name's Due hits for 2 more.", "skillPower", 2],
    ["Harder due", "Name's Due hits for 2 more.", "skillPower", 2],
    ["Farther due", "Name's Due reaches one tile farther.", "skillRange", 1],
    ["Last due", "Name's Due hits for 3 more.", "skillPower", 3],
  ]),
  ...path("sera", "Due", "Tempo", "hourglass", [
    ["Quicker due", "Name's Due is ready a turn sooner.", "cooldown", 1],
    ["Short count", "Name's Due hits for 2 more.", "skillPower", 2],
    ["Pressed due", "Name's Due hits for 2 more.", "skillPower", 2],
    ["No waiting", "A mark she spends cuts for 2 more.", "spendFlat", 2],
    ["Settled", "A mark she spends cuts for 3 more.", "spendFlat", 3],
  ]),
  ...path("sera", "Due", "Sentence", "swords", [
    ["First sentence", "A mark she spends cuts for 2 more.", "spendFlat", 2],
    ["Said aloud", "Name's Due hits for 2 more.", "skillPower", 2],
    ["Second sentence", "A mark she spends cuts for 2 more.", "spendFlat", 2],
    ["No appeal", "A mark she spends cuts for 3 more.", "spendFlat", 3],
    ["Final sentence", "Name's Due hits for 2 more.", "skillPower", 2],
  ]),
  ...path("sera", "Watch", "Vigil", "eye", [
    ["First watch", "Her Watch cuts for 2 more.", "watchFlat", 2],
    ["Planted eye", "While she watches, her grit is 1 higher.", "watchGrit", 1],
    ["Second watch", "Her Watch cuts for 2 more.", "watchFlat", 2],
    ["Rooted", "While she watches, her grit is 2 higher.", "watchGrit", 2],
    ["Captain's eye", "Her Watch cuts for 3 more.", "watchFlat", 3],
  ]),
  ...path("sera", "Watch", "Gate", "shield", [
    ["Shut the gate", "While she watches, her grit is 2 higher.", "watchGrit", 2],
    ["Toll knife", "Her Watch cuts for 2 more.", "watchFlat", 2],
    ["Iron gate", "While she watches, her grit is 2 higher.", "watchGrit", 2],
    ["Don't pass", "Her Watch cuts for 3 more.", "watchFlat", 3],
    ["The lane is shut", "While she watches, her grit is 2 higher.", "watchGrit", 2],
  ]),
  ...path("sera", "Watch", "Hold", "eye", [
    ["Hold the lane", "While she watches, her grit is 2 higher.", "watchGrit", 2],
    ["Hold the knife", "While she watches, her grit is 1 higher.", "watchGrit", 1],
    ["Hold and cut", "Her Watch cuts for 2 more.", "watchFlat", 2],
    ["Hold the grit", "While she watches, her grit is 2 higher.", "watchGrit", 2],
    ["Nothing crosses", "Her Watch cuts for 2 more.", "watchFlat", 2],
  ]),
  ...path("sera", "Steel", "Edge", "swords", [
    ["Keener", "Strike +1.", "atk", 1],
    ["Through grit", "Her strikes ignore 2 grit.", "pierce", 2],
    ["Keener still", "Strike +1.", "atk", 1],
    ["Clean through", "Her strikes ignore 2 more grit.", "pierce", 2],
    ["Captain's edge", "Her strikes cut for 2 more.", "strikeFlat", 2],
  ]),
  ...path("sera", "Steel", "Point", "swords", [
    ["The point", "Her strikes cut for 2 more.", "strikeFlat", 2],
    ["Past the mail", "Her strikes ignore 2 grit.", "pierce", 2],
    ["Deeper point", "Her strikes cut for 2 more.", "strikeFlat", 2],
    ["Bare steel", "Strike +1.", "atk", 1],
    ["To the bone", "Her strikes cut for 3 more.", "strikeFlat", 3],
  ]),
  ...path("sera", "Steel", "Mail", "shield", [
    ["Her own arm", "Strike +1.", "atk", 1],
    ["A harder swing", "Her strikes cut for 2 more.", "strikeFlat", 2],
    ["Both hands", "Strike +1.", "atk", 1],
    ["Ignore the shield", "Her strikes ignore 2 grit.", "pierce", 2],
    ["Last steel", "Her strikes cut for 2 more.", "strikeFlat", 2],
  ]),
  ...path("sera", "Company", "Kin", "flag", [
    ["Stand by me", "Allies beside her have 1 more grit.", "guardAura", 1],
    ["Kin's cut", "Allies striking a foe within 2 of her cut for 2 more.", "kinCut", 2],
    ["Closer", "Allies beside her have 1 more grit.", "guardAura", 1],
    ["Our knives", "Allies striking a foe within 2 of her cut for 2 more.", "kinCut", 2],
    ["The company", "Allies beside her have 2 more grit.", "guardAura", 2],
  ]),
  ...path("sera", "Company", "Banner", "flag", [
    ["Under her shadow", "Allies striking a foe within 2 of her cut for 2 more.", "kinCut", 2],
    ["Her shadow holds", "Allies beside her have 1 more grit.", "guardAura", 1],
    ["Deeper shadow", "Allies striking a foe within 2 of her cut for 2 more.", "kinCut", 2],
    ["They are covered", "Allies beside her have 2 more grit.", "guardAura", 2],
    ["Strike as one", "Allies striking a foe within 2 of her cut for 3 more.", "kinCut", 3],
  ]),
  ...path("sera", "Company", "Wall", "shield", [
    ["The wall behind", "Allies beside her have 2 more grit.", "guardAura", 2],
    ["A second wall", "Allies beside her have 1 more grit.", "guardAura", 1],
    ["Wall and knife", "Allies striking a foe within 2 of her cut for 2 more.", "kinCut", 2],
    ["Higher wall", "Allies beside her have 2 more grit.", "guardAura", 2],
    ["Knives in the wall", "Allies striking a foe within 2 of her cut for 2 more.", "kinCut", 2],
  ]),

  ...path("marrow", "Rot", "Gnaw", "skull", [
    ["First gnaw", "Hexrot he lays bites for 1 more.", "hexBite", 1],
    ["Deeper gnaw", "Hexrot he lays bites for 1 more.", "hexBite", 1],
    ["It stays", "Hexrot he lays lasts one turn longer.", "markTurns", 1],
    ["To the bone", "Hexrot he lays bites for 2 more.", "hexBite", 2],
    ["Won't leave", "Hexrot he lays lasts another turn.", "markTurns", 1],
  ]),
  ...path("marrow", "Rot", "Linger", "hourglass", [
    ["Slow rot", "Hexrot he lays lasts one turn longer.", "markTurns", 1],
    ["Still gnaws", "Hexrot he lays bites for 1 more.", "hexBite", 1],
    ["Three nights", "Hexrot he lays lasts another turn.", "markTurns", 1],
    ["Quiet teeth", "Hexrot he lays bites for 1 more.", "hexBite", 1],
    ["It outlasts them", "Hexrot he lays lasts another turn.", "markTurns", 1],
  ]),
  ...path("marrow", "Rot", "Jaw", "skull", [
    ["Open jaw", "Hexrot he lays bites for 2 more.", "hexBite", 2],
    ["Jaw holds", "Hexrot he lays lasts one turn longer.", "markTurns", 1],
    ["Second bite", "Hexrot he lays bites for 1 more.", "hexBite", 1],
    ["It keeps chewing", "Hexrot he lays lasts one turn longer.", "markTurns", 1],
    ["Down to the marrow", "Hexrot he lays bites for 2 more.", "hexBite", 2],
  ]),
  ...path("marrow", "Hex", "Far", "crosshair", [
    ["Far hex", "Rot Hex reaches one tile farther.", "skillRange", 1],
    ["Long work", "Rot Hex hits for 2 more.", "skillPower", 2],
    ["Longer work", "Rot Hex hits for 2 more.", "skillPower", 2],
    ["Past the brush", "Rot Hex reaches one tile farther.", "skillRange", 1],
    ["At the back", "Rot Hex hits for 3 more.", "skillPower", 3],
  ]),
  ...path("marrow", "Hex", "Again", "hourglass", [
    ["Again", "Rot Hex is ready a turn sooner.", "cooldown", 1],
    ["Quick rot", "Rot Hex hits for 2 more.", "skillPower", 2],
    ["Quicker", "Rot Hex hits for 2 more.", "skillPower", 2],
    ["No rite wasted", "Rot Hex hits for 2 more.", "skillPower", 2],
    ["The hand is ready", "Rot Hex hits for 3 more.", "skillPower", 3],
  ]),
  ...path("marrow", "Hex", "Deep", "skull", [
    ["Deep hex", "Rot Hex hits for 2 more.", "skillPower", 2],
    ["Deeper hex", "Rot Hex hits for 2 more.", "skillPower", 2],
    ["A longer reach", "Rot Hex reaches one tile farther.", "skillRange", 1],
    ["Written hard", "Rot Hex hits for 3 more.", "skillPower", 3],
    ["Written twice", "Rot Hex is ready a turn sooner.", "cooldown", 1],
  ]),
  ...path("marrow", "Pin", "Feet", "shield", [
    ["The feet", "Spending his Hexrot pins one turn longer.", "pinTurns", 1],
    ["Nails bite", "A foe he pins takes 2 at the start of their turn.", "pinHurt", 2],
    ["Both feet", "Spending his Hexrot pins another turn longer.", "pinTurns", 1],
    ["Deeper nails", "A foe he pins takes 2 more at the start of their turn.", "pinHurt", 2],
    ["They do not walk", "Spending his Hexrot pins another turn longer.", "pinTurns", 1],
  ]),
  ...path("marrow", "Pin", "Thorn", "skull", [
    ["Pin thorn", "A foe he pins takes 2 at the start of their turn.", "pinHurt", 2],
    ["Thorn holds", "Spending his Hexrot pins one turn longer.", "pinTurns", 1],
    ["Blood thorn", "A foe he pins takes 2 more at the start of their turn.", "pinHurt", 2],
    ["Thorn stays", "Spending his Hexrot pins another turn longer.", "pinTurns", 1],
    ["The pin drinks", "A foe he pins takes 3 more at the start of their turn.", "pinHurt", 3],
  ]),
  ...path("marrow", "Pin", "Stake", "shield", [
    ["First stake", "Spending his Hexrot pins one turn longer.", "pinTurns", 1],
    ["Second stake", "Spending his Hexrot pins another turn longer.", "pinTurns", 1],
    ["Stake bites", "A foe he pins takes 2 at the start of their turn.", "pinHurt", 2],
    ["Third stake", "Spending his Hexrot pins another turn longer.", "pinTurns", 1],
    ["Staked down", "A foe he pins takes 2 more at the start of their turn.", "pinHurt", 2],
  ]),
  ...path("marrow", "Reach", "Arc", "crosshair", [
    ["Long arc", "Reach +1.", "rng", 1],
    ["Through rubble", "Rubble shelters a foe from him for 1 less grit.", "ignoreCover", 1],
    ["Longer arc", "Reach +1.", "rng", 1],
    ["No stone hides them", "Rubble shelters a foe from him for 1 less grit.", "ignoreCover", 1],
    ["The far arc", "Reach +1.", "rng", 1],
  ]),
  ...path("marrow", "Reach", "Eye", "eye", [
    ["Yellow eye", "Rubble shelters a foe from him for 1 less grit.", "ignoreCover", 1],
    ["Eye ignores stone", "Reach +1.", "rng", 1],
    ["Farther eye", "Rubble shelters a foe from him for 1 less grit.", "ignoreCover", 1],
    ["Stone is nothing", "Reach +1.", "rng", 1],
    ["He sees the back rank", "Reach +1.", "rng", 1],
  ]),
  ...path("marrow", "Reach", "Loom", "eye", [
    ["He looms", "Rubble shelters a foe from him for 1 less grit.", "ignoreCover", 1],
    ["Loom's sight", "Reach +1.", "rng", 1],
    ["Nothing between", "Rubble shelters a foe from him for 1 less grit.", "ignoreCover", 1],
    ["Over the wall", "Reach +1.", "rng", 1],
    ["No cover left", "Rubble shelters a foe from him for 1 less grit.", "ignoreCover", 1],
  ]),
  ...path("marrow", "Bone", "Rib", "skull", [
    ["Spare rib", "4 more health.", "maxHp", 4],
    ["Ribs bite", "A melee blow against him bites the attacker for 2.", "thorns", 2],
    ["More ribs", "4 more health.", "maxHp", 4],
    ["Sharper ribs", "A melee blow against him bites the attacker for 2 more.", "thorns", 2],
    ["A cage of bone", "6 more health.", "maxHp", 6],
  ]),
  ...path("marrow", "Bone", "Tooth", "skull", [
    ["Old tooth", "A melee blow against him bites the attacker for 2.", "thorns", 2],
    ["Tooth and flesh", "3 more health.", "maxHp", 3],
    ["Another tooth", "A melee blow against him bites the attacker for 2 more.", "thorns", 2],
    ["He can spare it", "4 more health.", "maxHp", 4],
    ["The jaw answers", "A melee blow against him bites the attacker for 3 more.", "thorns", 3],
  ]),
  ...path("marrow", "Bone", "Marrow", "skull", [
    ["Deep marrow", "4 more health.", "maxHp", 4],
    ["Marrow holds", "4 more health.", "maxHp", 4],
    ["Marrow bites", "A melee blow against him bites the attacker for 2.", "thorns", 2],
    ["Still more", "4 more health.", "maxHp", 4],
    ["They regret the touch", "A melee blow against him bites the attacker for 3 more.", "thorns", 3],
  ]),

  ...path("isk", "Shaft", "Keen", "crosshair", [
    ["Keen head", "Split Shaft hits for 2 more.", "skillPower", 2],
    ["Keener", "Split Shaft hits for 2 more.", "skillPower", 2],
    ["Full draw", "Split Shaft reaches one tile farther.", "skillRange", 1],
    ["Through the mark", "Split Shaft hits for 2 more.", "skillPower", 2],
    ["Past them", "Split Shaft reaches one tile farther.", "skillRange", 1],
  ]),
  ...path("isk", "Shaft", "Draw", "crosshair", [
    ["Heavy draw", "Split Shaft reaches one tile farther.", "skillRange", 1],
    ["Held draw", "Split Shaft hits for 2 more.", "skillPower", 2],
    ["Longer draw", "Split Shaft reaches one tile farther.", "skillRange", 1],
    ["The shaft lands", "Split Shaft hits for 3 more.", "skillPower", 3],
    ["No arc wasted", "Split Shaft hits for 2 more.", "skillPower", 2],
  ]),
  ...path("isk", "Shaft", "Tempo", "hourglass", [
    ["Nocked", "Split Shaft is ready a turn sooner.", "cooldown", 1],
    ["Second shaft", "Split Shaft hits for 2 more.", "skillPower", 2],
    ["Third shaft", "Split Shaft hits for 2 more.", "skillPower", 2],
    ["A longer nock", "Split Shaft reaches one tile farther.", "skillRange", 1],
    ["The string stays warm", "Split Shaft hits for 3 more.", "skillPower", 3],
  ]),
  ...path("isk", "Sentence", "Deep", "swords", [
    ["Deep sentence", "A mark he spends cuts for 2 more.", "spendFlat", 2],
    ["On the wounded", "His strikes and Split Shaft cut a wounded foe for 2 more.", "execute", 2],
    ["Deeper sentence", "A mark he spends cuts for 2 more.", "spendFlat", 2],
    ["Finish them", "His strikes and Split Shaft cut a wounded foe for 2 more.", "execute", 2],
    ["No mercy in it", "A mark he spends cuts for 3 more.", "spendFlat", 3],
  ]),
  ...path("isk", "Sentence", "Mercy", "swords", [
    ["No mercy", "His strikes and Split Shaft cut a wounded foe for 3 more.", "execute", 3],
    ["Then the mark", "A mark he spends cuts for 2 more.", "spendFlat", 2],
    ["Less mercy", "His strikes and Split Shaft cut a wounded foe for 2 more.", "execute", 2],
    ["Spend the rest", "A mark he spends cuts for 3 more.", "spendFlat", 3],
    ["The wounded fall", "His strikes and Split Shaft cut a wounded foe for 3 more.", "execute", 3],
  ]),
  ...path("isk", "Sentence", "Word", "eye", [
    ["The word", "A mark he spends cuts for 3 more.", "spendFlat", 3],
    ["Word on the weak", "His strikes and Split Shaft cut a wounded foe for 2 more.", "execute", 2],
    ["Said again", "A mark he spends cuts for 2 more.", "spendFlat", 2],
    ["Last word", "A mark he spends cuts for 3 more.", "spendFlat", 3],
    ["The word ends them", "His strikes and Split Shaft cut a wounded foe for 2 more.", "execute", 2],
  ]),
  ...path("isk", "Vigil", "Watch", "eye", [
    ["On watch", "His Watch cuts for 2 more.", "watchFlat", 2],
    ["Longer watch", "While he watches, his reach is 1 farther.", "watchReach", 1],
    ["Still on it", "His Watch cuts for 2 more.", "watchFlat", 2],
    ["The far lane", "While he watches, his reach is 1 farther.", "watchReach", 1],
    ["Don't cross", "His Watch cuts for 3 more.", "watchFlat", 3],
  ]),
  ...path("isk", "Vigil", "Range", "crosshair", [
    ["Watch the far", "While he watches, his reach is 1 farther.", "watchReach", 1],
    ["Far cut", "His Watch cuts for 2 more.", "watchFlat", 2],
    ["Farther watch", "While he watches, his reach is 1 farther.", "watchReach", 1],
    ["The cut carries", "His Watch cuts for 3 more.", "watchFlat", 3],
    ["Nothing is out of the lane", "While he watches, his reach is 1 farther.", "watchReach", 1],
  ]),
  ...path("isk", "Vigil", "Cut", "swords", [
    ["Cut the step", "His Watch cuts for 3 more.", "watchFlat", 3],
    ["Cut from far", "While he watches, his reach is 1 farther.", "watchReach", 1],
    ["Cut again", "His Watch cuts for 2 more.", "watchFlat", 2],
    ["Cut the lane", "His Watch cuts for 3 more.", "watchFlat", 3],
    ["The lane is his", "While he watches, his reach is 1 farther.", "watchReach", 1],
  ]),
  ...path("isk", "Eye", "Far", "eye", [
    ["Far eye", "Reach +1.", "rng", 1],
    ["He sees the brand", "His strikes cut a marked foe for 2 more.", "markSight", 2],
    ["Farther eye", "Reach +1.", "rng", 1],
    ["The brand is bright", "His strikes cut a marked foe for 2 more.", "markSight", 2],
    ["Nothing marked is safe", "His strikes cut a marked foe for 3 more.", "markSight", 3],
  ]),
  ...path("isk", "Eye", "Hawk", "eye", [
    ["Hawk", "His strikes cut a marked foe for 2 more.", "markSight", 2],
    ["Hawk's height", "Reach +1.", "rng", 1],
    ["Hawk on the brand", "His strikes cut a marked foe for 3 more.", "markSight", 3],
    ["Higher hawk", "Reach +1.", "rng", 1],
    ["He does not miss a mark", "His strikes cut a marked foe for 2 more.", "markSight", 2],
  ]),
  ...path("isk", "Eye", "Brand", "flame", [
    ["Read the brand", "His strikes cut a marked foe for 2 more.", "markSight", 2],
    ["Read it twice", "His strikes cut a marked foe for 2 more.", "markSight", 2],
    ["Read it farther", "Reach +1.", "rng", 1],
    ["The brand is loud", "His strikes cut a marked foe for 3 more.", "markSight", 3],
    ["A longer read", "Reach +1.", "rng", 1],
  ]),
  ...path("isk", "Wind", "Step", "footprints", [
    ["With the wind", "Move +1.", "mov", 1],
    ["The long loose", "A shot at his farthest reach cuts for 2 more.", "longShot", 2],
    ["Long stride", "Move +1.", "mov", 1],
    ["Wind in the shaft", "A shot at his farthest reach cuts for 2 more.", "longShot", 2],
    ["He is never close", "A shot at his farthest reach cuts for 3 more.", "longShot", 3],
  ]),
  ...path("isk", "Wind", "Loose", "crosshair", [
    ["Loose far", "A shot at his farthest reach cuts for 2 more.", "longShot", 2],
    ["Loose and move", "Move +1.", "mov", 1],
    ["Looser", "A shot at his farthest reach cuts for 2 more.", "longShot", 2],
    ["Still moving", "Move +1.", "mov", 1],
    ["The far shot is the point", "A shot at his farthest reach cuts for 3 more.", "longShot", 3],
  ]),
  ...path("isk", "Wind", "Gale", "footprints", [
    ["Gale step", "Move +1.", "mov", 1],
    ["Gale again", "Move +1.", "mov", 1],
    ["Gale shot", "A shot at his farthest reach cuts for 2 more.", "longShot", 2],
    ["Harder gale", "A shot at his farthest reach cuts for 2 more.", "longShot", 2],
    ["They never close", "A shot at his farthest reach cuts for 2 more.", "longShot", 2],
  ]),

  ...path("halden", "Hymn", "Fuller", "music", [
    ["Fuller hymn", "Pyre Hymn mends 2 more.", "healPower", 2],
    ["Fuller still", "Pyre Hymn mends 2 more.", "healPower", 2],
    ["A real hymn", "Pyre Hymn mends 3 more.", "healPower", 3],
    ["She can sing it again", "Pyre Hymn is ready a turn sooner.", "cooldown", 1],
    ["Last verse", "Pyre Hymn mends 2 more.", "healPower", 2],
  ]),
  ...path("halden", "Hymn", "Tempo", "hourglass", [
    ["Again the hymn", "Pyre Hymn is ready a turn sooner.", "cooldown", 1],
    ["Between verses", "Pyre Hymn mends 2 more.", "healPower", 2],
    ["No breath wasted", "Pyre Hymn mends 2 more.", "healPower", 2],
    ["The verse holds", "Pyre Hymn mends 3 more.", "healPower", 3],
    ["Unending", "Pyre Hymn mends 2 more.", "healPower", 2],
  ]),
  ...path("halden", "Hymn", "Mercy", "music", [
    ["Mercy", "Pyre Hymn mends 3 more.", "healPower", 3],
    ["More mercy", "Pyre Hymn mends 2 more.", "healPower", 2],
    ["Mercy returns", "Pyre Hymn is ready a turn sooner.", "cooldown", 1],
    ["Deep mercy", "Pyre Hymn mends 3 more.", "healPower", 3],
    ["She does not stop", "Pyre Hymn mends 2 more.", "healPower", 2],
  ]),
  ...path("halden", "Choir", "Wide", "music", [
    ["Wide choir", "A spent mark mends allies one tile farther.", "choirReach", 1],
    ["Louder mend", "That choir mends 2 more.", "choirMend", 2],
    ["Wider choir", "A spent mark mends allies one tile farther.", "choirReach", 1],
    ["The whole lane", "That choir mends 2 more.", "choirMend", 2],
    ["Everyone hears", "A spent mark mends allies one tile farther.", "choirReach", 1],
  ]),
  ...path("halden", "Choir", "Loud", "music", [
    ["Loud", "That choir mends 2 more.", "choirMend", 2],
    ["Louder", "That choir mends 2 more.", "choirMend", 2],
    ["The lane joins", "A spent mark mends allies one tile farther.", "choirReach", 1],
    ["A full throat", "That choir mends 3 more.", "choirMend", 3],
    ["They all rise", "That choir mends 2 more.", "choirMend", 2],
  ]),
  ...path("halden", "Choir", "Circle", "music", [
    ["The circle", "That choir mends 2 more.", "choirMend", 2],
    ["Circle's reach", "A spent mark mends allies one tile farther.", "choirReach", 1],
    ["Circle's gift", "That choir mends 3 more.", "choirMend", 3],
    ["Wider circle", "A spent mark mends allies one tile farther.", "choirReach", 1],
    ["The circle holds", "That choir mends 2 more.", "choirMend", 2],
  ]),
  ...path("halden", "Cloth", "Hearth", "flame", [
    ["Road hearth", "At the start of their turn, allies beside her mend 2.", "auraMend", 2],
    ["She lasts", "3 more health.", "maxHp", 3],
    ["Warmer hearth", "At the start of their turn, allies beside her mend 2.", "auraMend", 2],
    ["More of her", "4 more health.", "maxHp", 4],
    ["The hearth does not go out", "At the start of their turn, allies beside her mend 2.", "auraMend", 2],
  ]),
  ...path("halden", "Cloth", "Veil", "shield", [
    ["Veil of breath", "4 more health.", "maxHp", 4],
    ["The veil mends", "At the start of their turn, allies beside her mend 2.", "auraMend", 2],
    ["Thicker veil", "4 more health.", "maxHp", 4],
    ["Veil on the company", "At the start of their turn, allies beside her mend 2.", "auraMend", 2],
    ["She is hard to spend", "4 more health.", "maxHp", 4],
  ]),
  ...path("halden", "Cloth", "Lamp", "flame", [
    ["Lamp oil", "3 more health.", "maxHp", 3],
    ["The lamp", "At the start of their turn, allies beside her mend 2.", "auraMend", 2],
    ["More oil", "4 more health.", "maxHp", 4],
    ["Brighter lamp", "At the start of their turn, allies beside her mend 2.", "auraMend", 2],
    ["She carries more", "3 more health.", "maxHp", 3],
  ]),
  ...path("halden", "Road", "Step", "footprints", [
    ["Long step", "Move +1.", "mov", 1],
    ["Step and ease", "When she mends, she clears one turn of a pin.", "clearPin", 1],
    ["Longer step", "Move +1.", "mov", 1],
    ["Beside them", "When she steps beside an ally, she mends them 2.", "roadMend", 2],
    ["The road mends", "When she steps beside an ally, she mends them 2.", "roadMend", 2],
  ]),
  ...path("halden", "Road", "Pace", "footprints", [
    ["Pilgrim pace", "When she steps beside an ally, she mends them 2.", "roadMend", 2],
    ["Pace frees", "When she mends, she clears one turn of a pin.", "clearPin", 1],
    ["A longer pace", "Move +1.", "mov", 1],
    ["Pace beside them", "When she steps beside an ally, she mends them 2.", "roadMend", 2],
    ["No one stays nailed", "When she mends, she clears one more turn of a pin.", "clearPin", 1],
  ]),
  ...path("halden", "Road", "Unbind", "shield", [
    ["Unbind", "When she mends, she clears one turn of a pin.", "clearPin", 1],
    ["Unbind again", "When she mends, she clears one more turn of a pin.", "clearPin", 1],
    ["She crosses to them", "Move +1.", "mov", 1],
    ["A touch on the way", "When she steps beside an ally, she mends them 2.", "roadMend", 2],
    ["The nails come out", "When she mends, she clears one more turn of a pin.", "clearPin", 1],
  ]),
  ...path("halden", "Ash", "Spend", "flame", [
    ["Spend it", "Spending a mark hits for 2 more.", "skillPower", 2],
    ["Their brand", "A mark she spends cuts for 2 more.", "spendFlat", 2],
    ["Spend harder", "Spending a mark hits for 2 more.", "skillPower", 2],
    ["From farther", "Pyre Hymn reaches one tile farther.", "skillRange", 1],
    ["Spent clean", "A mark she spends cuts for 3 more.", "spendFlat", 3],
  ]),
  ...path("halden", "Ash", "Reach", "flame", [
    ["Ash reaches", "Pyre Hymn reaches one tile farther.", "skillRange", 1],
    ["Ash hits", "Spending a mark hits for 2 more.", "skillPower", 2],
    ["Farther ash", "Pyre Hymn reaches one tile farther.", "skillRange", 1],
    ["The brand answers", "A mark she spends cuts for 2 more.", "spendFlat", 2],
    ["Ash at the back", "Spending a mark hits for 3 more.", "skillPower", 3],
  ]),
  ...path("halden", "Ash", "Verse", "music", [
    ["Verse of ash", "A mark she spends cuts for 2 more.", "spendFlat", 2],
    ["The verse burns", "Spending a mark hits for 2 more.", "skillPower", 2],
    ["Spent verse", "A mark she spends cuts for 2 more.", "spendFlat", 2],
    ["Verse from afar", "Pyre Hymn reaches one tile farther.", "skillRange", 1],
    ["Closing verse", "Spending a mark hits for 2 more.", "skillPower", 2],
  ]),

  ...path("bran", "Debt", "Owe", "swords", [
    ["Heavy owe", "Spending his Blooddebt cuts for 2 more.", "laidFlat", 2],
    ["The debt stays", "Blooddebt he lays lasts one turn longer.", "markTurns", 1],
    ["Owe them more", "Spending his Blooddebt cuts for 2 more.", "laidFlat", 2],
    ["Paid in flesh", "Blooddebt he lays mends the spender for 3 more.", "bloodMend", 3],
    ["Still owed", "Blooddebt he lays lasts another turn.", "markTurns", 1],
  ]),
  ...path("bran", "Debt", "Paid", "flame", [
    ["Paid", "Blooddebt he lays mends the spender for 3 more.", "bloodMend", 3],
    ["Paid in cuts", "Spending his Blooddebt cuts for 2 more.", "laidFlat", 2],
    ["Paid fuller", "Blooddebt he lays mends the spender for 2 more.", "bloodMend", 2],
    ["The debt lingers", "Blooddebt he lays lasts one turn longer.", "markTurns", 1],
    ["Paid in full", "Blooddebt he lays mends the spender for 3 more.", "bloodMend", 3],
  ]),
  ...path("bran", "Debt", "Long", "hourglass", [
    ["Long debt", "Blooddebt he lays lasts one turn longer.", "markTurns", 1],
    ["Collected late", "Blooddebt he lays mends the spender for 2 more.", "bloodMend", 2],
    ["Longer debt", "Blooddebt he lays lasts another turn.", "markTurns", 1],
    ["It is still owed", "Spending his Blooddebt cuts for 2 more.", "laidFlat", 2],
    ["A debt that waits", "Blooddebt he lays lasts another turn.", "markTurns", 1],
  ]),
  ...path("bran", "Cleaver", "Heavy", "swords", [
    ["Heavy cleaver", "Strike +1.", "atk", 1],
    ["The cut feeds", "His strikes mend him 2.", "leech", 2],
    ["Heavier cleaver", "Strike +1.", "atk", 1],
    ["Through bone", "His strikes cut for 2 more.", "strikeFlat", 2],
    ["He drinks the swing", "His strikes mend him 2.", "leech", 2],
  ]),
  ...path("bran", "Cleaver", "Edge", "swords", [
    ["A mean edge", "His strikes cut for 2 more.", "strikeFlat", 2],
    ["Edge drinks", "His strikes mend him 2.", "leech", 2],
    ["Meaner edge", "His strikes cut for 2 more.", "strikeFlat", 2],
    ["The arm", "Strike +1.", "atk", 1],
    ["Last edge", "His strikes cut for 3 more.", "strikeFlat", 3],
  ]),
  ...path("bran", "Cleaver", "Drink", "flame", [
    ["First drink", "His strikes mend him 2.", "leech", 2],
    ["A heavier drink", "His strikes mend him 2.", "leech", 2],
    ["Drink and cut", "His strikes cut for 2 more.", "strikeFlat", 2],
    ["The shoulder", "Strike +1.", "atk", 1],
    ["He is fed", "His strikes mend him 3.", "leech", 3],
  ]),
  ...path("bran", "Hide", "Thick", "shield", [
    ["Thick hide", "4 more health.", "maxHp", 4],
    ["Thick grit", "Grit +1.", "def", 1],
    ["Thicker", "4 more health.", "maxHp", 4],
    ["Scar thick", "Grit +1.", "def", 1],
    ["Hound's hide", "6 more health.", "maxHp", 6],
  ]),
  ...path("bran", "Hide", "Scar", "shield", [
    ["Old scar", "Grit +1.", "def", 1],
    ["Scar tissue", "4 more health.", "maxHp", 4],
    ["New scar", "Grit +1.", "def", 1],
    ["Under the scar", "4 more health.", "maxHp", 4],
    ["Scar over scar", "Grit +2.", "def", 2],
  ]),
  ...path("bran", "Hide", "Wall", "shield", [
    ["The wall", "4 more health.", "maxHp", 4],
    ["Wall's weight", "4 more health.", "maxHp", 4],
    ["Higher wall", "Grit +1.", "def", 1],
    ["The wall stays", "6 more health.", "maxHp", 6],
    ["Doesn't fall", "Grit +1.", "def", 1],
  ]),
  ...path("bran", "Rush", "Hound", "footprints", [
    ["The hound", "Move +1.", "mov", 1],
    ["Hound's owe", "Owe Me hits for 2 more.", "skillPower", 2],
    ["Off the leash", "Move +1.", "mov", 1],
    ["Long cleaver", "Owe Me reaches one tile farther.", "skillRange", 1],
    ["On them", "Owe Me hits for 2 more.", "skillPower", 2],
  ]),
  ...path("bran", "Rush", "Reach", "swords", [
    ["Long owe", "Owe Me reaches one tile farther.", "skillRange", 1],
    ["The owe lands", "Owe Me hits for 2 more.", "skillPower", 2],
    ["Rush in", "Move +1.", "mov", 1],
    ["Longer owe", "Owe Me hits for 3 more.", "skillPower", 3],
    ["From farther", "Owe Me reaches one tile farther.", "skillRange", 1],
  ]),
  ...path("bran", "Rush", "Tempo", "hourglass", [
    ["Again", "Owe Me is ready a turn sooner.", "cooldown", 1],
    ["Fast owe", "Owe Me hits for 2 more.", "skillPower", 2],
    ["Fast feet", "Move +1.", "mov", 1],
    ["Fast debt", "Owe Me hits for 2 more.", "skillPower", 2],
    ["No pause in him", "Owe Me hits for 3 more.", "skillPower", 3],
  ]),
  ...path("bran", "Watch", "Lane", "eye", [
    ["His lane", "His Watch cuts for 3 more.", "watchFlat", 3],
    ["Lane nails", "His Watch pins for one turn.", "watchPin", 1],
    ["Still his", "His Watch cuts for 2 more.", "watchFlat", 2],
    ["Nailed in the lane", "His Watch pins for one more turn.", "watchPin", 1],
    ["No one passes", "His Watch cuts for 3 more.", "watchFlat", 3],
  ]),
  ...path("bran", "Watch", "Bite", "swords", [
    ["Watch bite", "His Watch pins for one turn.", "watchPin", 1],
    ["Then the cut", "His Watch cuts for 2 more.", "watchFlat", 2],
    ["The bite pins", "His Watch pins for one more turn.", "watchPin", 1],
    ["Harder bite", "His Watch cuts for 3 more.", "watchFlat", 3],
    ["They stay bit", "His Watch pins for one more turn.", "watchPin", 1],
  ]),
  ...path("bran", "Watch", "Hold", "shield", [
    ["Hold them", "His Watch pins for one turn.", "watchPin", 1],
    ["Hold and cut", "His Watch cuts for 2 more.", "watchFlat", 2],
    ["Hold longer", "His Watch pins for one more turn.", "watchPin", 1],
    ["Hold the lane", "His Watch cuts for 3 more.", "watchFlat", 3],
    ["They do not leave", "His Watch pins for one more turn.", "watchPin", 1],
  ]),

  ...path("quill", "Standard", "Wide", "flag", [
    ["Wider standard", "The banner reaches one tile farther.", "bannerReach", 1],
    ["Raise it sooner", "Raise Standard is ready a turn sooner.", "cooldown", 1],
    ["Wider still", "The banner reaches one tile farther.", "bannerReach", 1],
    ["The cloth is ready", "Raise Standard is ready a turn sooner.", "cooldown", 1],
    ["Everyone under it", "The banner reaches one tile farther.", "bannerReach", 1],
  ]),
  ...path("quill", "Standard", "Cry", "flag", [
    ["The cry", "Raise Standard is ready a turn sooner.", "cooldown", 1],
    ["Cry carries", "The banner reaches one tile farther.", "bannerReach", 1],
    ["Cry farther", "The banner reaches one tile farther.", "bannerReach", 1],
    ["Again the cry", "The banner reaches one tile farther.", "bannerReach", 1],
    ["They hear it at the back", "The banner reaches one tile farther.", "bannerReach", 1],
  ]),
  ...path("quill", "Standard", "Hold", "flag", [
    ["Hold it out", "The banner reaches one tile farther.", "bannerReach", 1],
    ["Hold it high", "The banner reaches one tile farther.", "bannerReach", 1],
    ["Sooner cloth", "Raise Standard is ready a turn sooner.", "cooldown", 1],
    ["Farther cloth", "The banner reaches one tile farther.", "bannerReach", 1],
    ["The standard stays up", "The banner reaches one tile farther.", "bannerReach", 1],
  ]),
  ...path("quill", "Sharp", "Edge", "swords", [
    ["Sharp cloth", "A banner-branded strike hits for 2 more.", "inspiredFlat", 2],
    ["Sharper cloth", "A banner-branded strike hits for 2 more.", "inspiredFlat", 2],
    ["Razor standard", "A banner-branded strike hits for 2 more.", "inspiredFlat", 2],
    ["The edge on the cloth", "A banner-branded strike hits for 3 more.", "inspiredFlat", 3],
    ["They cut as he means", "A banner-branded strike hits for 2 more.", "inspiredFlat", 2],
  ]),
  ...path("quill", "Sharp", "Point", "swords", [
    ["The point", "A banner-branded strike hits for 3 more.", "inspiredFlat", 3],
    ["All points", "A banner-branded strike hits for 2 more.", "inspiredFlat", 2],
    ["A finer point", "A banner-branded strike hits for 2 more.", "inspiredFlat", 2],
    ["Pointed cloth", "A banner-branded strike hits for 2 more.", "inspiredFlat", 2],
    ["One more point", "A banner-branded strike hits for 2 more.", "inspiredFlat", 2],
  ]),
  ...path("quill", "Sharp", "Brand", "flame", [
    ["Cloth brand", "A banner-branded strike hits for 2 more.", "inspiredFlat", 2],
    ["Hot cloth", "A banner-branded strike hits for 3 more.", "inspiredFlat", 3],
    ["Named cloth", "A banner-branded strike hits for 2 more.", "inspiredFlat", 2],
    ["The brand bites", "A banner-branded strike hits for 2 more.", "inspiredFlat", 2],
    ["Ash on the standard", "A banner-branded strike hits for 3 more.", "inspiredFlat", 3],
  ]),
  ...path("quill", "Oath", "Grit", "shield", [
    ["The oath", "Grit +1.", "def", 1],
    ["Oath's body", "4 more health.", "maxHp", 4],
    ["Sworn grit", "Grit +1.", "def", 1],
    ["He will not die yet", "Once a battle, a killing blow leaves him at 1.", "lastStand", 1],
    ["Last oath", "Grit +1.", "def", 1],
  ]),
  ...path("quill", "Oath", "Vow", "shield", [
    ["The vow", "Once a battle, a killing blow leaves him at 1.", "lastStand", 1],
    ["Vow's body", "4 more health.", "maxHp", 4],
    ["Harder vow", "Grit +2.", "def", 2],
    ["A second vow", "Once more a battle, a killing blow leaves him at 1.", "lastStand", 1],
    ["He keeps standing", "Grit +1.", "def", 1],
  ]),
  ...path("quill", "Oath", "Flesh", "shield", [
    ["Oath flesh", "4 more health.", "maxHp", 4],
    ["More flesh", "4 more health.", "maxHp", 4],
    ["Flesh holds", "Grit +1.", "def", 1],
    ["Not today", "Once a battle, a killing blow leaves him at 1.", "lastStand", 1],
    ["Still here", "4 more health.", "maxHp", 4],
  ]),
  ...path("quill", "Voice", "Mend", "music", [
    ["The voice mends", "Raising the standard mends allies under it for 2.", "bannerMend", 2],
    ["Louder mend", "Raising the standard mends allies under it for 2 more.", "bannerMend", 2],
    ["The march breathes", "Raising the standard mends allies under it for 2 more.", "bannerMend", 2],
    ["A kinder cry", "Raising the standard mends allies under it for 3 more.", "bannerMend", 3],
    ["They rise with the cloth", "Raising the standard mends allies under it for 2 more.", "bannerMend", 2],
  ]),
  ...path("quill", "Voice", "Hymn", "music", [
    ["Flag hymn", "Raising the standard mends allies under it for 3.", "bannerMend", 3],
    ["Second hymn", "Raising the standard mends allies under it for 2 more.", "bannerMend", 2],
    ["The hymn holds", "Raising the standard mends allies under it for 2 more.", "bannerMend", 2],
    ["Sung with the cloth", "Raising the standard mends allies under it for 2 more.", "bannerMend", 2],
    ["One more verse", "Raising the standard mends allies under it for 2 more.", "bannerMend", 2],
  ]),
  ...path("quill", "Voice", "Breath", "flag", [
    ["First breath", "Raising the standard mends allies under it for 2.", "bannerMend", 2],
    ["Shared breath", "Raising the standard mends allies under it for 2 more.", "bannerMend", 2],
    ["Deeper breath", "Raising the standard mends allies under it for 3 more.", "bannerMend", 3],
    ["The company breathes", "Raising the standard mends allies under it for 2 more.", "bannerMend", 2],
    ["Breath under the flag", "Raising the standard mends allies under it for 2 more.", "bannerMend", 2],
  ]),
  ...path("quill", "Guard", "Watch", "eye", [
    ["Guard watch", "Quill's Watch cuts for 2 more.", "watchFlat", 2],
    ["Step with the flag", "Move +1.", "mov", 1],
    ["Still guarding", "Quill's Watch cuts for 2 more.", "watchFlat", 2],
    ["Longer with the cloth", "Move +1.", "mov", 1],
    ["No one past the flag", "Quill's Watch cuts for 3 more.", "watchFlat", 3],
  ]),
  ...path("quill", "Guard", "Step", "footprints", [
    ["Flag step", "Move +1.", "mov", 1],
    ["Step and watch", "Quill's Watch cuts for 2 more.", "watchFlat", 2],
    ["Another step", "Move +1.", "mov", 1],
    ["The watch follows", "Quill's Watch cuts for 3 more.", "watchFlat", 3],
    ["He arrives in the lane", "Move +1.", "mov", 1],
  ]),
  ...path("quill", "Guard", "Lane", "eye", [
    ["His lane", "Quill's Watch cuts for 2 more.", "watchFlat", 2],
    ["The lane cuts deeper", "Quill's Watch cuts for 2 more.", "watchFlat", 2],
    ["Lane step", "Move +1.", "mov", 1],
    ["He gets there", "Quill's Watch cuts for 3 more.", "watchFlat", 3],
    ["The flag holds the lane", "Move +1.", "mov", 1],
  ]),
];

const BY_ID = new Map(TALENTS.map((talent) => [talent.id, talent]));

export function talentById(id: string): Talent | undefined {
  return BY_ID.get(id);
}

export function talentsFor(defId: string): Talent[] {
  return TALENTS.filter((talent) => talent.merc === defId);
}

export type BranchShape = {
  branch: string;
  subs: { sub: string; icon: string; nodes: Talent[] }[];
};

export function branchesOf(defId: string): BranchShape[] {
  const talents = talentsFor(defId);
  const branchNames = [...new Set(talents.map((talent) => talent.branch))];
  return branchNames.map((branch) => {
    const subNames = [...new Set(talents.filter((talent) => talent.branch === branch).map((talent) => talent.sub))];
    return {
      branch,
      subs: subNames.map((sub) => ({
        sub,
        icon: talents.find((talent) => talent.branch === branch && talent.sub === sub)?.icon ?? "swords",
        nodes: talents.filter((talent) => talent.branch === branch && talent.sub === sub).sort((a, b) => a.tier - b.tier),
      })),
    };
  });
}

export type Mods = Record<EffectKind, number>;

export function mods(known: string[] | undefined): Mods {
  const totals = {
    atk: 0,
    def: 0,
    mov: 0,
    rng: 0,
    maxHp: 0,
    skillPower: 0,
    skillRange: 0,
    cooldown: 0,
    markTurns: 0,
    hexBite: 0,
    pinTurns: 0,
    spendFlat: 0,
    laidFlat: 0,
    laidMend: 0,
    watchFlat: 0,
    strikeFlat: 0,
    healPower: 0,
    choirReach: 0,
    choirMend: 0,
    bannerReach: 0,
    inspiredFlat: 0,
    bloodMend: 0,
    pierce: 0,
    guardAura: 0,
    kinCut: 0,
    watchGrit: 0,
    watchReach: 0,
    watchPin: 0,
    execute: 0,
    leech: 0,
    thorns: 0,
    pinHurt: 0,
    markSpread: 0,
    ignoreCover: 0,
    markSight: 0,
    longShot: 0,
    clearPin: 0,
    auraMend: 0,
    roadMend: 0,
    lastStand: 0,
    bannerMend: 0,
  };
  for (const id of known ?? []) {
    const effect = talentById(id)?.effect;
    if (!effect) continue;
    totals[effect.kind] += effect.amount;
  }
  return totals;
}

export function talentNames(known: string[] | undefined): string[] {
  return (known ?? []).flatMap((id) => {
    const talent = talentById(id);
    return talent ? [talent.name] : [];
  });
}

export function appliedStats(merc: {
  atk: number;
  def: number;
  mov: number;
  rng: number;
  maxHp: number;
  known?: string[];
}): { atk: number; def: number; mov: number; rng: number; maxHp: number } {
  const bonus = mods(merc.known);
  return {
    atk: merc.atk + bonus.atk,
    def: merc.def + bonus.def,
    mov: merc.mov + bonus.mov,
    rng: merc.rng + bonus.rng,
    maxHp: merc.maxHp + bonus.maxHp,
  };
}

export function skillRange(unit: { skill: SkillId; known?: string[] }): number {
  return SKILLS[unit.skill].range + mods(unit.known).skillRange;
}

export function skillPower(unit: { skill: SkillId; known?: string[] }): number {
  return SKILLS[unit.skill].power + mods(unit.known).skillPower;
}

export function healAmount(unit: { skill: SkillId; known?: string[] }): number {
  return SKILLS[unit.skill].power + mods(unit.known).healPower;
}

export function cooldownOf(unit: { known?: string[] }, base: number): number {
  return Math.max(0, base - mods(unit.known).cooldown);
}

export function bannerReach(unit: { known?: string[] }): number {
  return 2 + mods(unit.known).bannerReach;
}
