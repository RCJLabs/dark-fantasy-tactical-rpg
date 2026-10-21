# Roadmap

Ashmark. A mercenary company with no name, taking contracts in the Pale Marches until the realm has to say what they are called.

Locked: the next work is the browser campaign. Unity waits until that march feels finished. Between contracts the company can spend coin on a blade, or refuse the next contract.

The rules already play in the browser: five contracts, six blades, marks, scars, and the skill trees. This repository is the Unity product. It does not get new systems until the browser list below is done.

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
- The grid names who is acting. Ash, Hex, and Debt show the turns left. A pin shows. Gold stripes are the step that eats a Watch. A number on a foe is the strike, before you spend it.
- Scars show on the portrait. A cut for each fall. A blade on their last life is pale, with gold cuts. You can pick them out of the roster without reading the count.
- Coin, renown, a local save, and an ending when the company is gone or the Naming is spoken.
- Skill trees behind a button on the roster. Seventy-five steps a blade. A full march only buys about two finished paths. That is the point.

**This repo, parked**

- A grid, a pathfinder, and a click that moves a unit onto a gold tile.
- Turn order, and the three marks as code on top of the skill assets.
- No strike yet. No enemy brain. No contract scenes. No company between fights.
- Not the next task. See "After the browser march."

## Now

### 1. Read the fight

Done. On the grid, without the log: who is acting, the mark and the turns left, a pin, the squares where a foe would eat a Watch, and the strike numbers before you spend them.

### 2. Scars you can see

Done. The portrait carries the cuts, on the war table and on the token. Last blood looks different from a fresh blade, and different from a blade that has bled but can still get up.

### 3. Camp

Between contracts there is rest, a talent, and little else. Two choices, both real:

- Spend coin on a blade. A hired edge, not a loot ladder. The roster changes because you paid, not only because someone fell.
- Refuse the next contract. The one after is worse, and someone may not walk back.

Done when two companies can leave the Toll Road with different rosters, and one of them got there by turning work down.

### 4. The second march

The five contracts end, and the name is not the end of the company. A second table in the browser. Meaner foes who prime and spend the same three marks against you. Not a new ruleset. The old one, pointed the other way.

Done when a company that survived the Naming has somewhere to spend the renown it earned, and the march still feels like the same game.

## After the browser march

Only once 3 and 4 play. The readable fight and the visible scars already do.

### 5. Unity plays a strike

Bring the browser turn onto this repo's click flow.

- Click a foe in reach to strike. Click a skill, then a tile, to prime or spend.
- An enemy brain that steps, primes, and spends, using the same rules as the player.
- The Toll Road as one scene. The gold tile still means you can walk here.

Done when the Toll Road can be lost and won in Unity without falling back to the browser.

### 6. The five contracts, in Unity

Ash Orchard, the Weeping Chapel, Iron Mile, and the Naming, as scenes. Between them: coin, renown, hires, the camp choices, and scars. The Naming speaks the company name and ends the first march. No one left alive ends it sooner.

Done when a save can go from an unnamed company to the Naming, or to a grave, inside this project.

## Not this

- Multiplayer. The company is one player's.
- A third march, procedural contracts, or a loot ladder. Coin buys a blade, not a catalog.
- Rewriting the trees. The branches are exclusive on purpose. More nodes will not make a fight clearer.
- Unity work, a store page, or a full low-poly roster, before the second march plays in the browser.

## How to use this

Work the next open milestone in the browser. That is camp: buy a blade, or refuse the contract. Do not open Unity while 3 and 4 are still open.
