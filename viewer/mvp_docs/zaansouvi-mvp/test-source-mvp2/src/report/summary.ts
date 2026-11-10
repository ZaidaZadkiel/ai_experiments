// A summary of the scene app.ts builds.
import { build } from "../app";
import { Geometry } from "../shapes";
import { formatArea } from "./format";
import { percent } from "../util/numbers";

export async function summarize(): Promise<string> {
  const scene = build();
  const text = await scene.render();
  const far = Geometry.distance({ x: 6, y: 8 });
  return `${formatArea(far)} ${percent(1, 4)}%\n${text}`;
}
