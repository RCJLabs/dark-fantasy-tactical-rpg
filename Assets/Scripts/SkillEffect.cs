using UnityEngine;

public abstract class SkillEffect : ScriptableObject
{
    public abstract void Apply(Unit caster, Unit target, Skill skill);
}

// Example concrete effect
[CreateAssetMenu(fileName = "DamageEffect", menuName = "TacticalRPG/Effects/Damage")]
public class DamageEffect : SkillEffect
{
    public int damage = 5;

    public override void Apply(Unit caster, Unit target, Skill skill)
    {
        int finalDamage = damage;

        // Simple synergy hook example
        if (skill.isDetonate)
        {
            finalDamage = Mathf.RoundToInt(damage * 1.5f);
            Debug.Log("Detonate bonus applied!");
        }

        target.TakeDamage(finalDamage);
    }
}
