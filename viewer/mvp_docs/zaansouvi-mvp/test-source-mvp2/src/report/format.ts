// Formatting, used by the summary and the charts.
import { round2 } from "../util/numbers";

export function formatArea(area: number): string {
  return `${round2(area)} units`;
}
