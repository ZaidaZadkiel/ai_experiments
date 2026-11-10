// Classes and other complex TypeScript structures.
export interface Shape { area(): number; readonly name: string; }
export type Point = { x: number; y: number };
export enum Color { Red = "red", Green = "green" }
export const enum Flag { On = 1, Off = 0 }

export const UNIT = 1;
let created = 0;

function log(target: unknown, key: string): void { void target; void key; }

export abstract class Base implements Shape {
  static count = 0;
  protected readonly id: number;
  #tag = "base";
  abstract readonly name: string;
  constructor(public color: Color = Color.Red, private scale = UNIT) {
    this.id = ++Base.count;
    created++;
  }
  abstract area(): number;
  get label(): string { return `${this.name}#${this.id} ${this.#tag}`; }
  set label(value: string) { this.#tag = value; }
  @log describe(): string { return `${this.label}: ${this.area() * this.scale}`; }
}

export class Circle extends Base {
  readonly name = "circle";
  constructor(private radius: number, color?: Color) { super(color); }
  area(): number { return Math.PI * this.radius ** 2; }
  static unit(): Circle { return new Circle(UNIT); }
}

export class Rect<T extends Point = Point> extends Base {
  readonly name = "rect";
  constructor(public corner: T, private w: number, private h: number) { super(Color.Green); }
  area(): number { return this.w * this.h; }
  move(by: Partial<Point>): Rect<T> {
    const { x = 0, y = 0 } = by;
    return new Rect({ ...this.corner, x: this.corner.x + x, y: this.corner.y + y }, this.w, this.h);
  }
}

export function total(shapes: readonly Shape[]): number;
export function total(shapes: readonly Shape[], round: boolean): number;
export function total(shapes: readonly Shape[], round = false): number {
  const sum = shapes.reduce((acc, s) => acc + s.area(), 0);
  return round ? Math.round(sum) : sum;
}

export namespace Geometry {
  export const ORIGIN: Point = { x: 0, y: 0 };
  export function distance(a: Point, b: Point = ORIGIN): number { return Math.hypot(a.x - b.x, a.y - b.y); }
}

export const registry = new Map<string, () => Shape>([["unit", () => Circle.unit()]]);
export const Anonymous = class extends Base { readonly name = "anon"; area() { return 0; } };
export const config = { precision: 2, mode: "fast" } as const satisfies Record<string, unknown>;
export * from "./extra";
export { total as sumAreas };
export default Circle;
