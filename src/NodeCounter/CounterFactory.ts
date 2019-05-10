import { LogFunction } from "../types";
import { CounterBase } from "./CounterBase";
import { ElsCounter } from "./ElsCounter";
import { NrCounter } from "./NrCounter";

type CounterType = "cheap" | "costly" | "els" | "nr";

class CounterFactory {
  public static create(variant: CounterType, log?: LogFunction): CounterBase {
    switch (variant) {
      case "cheap":
        throw new Meteor.Error("CheapCounter has been removed in release 1.2.6");
      case "costly":
        throw new Meteor.Error("CostlyCounter has been removed in release 1.2.6");
      case "nr":
        if (log != null) {
          log("The NrCounter collector is deprecated");
        }
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
