using System.Collections.Generic;
using UnityEngine;

public static class Pathfinder
{
    public struct Step
    {
        public Tile tile;
        public int cost;
    }

    /// <summary>
    /// Tiles this unit can stop on. Allies can be walked through, never ended on.
    /// Rubble, thicket, and mire cost 2. Walls and enemies block.
    /// </summary>
    public static List<Step> Reachable(GridManager grid, Unit unit)
    {
        List<Step> result = new List<Step>();
        if (grid == null || unit == null || unit.currentTile == null || unit.pinned)
            return result;

        Dictionary<Vector2Int, int> best = new Dictionary<Vector2Int, int>();
        Queue<Vector2Int> open = new Queue<Vector2Int>();
        Vector2Int start = unit.currentTile.gridPosition;
        best[start] = 0;
        open.Enqueue(start);

        while (open.Count > 0)
        {
            Vector2Int cur = open.Dequeue();
            int curCost = best[cur];
            foreach (Tile neighbor in grid.GetNeighbors(cur))
            {
                if (neighbor.terrain == TerrainKind.Wall)
                    continue;

                Unit occ = neighbor.occupiedBy;
                if (occ != null && occ != unit && occ.team != unit.team && occ.currentHP > 0)
                    continue;

                int step = MoveCost(neighbor.terrain, unit.flying);
                int next = curCost + step;
                if (next > unit.moveRange)
                    continue;

                if (best.TryGetValue(neighbor.gridPosition, out int known) && known <= next)
                    continue;

                best[neighbor.gridPosition] = next;
                open.Enqueue(neighbor.gridPosition);
            }
        }

        foreach (var pair in best)
        {
            if (pair.Key == start)
                continue;
            Tile tile = grid.GetTile(pair.Key);
            if (tile == null)
                continue;
            if (tile.occupiedBy != null && tile.occupiedBy != unit && tile.occupiedBy.currentHP > 0)
                continue;
            result.Add(new Step { tile = tile, cost = pair.Value });
        }

        return result;
    }

    public static int MoveCost(TerrainKind terrain, bool flying)
    {
        if (terrain == TerrainKind.Wall)
            return 99;
        if (flying)
            return 1;
        if (terrain == TerrainKind.Rubble || terrain == TerrainKind.Thicket || terrain == TerrainKind.Mire)
            return 2;
        return 1;
    }
}
