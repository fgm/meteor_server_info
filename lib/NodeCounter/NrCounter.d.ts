/// <reference types="node" />
import CpuUsage = NodeJS.CpuUsage;
import Immediate = NodeJS.Immediate;
import Timeout = NodeJS.Timeout;
import { IInfoData, IInfoDescription, LogFunction, NanoTs } from "../types";
import { CounterBase, PollResult } from "./CounterBase";
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
 *
 * @deprecated As of Meteor 1.2.5, this class is deprecated: ElsCounter provides
 *   similar results with far less server load. It will be removed in 1.3 at the
 *   latest.
 */
declare class NrCounter extends CounterBase {
    protected log: LogFunction;
    /**
     * The current setImmediate() result.
     */
    protected immediateTimer?: Immediate;
    /**
     * The current setTimeout() result.
     */
    protected nrTimer?: Timeout;
    protected cpuPerTickMax: number;
    protected latestPollUsage: CpuUsage;
    protected latestTickTimerUsage: CpuUsage;
    protected latestTickTimerNanoTS: NanoTs;
    /**
     * Maintained separately from regular polls to be reset on read.
     */
    protected loopLagMaxMsecSinceLastFetch: number;
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
        cpuPerTickMax: number;
        loopLagMaxMsecSinceLastFetch: number;
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
     * @inheritDoc
     *
     * This method is only public for tests: it is not meant for external use.
     */
    poll(): PollResult;
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
     * Force the event loop not to idle-wait and go back to the timer step.
     *
     * This is the main reason why this technique is costly, but accurate, as it
     * prevents NodeJS from doing the cost-reducing optimization in the "poll"
     * phase of the event loop.
     *
     * Notice: setTimeout(cb, 0) actually means setTimeout(cb, 1).
     *
     * @see https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args
     *
     * "When delay is [...] less than 1, the delay will be set to 1."
     */
    protected tickImmediate(): NodeJS.Timeout;
    /**
     * Update the maximum loop lag and CPU usage during the last tick.
     *
     * @see poll
     */
    protected tickTimer(): void;
}
export { NrCounter, };
