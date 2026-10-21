using UnityEngine;

public class Tile : MonoBehaviour
{
    public Vector2Int gridPosition;
    public bool isWalkable = true;
    public Unit occupiedBy;

    private Renderer rend;
    private Color originalColor;

    void Awake()
    {
        rend = GetComponent<Renderer>();
        if (rend != null)
            originalColor = rend.material.color;
    }

    public void Highlight(bool highlight)
    {
        if (rend == null) return;
        rend.material.color = highlight ? Color.cyan : originalColor;
    }

    public void SetOccupied(Unit unit)
    {
        occupiedBy = unit;
    }
}
