using UnityEngine;

public class Unit : MonoBehaviour
{
    public string unitName = "Unit";
    public int maxHP = 20;
    public int currentHP;
    public int moveRange = 3;
    public int attackRange = 1;
    public int power = 6;
    public int grit = 2;
    public int team = 0; // 0 = player, 1 = enemy
    public bool flying = false;
    public bool brandsOnStrike = false;
    public bool pinned = false;
    public bool hasMoved = false;

    public Mark mark;
    public Tile currentTile;
    private GridManager grid;

    void Start()
    {
        currentHP = maxHP;
        grid = FindObjectOfType<GridManager>();
    }

    public void MoveTo(Tile targetTile)
    {
        if (hasMoved || pinned || targetTile == null)
            return;

        if (currentTile != null)
            currentTile.SetOccupied(null);

        transform.position = targetTile.transform.position + Vector3.up * 0.5f;
        currentTile = targetTile;
        targetTile.SetOccupied(this);
        hasMoved = true;
    }

    public void TakeDamage(int amount)
    {
        currentHP -= amount;
        Debug.Log($"{unitName} took {amount} damage. HP: {currentHP}");
        if (currentHP <= 0)
            Die();
    }

    public void Heal(int amount)
    {
        if (currentHP <= 0)
            return;
        currentHP = Mathf.Min(maxHP, currentHP + amount);
    }

    /// <summary>Call at the start of this unit's turn. Hexrot bites, then the mark ages.</summary>
    public void BeginTurn()
    {
        hasMoved = false;
        if (mark.kind == MarkKind.Hexrot && mark.turns > 0)
            TakeDamage(2);
        if (currentHP <= 0)
            return;
        if (mark.Active)
        {
            mark.turns -= 1;
            if (mark.turns <= 0)
                mark = default;
        }
        if (pinned)
            pinned = false;
    }

    void Die()
    {
        if (currentTile != null)
            currentTile.SetOccupied(null);
        gameObject.SetActive(false);
    }
}
