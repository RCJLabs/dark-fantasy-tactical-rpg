# Dark Fantasy Tactical RPG

A mercenary company with no name yet, taking contracts in the Pale Marches until the realm has to say what they are called.

Grid combat. One step, then a strike or a skill. The fight is the company, not the captain alone.

## The trick

- **Prime** lays a mark: Ashbrand, Hexrot, or Blooddebt.
- **Detonate** spends that mark for a harder hit.
- A mark spent by a different mercenary than the one who laid it cuts deeper.
- Hexrot gnaws over time and pins when spent. Blooddebt pays the spender back. Ashbrand is the brand you build a name on.

Sera's strikes lay Ashbrand. Marrow primes Hexrot. Isk spends whatever is on the target.

## Campaign shape

Five contracts, in order: the Toll Road, Ash Orchard, the Weeping Chapel, Iron Mile, and the Naming. Coin, renown, hires, and scars between fights. Downed sellswords come back scarred. Enough scars and the marches keep the body. The company ends when no one is left, or when the Naming forces the marches to speak the name you chose.

## Unity status

Starter systems, now with the next slice wired in code:

- Grid generation (`GridManager`)
- Reachable tiles by move budget (`Pathfinder`) — rubble, brush, and mire cost 2; walls block; you may pass allies but not stop on anyone
- Click a tile to select, click a highlighted tile to move (`TacticalInput`)
- Turn order (`TurnManager`)
- Prime / detonate marks (`Mark`, `MarkEffect`) on top of the skill assets

### Setup

1. Clone the repo
2. Open in Unity (2022.3+ recommended, URP)
3. Create a Tile prefab (Cube scaled to 1, 0.1, 1 with a `Tile` component and a collider)
4. Assign it to `GridManager`
5. Add `Unit`s, a `TurnManager`, a `GameManager`, and `TacticalInput` to the scene
6. Press Play. Click your unit, then a gold tile.

## Next

- Attack and skill targeting on the same click flow
- Enemy brain that steps, primes, and spends marks
- The five Pale Marches contracts as scenes
