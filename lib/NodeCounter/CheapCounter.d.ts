/// <reference types="node" />
import { CounterBase, LogFunction, WatchResult } from "./CounterBase";
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
    start(): NodeJS.Timeout;
    /**
     * @inheritDoc
     */
    watch(): WatchResult;
}
export { CheapCounter, };
