/// <reference types="node" />
import CpuUsage = NodeJS.CpuUsage;
import { CounterBase, LogFunction, WatchResult } from "./CounterBase";
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
export { NrCounter, };
