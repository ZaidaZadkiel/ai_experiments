import { round } from "./math";

let total = 0;

export function add(amount: number): number {
  total = total + amount;
  return round(total);
}
