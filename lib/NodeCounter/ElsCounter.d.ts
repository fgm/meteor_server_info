/// <reference types="node" />
import Timeout = NodeJS.Timeout;
import { IInfoData, IInfoDescription, LogFunction } from "../types";
import { CounterBase, PollResult } from "./CounterBase";
/**
 *
 * Based on the native libuv hook usage in event-loop-stats.
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
