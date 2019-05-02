import { LogFunction } from "../types";
import { CheapCounter } from "./CheapCounter";
import { CostlyCounter } from "./CostlyCounter";
import { ICounter} from "./CounterBase";
import { NrCounter } from "./NrCounter";
import { ElsCounter } from "./ElsCounter";

type CounterType = "cheap" | "costly" | "els" | "nr";

class CounterFactory {
  public static create(variant: CounterType, log?: LogFunction): ICounter {
    switch (variant) {
      case "cheap":
        return log ? new CheapCounter(false, log) : new CheapCounter(false);
      case "costly":
        return log ? new CostlyCounter(log) : new CostlyCounter();
      case "nr":
        return log ? new NrCounter(log) : new NrCounter();
      case "els":
        return log ? new ElsCounter(false, log) : new ElsCounter(false);
      default:
        throw new Error(`Invalid NodeJS counter type ${variant}.`);
    }
  }
}

export {
  CounterFactory,
  CounterType,
};
