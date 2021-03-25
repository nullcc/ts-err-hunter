export function add(x: number, y: number): number {
  return x + y;
}

export function* idGenerator() {
  let id = 0;
  while (true) {
    yield id++;
  }
}