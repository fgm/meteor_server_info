import { LogFunction } from "../types";
import { ICounter } from "./CounterBase";
declare type CounterType = "cheap" | "costly" | "nr";
declare class CounterFactory {
    static create(variant: CounterType, log?: LogFunction): ICounter;
}
export { CounterFactory, CounterType, };
