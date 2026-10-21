using UnityEngine;

public class Tile : MonoBehaviour
{
    public Vector2Int gridPosition;
    public bool isWalkable = true;
    public TerrainKind terrain = TerrainKind.Open;
    public Unit occupiedBy;

    private Renderer rend;
    private Color originalColor;

    void Awake()
    {
        rend = GetComponent<Renderer>();
        if (rend != null)
            originalColor = rend.material.color;
        if (terrain == TerrainKind.Wall)
            isWalkable = false;
    }

    public void Highlight(bool highlight)
    {
        if (rend == null)
            return;
        rend.material.color = highlight ? new Color(0.78f, 0.63f, 0.36f) : originalColor;
    }

    public void HighlightMove()
    {
        Highlight(true);
    }

    public void SetOccupied(Unit unit)
    {
        occupiedBy = unit;
    }
}
