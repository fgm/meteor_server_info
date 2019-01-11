import { LogFunction } from "./NodeCounter/CounterBase";
/**
 * timingLog wraps a sprintf() call by prepending the time since command start.
 *
 * @param {string} format
 * @param {any[]} args
 */
declare const timingLog: LogFunction;
/**
 * Active sync wait.
 */
declare function milliwait(msec: number): void;
export { milliwait, timingLog, };
