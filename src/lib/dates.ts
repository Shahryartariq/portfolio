const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2023-06" → "Jun 2023" */
export function month(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function span(start: string, end: string | null): string {
  return `${month(start)} to ${end ? month(end) : "now"}`;
}
