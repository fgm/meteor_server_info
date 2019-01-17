/// <reference types="node" />
import Immediate = NodeJS.Immediate;
import { CounterBase, LogFunction, WatchResult } from "./CounterBase";
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
    /**
     * Start the metric collection.
     *
     * @return
     *   A timer instance usable with this.stop() to stop collection.
     */
    start(): NodeJS.Timeout;
    /**
     * Stop metrics collection.
     */
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
export { CostlyCounter, };