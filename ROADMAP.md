# Roadmap

Ashmark. A mercenary company with no name, taking contracts in the Pale Marches until the realm has to say what they are called.

The rules are already playable in the browser campaign: five contracts, six blades, marks, scars, and the skill trees. This repository is the Unity product (mobile, grid, low-poly). The roadmap is the order those two meet. Do not invent a third game in between.

## Laws

These stay. A feature that breaks one of them is the wrong feature.

- One step, then a strike or a skill. Watch is the choice to hold the strike.
- Prime lays a mark. Detonate spends it. A mark spent by a different blade than the one who laid it cuts deeper.
- Ashbrand is the name. Hexrot gnaws and pins. Blooddebt pays the spender back.
- The company is the character. A downed sellsword comes back scarred. Enough scars and the marches keep the body.
- Five branches, three forks, five steps. Each branch is its own trade. You walk only one fork of a branch.
- A fight should be readable on the grid. The log is a record, not the only way to know what happened.

## Where it stands

**Browser campaign, playable**

- Contracts, in order: the Toll Road, Ash Orchard, the Weeping Chapel, Iron Mile, the Naming.
- Roster of six: Sera Voss, Marrow, Isk, Sister Halden, Bran the Hound, Quill. Hire, deploy, rest.
- Prime and detonate. Enemy play. Watch, threat cells, strike motion, health on the token.
- Coin, renown, a local save, and an ending when the company is gone or the Naming is spoken.
- Skill trees behind a button on the roster. Seventy-five steps a blade. A full march only buys about two finished paths. That is the point.

**This repo**

- A grid, a pathfinder, and a click that moves a unit onto a gold tile.
- Turn order, and the three marks as code on top of the skill assets.
- No strike yet. No enemy brain. No contract scenes. No company between fights.

## The order

### 1. Read the fight

The trees are deep. A battle still hides which step is live. On the grid, without opening the log:

- Whose activation it is.
- The mark on a body, and how many turns it has left.
- A pin, and a Watch that will fire if someone steps into it.
- What a strike will do before you spend it.

Done when a new player can tell Ashbrand from Hexrot from a held Watch by looking at the tokens.

### 2. Scars you can see

A scar already cuts max health and can kill. It should show on the token and on the war table, not only as a number in a line of text. A blade on one life looks different from a blade that has not bled.

Done when you can pick the wounded out of the roster without reading the scar count.

### 3. Camp

Between contracts there is rest, a talent, and little else. Add one real choice:

- Spend coin on a blade (a hired edge, not a new system of loot), or
- Turn down the next contract, knowing the one after it will be worse and someone may not walk back.

Done when two companies can leave the Toll Road with different rosters for a reason other than who got dropped.

### 4. Unity plays a strike

Bring the browser turn onto this repo's click flow.

- Click a foe in reach to strike. Click a skill, then a tile, to prime or spend.
- An enemy brain that steps, primes, and spends, using the same rules as the player.
- The Toll Road as one scene: ditch, risen, and the gold tile still meaning "you can walk here."

Done when the Toll Road can be lost and won in Unity without falling back to the browser.

### 5. The five contracts, in Unity

Ash Orchard, the Weeping Chapel, Iron Mile, and the Naming, as scenes. Between them: coin, renown, hires, rest, and scars. The Naming speaks the company name and ends the march. No one left alive ends it sooner.

Done when a save can go from an unnamed company to the Naming, or to a grave, inside this project.

### 6. The second march

The five contracts end, and the name is not the end of the company. A second table. Meaner foes who prime and spend the same three marks against you. Not a new ruleset. The old one, pointed the other way.

Done when a company that survived the Naming has somewhere to spend the renown it earned.

## Not this

- Multiplayer. The company is one player's.
- A third march, procedural contracts, or a loot ladder.
- Rewriting the trees. The branches are exclusive on purpose. More nodes will not make a fight clearer.
- A store page, or a full low-poly roster, before the Toll Road runs in Unity.

## How to use this

Work the next open milestone. When it lands, mark it done in this file in the same commit. Do not start 6 while 4 is still a script with no scene.
