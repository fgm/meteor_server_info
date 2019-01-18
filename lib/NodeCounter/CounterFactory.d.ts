import { CounterBase, LogFunction } from "./CounterBase";
declare type CounterType = "cheap" | "costly" | "nr";
declare class CounterFactory {
    static create(variant: CounterType, log?: LogFunction): CounterBase;
}
export { CounterFactory, CounterType, LogFunction, };
