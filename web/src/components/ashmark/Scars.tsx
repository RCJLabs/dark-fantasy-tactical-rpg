export function woundClass(scars: number, frail: boolean): string {
  return [scars > 0 ? "is-scarred" : "", frail ? "is-frail" : ""].filter(Boolean).join(" ");
}

export function isFrail(maxHp: number): boolean {
  return maxHp < 12;
}

export function ScarMarks({ scars, frail = false }: { scars: number; frail?: boolean }) {
  const n = Math.min(4, Math.max(0, scars));
  if (!n) return null;
  return (
    <span className={`scar-marks${frail ? " is-frail" : ""}`} aria-hidden>
      {Array.from({ length: n }, (_, index) => (
        <i key={index} />
      ))}
    </span>
  );
}
