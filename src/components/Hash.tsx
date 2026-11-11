import { DIFFICULTY } from "@/lib/chain-core";

/** A hash with its proof-of-work zeros picked out. */
export function Hash({ value, head, tail }: { value: string; head?: number; tail?: number }) {
  const shown = head ? `${value.slice(0, head)}…${value.slice(-(tail ?? 6))}` : value;
  return (
    <span className="mono" title={value}>
      <span className="zeros">{shown.slice(0, DIFFICULTY)}</span>
      {shown.slice(DIFFICULTY)}
    </span>
  );
}
