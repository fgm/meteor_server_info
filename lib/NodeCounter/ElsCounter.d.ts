/// <reference types="node" />
import { IInfoData, IInfoDescription, LogFunction } from "../types";
import { CounterBase, PollResult } from "./CounterBase";
/**
 *
 * Based on the native libuv hook usage in event-loop-stats.
 */
declare class ElsCounter extends CounterBase {
    protected keep: boolean;
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
     * @inheritDoc
     */
    protected poll(): PollResult;
}
export { ElsCounter, };
