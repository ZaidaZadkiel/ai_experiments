import Circle, { Rect, total, Color, Geometry, UNIT, type Shape } from "./shapes";
import * as all from "./shapes";

class Scene {
  private items: Shape[] = [];
  add(shape: Shape): this { this.items.push(shape); return this; }
  async render(): Promise<string> {
    try {
      return this.items.map((s, i) => `${i}: ${s.area()}`).join("\n");
    } catch (err) {
      return String(err);
    } finally {
      void 0;
    }
  }
}

export function build(): Scene {
  const scene = new Scene();
  const c = new Circle(2, Color.Green);
  const r = new Rect({ x: 1, y: 2 }, 3, 4).move({ x: UNIT });
  scene.add(c).add(r).add(all.Circle.unit());
  const d = Geometry.distance({ x: 3, y: 4 });
  const sum = total([c, r], true);
  for (const [index, shape] of [c, r].entries()) { if (shape.area() > sum + d) console.log(index); }
  return scene;
}
