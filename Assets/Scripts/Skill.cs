using UnityEngine;

[CreateAssetMenu(fileName = "NewSkill", menuName = "TacticalRPG/Skill")]
public class Skill : ScriptableObject
{
    public string skillName;
    public string description;
    public int range = 1;
    public bool isPrime = false;   // Applies a status
    public bool isDetonate = false; // Consumes a status

    public SkillEffect effect;

    public void Execute(Unit caster, Unit target)
    {
        if (effect != null)
            effect.Apply(caster, target, this);
        else
            Debug.Log($"{caster.unitName} used {skillName} on {target.unitName}");
    }
}
