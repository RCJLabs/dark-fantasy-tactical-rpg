using UnityEngine;

public class GameManager : MonoBehaviour
{
    public GridManager gridManager;
    public TurnManager turnManager;

    void Start()
    {
        if (gridManager == null) gridManager = FindObjectOfType<GridManager>();
        if (turnManager == null) turnManager = FindObjectOfType<TurnManager>();
    }

    // Call this from a UI button for now
    public void EndCurrentTurn()
    {
        turnManager.EndTurn();
    }
}
