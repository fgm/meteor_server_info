import { CheapCounter } from "./CheapCounter";
import { CostlyCounter } from "./CostlyCounter";
import { CounterBase, LogFunction } from "./CounterBase";
import { NrCounter } from "./NrCounter";

type CounterType = "cheap" | "costly" | "nr";

class CounterFactory {
  public static create(variant: CounterType, log?: LogFunction): CounterBase {
    switch (variant) {
      case "cheap":
        return log ? new CheapCounter(false, log) : new CheapCounter(false);
      case "costly":
        return log ? new CostlyCounter(log) : new CostlyCounter();
      case "nr":
        return log ? new NrCounter(log) : new NrCounter();
      default:
        throw new Error(`Invalid NodeJS counter type ${variant}.`);
    }
  }
}

export {
  CounterFactory,
  CounterType,
  LogFunction,
};
