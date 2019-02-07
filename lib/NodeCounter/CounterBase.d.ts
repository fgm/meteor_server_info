import { IInfoData, IInfoDescription, IInfoSection, LogFunction, NanoTs } from "../types";
import Timeout = NodeJS.Timeout;
declare type WatchResult = [NanoTs, NanoTs];
interface ICounter {
    /**
     * Retrieve the latest sampled results.
     *
     * MAY reset some information: see NrCounter for an example.
     */
    getLastPoll(): IInfoData;
    /**
     * Store the latest sampled results.
     *
     * @param info
     *   The latest sampled results.
     *
     * This method is only meant for internal or test use.
     */
    setLastPoll(info: IInfoData): void;
    /**
     * Describe the contents returned by getLastPoll().
     */
    getDescription(): IInfoDescription;
    /**
     * Start metric sampling.
     */
    start(): Timeout;
    /**
     * Stop metric sampling.
     */
    stop(): void;
}
/**
 * The general logic of counters may imply TWO different looping constructs:
 *
 * - a metrics loop, which generates work values
 * - a polling loop, which gathers current work values and stores them for review
 *
 * In the simple CheapCounter, there is no specific metric loop, but
 * CostlyCounter and NrCounter use a separate metrics "loop" made of alternate
 * setTimeout()/setImmediate() jumps running around the NodeJS event loop.
 */
declare class CounterBase implements ICounter, IInfoSection {
    protected log: LogFunction;
    /**
     * The latest time measurement, in nanoseconds.
     */
    protected lastNSec: NanoTs;
    protected lastPoll: IInfoData;
    protected timer?: Timeout;
    /**
     * @param log
     *   A "console.log(sprintf(" compatible function.
     */
    constructor(log?: LogFunction);
    static readonly LAP: number;
    getInfo(): IInfoData;
    getDescription(): IInfoDescription;
    /**
     * @inheritDoc
     */
    getLastPoll(): IInfoData;
    /**
     * @inheritDoc
     */
    setLastPoll(info: IInfoData): void;
    /**
     * Start the polling loop. Child classes will also start a metric loop.
     *
     * @return Timeout
     *   A timer instance usable with this.stop() to stop collection.
     */
    start(): Timeout;
    /**
     * Stop metrics collection. Idempotent, won't error.
     */
    stop(): void;
    /**
     * Observe the current metrics value and update last nanotimestamp.
     */
    protected watch(): WatchResult;
}
export { CounterBase, ICounter, WatchResult, };
