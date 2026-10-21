using UnityEngine;

public class Unit : MonoBehaviour
{
    public string unitName = "Unit";
    public int maxHP = 20;
    public int currentHP;
    public int moveRange = 3;
    public int team = 0; // 0 = player, 1 = enemy

    public Tile currentTile;
    private GridManager grid;

    void Start()
    {
        currentHP = maxHP;
        grid = FindObjectOfType<GridManager>();
    }

    public void MoveTo(Tile targetTile)
    {
        if (currentTile != null)
            currentTile.SetOccupied(null);

        transform.position = targetTile.transform.position + Vector3.up * 0.5f;
        currentTile = targetTile;
        targetTile.SetOccupied(this);
    }

    public void TakeDamage(int amount)
    {
        currentHP -= amount;
        Debug.Log($"{unitName} took {amount} damage. HP: {currentHP}");
        if (currentHP <= 0)
            Die();
    }

    void Die()
    {
        if (currentTile != null)
            currentTile.SetOccupied(null);
        gameObject.SetActive(false);
    }
}
