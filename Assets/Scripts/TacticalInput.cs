using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Click your unit, then a highlighted tile, to step.
/// Gold tiles are in budget. The click that moves also ends the move, not the turn:
/// call GameManager.EndCurrentTurn from UI when the action is done.
/// </summary>
public class TacticalInput : MonoBehaviour
{
    public GridManager grid;
    public TurnManager turns;
    public Camera cam;

    private Unit selected;
    private readonly List<Tile> highlighted = new List<Tile>();

    void Awake()
    {
        if (cam == null)
            cam = Camera.main;
    }

    void Update()
    {
        if (!Input.GetMouseButtonDown(0) || cam == null || grid == null)
            return;

        Ray ray = cam.ScreenPointToRay(Input.mousePosition);
        if (!Physics.Raycast(ray, out RaycastHit hit, 200f))
            return;

        Tile tile = hit.collider.GetComponent<Tile>();
        if (tile == null)
            tile = hit.collider.GetComponentInParent<Tile>();
        if (tile == null)
            return;

        if (tile.occupiedBy != null && tile.occupiedBy.team == 0 && tile.occupiedBy.currentHP > 0)
        {
            Select(tile.occupiedBy);
            return;
        }

        if (selected != null && highlighted.Contains(tile))
        {
            selected.MoveTo(tile);
            ClearHighlights();
        }
    }

    public void Select(Unit unit)
    {
        selected = unit;
        ClearHighlights();
        if (unit == null || grid == null || unit.hasMoved)
            return;

        foreach (Pathfinder.Step step in Pathfinder.Reachable(grid, unit))
        {
            step.tile.HighlightMove();
            highlighted.Add(step.tile);
        }
    }

    void ClearHighlights()
    {
        foreach (Tile tile in highlighted)
            tile.Highlight(false);
        highlighted.Clear();
    }
}
