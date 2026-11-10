// Bars of circle areas, two folders down.
import Circle, { total } from "../../shapes";
import { formatArea } from "../format";
import { summarize } from "../summary";
import { share } from "../../util/numbers";

export function bars(sizes: number[]): string[] {
  const circles = sizes.map((size) => new Circle(size));
  const whole = total(circles);
  return circles.map((circle) => `${formatArea(circle.area())} of ${formatArea(whole)}, ${share(circles, circle)}%`);
}

export async function report(): Promise<string> {
  return `${await summarize()}\n${bars([1, 2]).join("\n")}`;
}
