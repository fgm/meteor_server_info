/// <reference types="node" />
import CpuUsage = NodeJS.CpuUsage;
import Timeout = NodeJS.Timeout;
import { IInfoData, IInfoDescription, LogFunction, NanoTs } from "../types";
import { CounterBase, PollResult } from "./CounterBase";
/**
 *
 * Based on the native libuv hook usage in event-loop-stats.
 *
 * Unlike the earlier userland CostlyCounter and NrCounter, its cost remains
 * very low, which is why it replaced them in v1.3.0.
 *
 * On an "Intel(R) Core(TM) i7-3770 CPU @ 3.40GHz", it causes less than
 * 0.05% CPU load, unlike the 5%-8% of the userland counters it replaces.
 *
 * For this counter, CpuUsage is normalized to the sum of user and system usage,
 * as in the ps(1) command "time" values.
 */
declare class ElsCounter extends CounterBase {
    protected keep: boolean;
    protected busterTimer?: Timeout;
    /**
     * Maintained separately from regular polls to be reset on read.
     */
    protected lastFetchCpuUsage: number;
    /**
     * Maintained separately from regular polls to be reset on read.
     */
    protected cpuUsageMaxSinceLastFetch: number;
    /**
     * Maintained separately from regular polls to be reset on read.
     */
    protected cpuUsagePrev: CpuUsage;
    /**
     * Maintained separately from regular polls to be reset on read.
     */
    protected lastFetchTs: NanoTs;
    /**
     * Maintained separately from regular polls to be reset on read.
     */
    protected loopCountSinceLastFetch: number;
    /**
     * Maintained separately from regular polls to be reset on read.
     */
    protected loopLagMaxMsecSinceLastFetch: number;
    /**
     * @param keep
     *   Keep the event loop running even if only this counter remains.
     * @param log
     *   A "console.log(sprintf(" compatible function.
     */
    constructor(keep?: boolean, log?: LogFunction);
    /**
     * Resetting loopLagMaxMsecSinceLastFetch and return its value.
     *
     * This method is only public for tests: it is not meant for external use.
     *
     * @return
     *   - max(cpuMsecPerTick)
     *   - max(abs(clockMsecLag))
     *   Both since last call to counterReset().
     */
    counterReset(): {
        cpuUsageMaxSinceLastFetch: number;
        loopCountPerSecSinceLastFetch: number;
        loopLagMaxMsecSinceLastFetch: number;
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
