using System.Collections.Generic;
using UnityEngine;

public class TurnManager : MonoBehaviour
{
    public List<Unit> units = new List<Unit>();
    private int currentUnitIndex = 0;

    public Unit CurrentUnit => units.Count > 0 ? units[currentUnitIndex] : null;

    void Start()
    {
        units.AddRange(FindObjectsOfType<Unit>());
        StartTurn();
    }

    public void StartTurn()
    {
        if (CurrentUnit == null)
            return;
        CurrentUnit.BeginTurn();
        Debug.Log($"Turn started for {CurrentUnit.unitName}");
    }

    public void EndTurn()
    {
        if (units.Count == 0)
            return;
        currentUnitIndex = (currentUnitIndex + 1) % units.Count;
        StartTurn();
    }
}
