import { LogFunction } from "../types";
import { CounterBase } from "./CounterBase";
declare type CounterType = "cheap" | "costly" | "els" | "nr";
declare class CounterFactory {
    static create(variant: CounterType, log?: LogFunction): CounterBase;
}
export { CounterFactory, CounterType, };
