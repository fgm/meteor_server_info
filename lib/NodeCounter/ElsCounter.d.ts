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
     * @param keep
     *   Keep the event loop running even if only this counter remains.
     * @param log
     *   A "console.log(sprintf(" compatible function.
     */
    constructor(keep?: boolean, log?: LogFunction);
    /**
     * @inheritDoc
     */
    getDescription(): IInfoDescription;
    /**
     * @inheritDoc
     */
    getInfo(): IInfoData;
    /**
     * @inheritDoc
     */
    start(): NodeJS.Timeout;
    /**
     * Stop metrics collection. Idempotent, won't error.
     */
    stop(): void;
    /**
     * Do nothing, but exist just to force the event loop to work.
     *
     * @see ElsCounter.start()
     */
    protected bustOptimizations(): void;
    /**
     * @inheritDoc
     */
    protected poll(): PollResult;
}
export { ElsCounter, };
