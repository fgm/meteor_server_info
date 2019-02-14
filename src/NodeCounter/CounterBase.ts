import {
  IInfoData,
  IInfoDescription,
  IInfoSection,
  LogFunction,
  NanoTs,
  nullLogger,
} from "../types";
import Timeout = NodeJS.Timeout;

// TODO: convert to [bigint, bigint] after Meteor (1.9 ?) switches to NodeJS >= 10.7.
type PollResult = [NanoTs, NanoTs];

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
class CounterBase implements ICounter, IInfoSection {
  /**
   * The latest time measurement, in nanoseconds.
   */
  protected lastNSec: NanoTs;

  protected lastPoll: IInfoData = {};

  protected timer?: Timeout;

  /**
   * @param log
   *   A "console.log(sprintf(" compatible function.
   */
  constructor(protected log: LogFunction = nullLogger) {
    // TODO replace by BigInt(0) after Node >= 10.7.
    this.lastNSec = new NanoTs();
  }

  // Polling interval in milliseconds.
  public static get LAP() {
    return 1000;
  }

  public getInfo(): IInfoData {
    return this.getLastPoll();
  }

  public getDescription(): IInfoDescription {
    return {
      lastNSec: { label: "The last time the loop was polled, in nanoseconds", type: "NanoTs" },
    };
  }

  /**
   * @inheritDoc
   */
  public getLastPoll(): IInfoData {
    return this.lastPoll;
  }

  /**
   * @inheritDoc
   */
  public setLastPoll(info: IInfoData): void {
    this.lastPoll = info;
  }

  /**
   * Start the polling loop. Child classes will also start a metric loop.
   *
   * @return Timeout
   *   A timer instance usable with this.stop() to stop collection.
   */
  public start(): Timeout {
    // TODO replace this Node 8 version by the one below after Node >= 10.7.
    this.lastNSec = NanoTs.forNow();

    /* TODO Node 11.6 version with the next TODO
    // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
    this.lastNSec = (hrtime as any).bigint();
    */

    this.timer = setInterval(this.poll.bind(this), CounterBase.LAP);
    return this.timer;
  }

  /**
   * Stop metrics collection. Idempotent, won't error.
   */
  public stop() {
    if (typeof this.timer !== "undefined") {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  /**
   * Observe the current metrics value and update last nanotimestamp.
   */
  protected poll(): PollResult {
    const prev = this.lastNSec;

    // TODO replace this Node 8 version by the one below after Node >= 10.7.
    const nsec: NanoTs = NanoTs.forNow();

    /* TODO Node 11.6 version with the next TODO
    // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
    const nsec: bigint = (hrtime as any).bigint() as bigint;
    */
    this.lastNSec = nsec;
    this.setLastPoll({
      lastNSec: nsec,
    });

    return [prev, nsec];
  }
}

export {
  CounterBase,
  ICounter,
  PollResult,
};
