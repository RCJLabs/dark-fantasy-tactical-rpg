using UnityEngine;

/// <summary>
/// Damage that primes or spends a mark.
/// A mark laid by someone else adds the company bonus.
/// </summary>
[CreateAssetMenu(fileName = "MarkEffect", menuName = "TacticalRPG/Effects/Mark")]
public class MarkEffect : SkillEffect
{
    public int power = 6;
    public MarkKind prime = MarkKind.None;
    public bool detonate = false;

    public override void Apply(Unit caster, Unit target, Skill skill)
    {
        if (caster == null || target == null)
            return;

        float mult = 1f;
        int flat = 0;
        Mark spent = default;

        if (detonate && target.mark.Active)
        {
            spent = target.mark;
            mult = 1.5f;
            if (spent.source != null && spent.source != caster)
                flat += 2;
            if (spent.kind == MarkKind.Ashbrand)
                flat += 2;
            target.mark = default;
        }

        int defense = target.grit / 2;
        int amount = Mathf.Max(1, Mathf.RoundToInt((power - defense) * mult) + flat);
        target.TakeDamage(amount);

        if (prime != MarkKind.None && target.currentHP > 0)
        {
            target.mark = Mark.Prime(prime, caster);
            Debug.Log($"{caster.unitName} lays {prime} on {target.unitName}.");
        }

        if (spent.kind == MarkKind.Hexrot && target.currentHP > 0)
        {
            target.pinned = true;
            Debug.Log($"{target.unitName} is pinned.");
        }

        if (spent.kind == MarkKind.Blooddebt)
            caster.Heal(5);
    }
}
