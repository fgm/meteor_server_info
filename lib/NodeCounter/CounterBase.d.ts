/// <reference types="node" />
import Timeout = NodeJS.Timeout;
/**
 * The result of a watch() iteration: a previous/current pair of nanotimestamps.
 *
 * It can only represent positive durations.
 *
 * TODO Remove this workaround workaround after Node >= 10.7 with bigint.
 */
declare class NanoTs {
    protected seconds: number;
    protected nanosec: number;
    /**
     * Ensures normalize values: only positive integers, nanosec < 1E9.
     *
     * Converts extra nsec to extra seconds if needed.
     *
     * @param seconds
     * @param nanosec
     */
    constructor(seconds?: number, nanosec?: number);
    /**
     * Subtract a *smaller* NanoTs from a larger one.
     *
     * @param other
     *
     * @throws Error
     *   In case of data corruption, or if the other value is larger than the instance.
     */
    sub(other: NanoTs): NanoTs;
}
declare type WatchResult = [NanoTs, NanoTs];
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
    protected lastNSec: NanoTs;
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
