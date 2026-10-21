public enum MarkKind
{
    None,
    Ashbrand,
    Hexrot,
    Blooddebt
}

public struct Mark
{
    public MarkKind kind;
    public int turns;
    public Unit source;

    public bool Active => kind != MarkKind.None && turns > 0;

    public static Mark Prime(MarkKind kind, Unit source)
    {
        return new Mark { kind = kind, turns = 2, source = source };
    }
}
