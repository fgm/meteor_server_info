/// <reference types="node" />
import CpuUsage = NodeJS.CpuUsage;
import Immediate = NodeJS.Immediate;
import { IInfoData, IInfoDescription, LogFunction } from "../types";
import { CounterBase, WatchResult } from "./CounterBase";
/**
 * This counter attempts to mimic NewRelic's "CPU time per tick" metric.
 *
 * It is expensive because:
 *
 * - it prevents the CPU optimization in the poll phase from running because it
 *   sees the "immediate" job queues and does not linger in the poll phase.
 * - its code is cheap but runs on each tick.
 *
 * On an "Intel(R) Core(TM) i7-3770 CPU @ 3.40GHz", it causes about 6% CPU load.
 */
declare class NrCounter extends CounterBase {
    protected log: LogFunction;
    /**
     * The current setImmediate() result.
     */
    protected immediateTimer?: Immediate;
    protected clockMsecLagMax: number;
    protected cpuMsecMax: number;
    protected latestCounterUsage: CpuUsage;
    protected latestWatchUsage: CpuUsage;
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
     * Resetting max(cpuMsec) and return its value.
     *
     * This method is only public for tests: it is not meant for external use.
     *
     * @return
     *   - max(cpuMsecPerTick)
     *   - max(abs(clockMsecLag))
     *   Both since last call to counterReset().
     */
    counterReset(): {
        clockMsecLagMax: number;
        cpuMsecMax: number;
    };
    /**
     * @inheritDoc
     */
    getDescription(): IInfoDescription;
    /**
     * @inheritDoc
     */
    getLastPoll(): IInfoData;
    /**
     * Start the metric collection.
     *
     * @return
     *   A timer instance usable with this.stop() to stop collection.
     */
    start(): NodeJS.Timeout;
    /**
     * @inheritDoc
     */
    stop(): void;
    /**
     * @inheritDoc
     */
    protected watch(): WatchResult;
    /**
     * Notice: setTimeout(cb, 0) actually means setTimeout(cb, 1).
     *
     * @see https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args
     *
     * "When delay is [...] less than 1, the delay will be set to 1."
     */
    protected counterImmediate(): NodeJS.Timeout;
    /**
     * Update the maximum CPU usage.
     *
     * The maximum clockMsecLag  update is done in watch() instead. This avoids
     * the extra load of fetching the HR timer twice in a tick.
     *
     * @see watch
     */
    protected counterTimer(): void;
}
export { NrCounter, };
