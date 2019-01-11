/// <reference types="node" />
import Timeout = NodeJS.Timeout;
declare type WatchResult = [bigint, bigint];
declare type LogFunction = (format: string, ...args: any[]) => void;
/**
 * nullLogger is a silent logger usable by Counter classes.
 *
 * @param {string}_format
 * @param {any[]} _args
 */
declare const nullLogger: LogFunction;
declare class CounterBase {
    protected log: LogFunction;
    /**
     * The latest time measurement, in nanoseconds.
     */
    protected lastNSec: bigint;
    /**
     * @param log
     *   A "console.log(sprintf(" compatible function.
     */
    constructor(log?: LogFunction);
    static readonly LAP: number;
    start(): Timeout;
    watch(): WatchResult;
}
export { CounterBase, LogFunction, WatchResult, nullLogger, };
