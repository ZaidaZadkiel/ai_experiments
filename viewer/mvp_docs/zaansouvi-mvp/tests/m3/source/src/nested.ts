export function outer(a: number): number {
  function inner(b: number): number {
    return b * 2;
  }
  return inner(a);
}

export function second(): number {
  return outer(1);
}
