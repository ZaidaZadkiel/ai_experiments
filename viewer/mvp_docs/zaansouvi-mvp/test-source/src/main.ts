import { add } from "./counter";
import { PRECISION } from "./math";

function run(): void {
  const first = add(1.234);
  if (first > 0) {
    const label = "precision " + PRECISION;
    console.log(label, first);
  }
}

run();
