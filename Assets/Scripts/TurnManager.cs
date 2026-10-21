using System.Collections.Generic;
using UnityEngine;

public class TurnManager : MonoBehaviour
{
    public List<Unit> units = new List<Unit>();
    private int currentUnitIndex = 0;

    public Unit CurrentUnit => units.Count > 0 ? units[currentUnitIndex] : null;

    void Start()
    {
        // Auto-find units in scene for prototype
        units.AddRange(FindObjectsOfType<Unit>());
        StartTurn();
    }

    public void StartTurn()
    {
        if (CurrentUnit == null) return;
        Debug.Log($"Turn started for {CurrentUnit.unitName}");
        // Highlight movement range later
    }

    public void EndTurn()
    {
        currentUnitIndex = (currentUnitIndex + 1) % units.Count;
        StartTurn();
    }
}
