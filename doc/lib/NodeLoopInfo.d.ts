/// <reference types="node" />
import CpuUsage = NodeJS.CpuUsage;
import Timeout = NodeJS.Timeout;
import Immediate = NodeJS.Immediate;
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
/**
 * This counter actually counts ticks by jumping to and fro the loop phases.
 *
 * It is expensive because:
 *
 * - it prevents the CPU optimization in the poll phase from running because it
 *   sees the "immediate" job queues and does not linger in the poll phase.
 * - its code is cheap but runs on each tick.
 *
 * On an "Intel(R) Core(TM) i7-3770 CPU @ 3.40GHz", it causes about 5% CPU load.
 *
 */
declare class CostlyCounter extends CounterBase {
    protected log: LogFunction;
    /**
     * The current setImmediate() result.
     */
    protected immediateTimer?: Immediate;
    /**
     * The latest tick count.
     */
    protected tickCount: number;
    /**
     * @param log
     *   A "console.log(sprintf(" compatible function.
     */
    constructor(log?: LogFunction);
    start(): NodeJS.Timeout;
    stop(): void;
    watch(): WatchResult;
    /**
     * Notice: setTimeout(cb, 0) actually means setTimeout(cb, 1).
     *
     * @see https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args
     *
     * "When delay is [...] less than 1, the delay will be set to 1."
     */
    protected counterImmediate(): NodeJS.Timeout;
    protected counterTimer(): void;
}
/**
 *
 * It is cheap because:
 *
 * - it only prevents the CPU optimization in the poll phase from running once
 *   over a number of ticks. With ticks around 1 msec and LAP = 1000, this means
 *   once over 1000 ticks.
 * - its code is cheap and runs only once over 1000 ticks too.
 *
 * On an "Intel(R) Core(TM) i7-3770 CPU @ 3.40GHz", it causes less than 0.5% CPU load.
 */
declare class CheapCounter extends CounterBase {
    protected keep: boolean;
    constructor(keep?: boolean, log?: LogFunction);
    start(): NodeJS.Timeout;
    watch(): WatchResult;
}
/**
 * This counter attempts to mimic NewRelics "CPU time per tick" metric.
 *
 * It is expensive because:
 *
 * - it prevents the CPU optimization in the poll phase from running because it
 *   sees the "immediate" job queues and does not linger in the poll phase.
 * - its code is cheap but runs on each tick.
 *
 * On an "Intel(R) Core(TM) i7-3770 CPU @ 3.40GHz", it causes about 5% CPU load.
 */
declare class NrCounter extends CounterBase {
    protected immediateTimer?: NodeJS.Immediate;
    protected latestCounterUsage: CpuUsage;
    protected latestWatchUsage: CpuUsage;
    protected maxCpuMsec: number;
    /**
     * The latest tick count.
     */
    protected tickCount: number;
    constructor(log?: LogFunction);
    /**
     * Resetting max(cpuMsec) and return its value.
     *
     * @return {number}
     *   max(cpuMsecPerTick) since last call to counterReset().
     */
    counterReset(): number;
    start(): NodeJS.Timeout;
    stop(): void;
    watch(): WatchResult;
    /**
     * Notice: setTimeout(cb, 0) actually means setTimeout(cb, 1).
     *
     * @see https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args
     *
     * "When delay is [...] less than 1, the delay will be set to 1."
     */
    protected counterImmediate(): NodeJS.Timeout;
    protected counterTimer(): void;
}
export { CheapCounter, CostlyCounter, CounterBase, LogFunction, NrCounter, nullLogger, };
