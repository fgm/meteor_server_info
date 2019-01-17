/// <reference types="node" />
import Timeout = NodeJS.Timeout;
/**
 * The result of a watch() iteration: a previous/current pair of nanotimestamps.
 */
declare type WatchResult = [bigint, bigint];
/**
 * The type for fonctions compatible with "console.log(sprintf("
 */
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
    protected timer?: Timeout;
    /**
     * @param log
     *   A "console.log(sprintf(" compatible function.
     */
    constructor(log?: LogFunction);
    static readonly LAP: number;
    /**
     * Start the metric collection.
     *
     * @return Timeout
     *   A timer instance usable with this.stop() to stop collection.
     */
    start(): Timeout;
    /**
     * Stop metrics collection. Idempotent, won't error.
     */
    stop(): void;
    /**
     * Observe the current metrics value and update last nanotimestamp.
     */
    watch(): WatchResult;
}
export { CounterBase, LogFunction, WatchResult, nullLogger, };
