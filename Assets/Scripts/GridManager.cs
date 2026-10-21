using System.Collections.Generic;
using UnityEngine;

public class GridManager : MonoBehaviour
{
    public int width = 8;
    public int height = 8;
    public float tileSize = 1f;
    public GameObject tilePrefab;

    private Dictionary<Vector2Int, Tile> tiles = new Dictionary<Vector2Int, Tile>();

    void Start()
    {
        GenerateGrid();
    }

    void GenerateGrid()
    {
        for (int x = 0; x < width; x++)
        {
            for (int y = 0; y < height; y++)
            {
                Vector3 worldPos = new Vector3(x * tileSize, 0, y * tileSize);
                GameObject tileObj = Instantiate(tilePrefab, worldPos, Quaternion.identity, transform);
                tileObj.name = $"Tile_{x}_{y}";

                Tile tile = tileObj.GetComponent<Tile>();
                if (tile == null)
                    tile = tileObj.AddComponent<Tile>();

                tile.gridPosition = new Vector2Int(x, y);
                tiles[tile.gridPosition] = tile;
            }
        }
    }

    public Tile GetTile(Vector2Int pos)
    {
        tiles.TryGetValue(pos, out Tile tile);
        return tile;
    }

    public List<Tile> GetNeighbors(Vector2Int pos)
    {
        List<Tile> neighbors = new List<Tile>();
        Vector2Int[] directions =
        {
            new Vector2Int(1, 0), new Vector2Int(-1, 0),
            new Vector2Int(0, 1), new Vector2Int(0, -1)
        };

        foreach (var dir in directions)
        {
            Tile neighbor = GetTile(pos + dir);
            if (neighbor != null && neighbor.isWalkable)
                neighbors.Add(neighbor);
        }
        return neighbors;
    }

    public void ClearHighlights()
    {
        foreach (var tile in tiles.Values)
            tile.Highlight(false);
    }
}
