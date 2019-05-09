/// <reference types="node" />
import Timeout = NodeJS.Timeout;
import { IInfoData, IInfoDescription, LogFunction } from "../types";
import { CounterBase, PollResult } from "./CounterBase";
/**
 *
 * Based on the native libuv hook usage in event-loop-stats.
 *
 * Unlike CostlyCounter and NrCounter, its cost remains very low, meaning it is
 * poised to replace them in future versions, starting with 1.3 at the latest.
 *
 * On an "Intel(R) Core(TM) i7-3770 CPU @ 3.40GHz", it causes less than
 *   0.5% CPU load, unlike the 5%-8% of the userland counters it replaces.
 */
declare class ElsCounter extends CounterBase {
    protected keep: boolean;
    protected busterTimer?: Timeout;
    /**
     * Maintained separately from regular polls to be reset on read.
     */
    protected tickLagMax: number;
    /**
     * @param keep
     *   Keep the event loop running even if only this counter remains.
     * @param log
     *   A "console.log(sprintf(" compatible function.
     */
    constructor(keep?: boolean, log?: LogFunction);
    /**
     * Resetting tickLagMax and return its value.
     *
     * This method is only public for tests: it is not meant for external use.
     *
     * @return
     *   - max(cpuMsecPerTick)
     *   - max(abs(clockMsecLag))
     *   Both since last call to counterReset().
     */
    counterReset(): {
        tickLagMax: number;
    };
    /**
     * @inheritDoc
     */
    getDescription(): IInfoDescription;
    /**
     * @inheritDoc
     */
    getInfo(): IInfoData;
    /**
     * Retrieve the latest sampled results.
     *
     * MAY reset some information: see NrCounter for an example.
     */
    getLastPoll(): IInfoData;
    /**
     * @inheritDoc
     */
    start(): NodeJS.Timeout;
    /**
     * Stop metrics collection. Idempotent, won't error.
     */
    stop(): void;
    /**
     * @inheritDoc
     */
    protected poll(): PollResult;
}
export { ElsCounter, };
