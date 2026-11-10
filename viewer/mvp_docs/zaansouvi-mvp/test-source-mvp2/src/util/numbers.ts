// Number helpers, used from the report folder.
import { total, type Shape } from "../shapes";

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : round2((part / whole) * 100);
}

export function share(shapes: readonly Shape[], one: Shape): number {
  return percent(one.area(), total(shapes));
}
