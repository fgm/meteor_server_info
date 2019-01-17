import { hrtime } from "process";

import Timeout = NodeJS.Timeout;

/**
 * The result of a watch() iteration: a previous/current pair of nanotimestamps.
 */
type WatchResult = [bigint, bigint];

/**
 * The type for fonctions compatible with "console.log(sprintf("
 */
type LogFunction = (format: string, ...args: any[]) => void;

/**
 * nullLogger is a silent logger usable by Counter classes.
 *
 * @param {string}_format
 * @param {any[]} _args
 */
const nullLogger: LogFunction = (_format: string, ..._args: any[]): void => { return; };

class CounterBase {
  /**
   * The latest time measurement, in nanoseconds.
   */
  protected lastNSec: bigint;

  protected timer?: Timeout;

  /**
   * @param log
   *   A "console.log(sprintf(" compatible function.
   */
  constructor(protected log: LogFunction = nullLogger) {
    this.lastNSec = BigInt(0);
  }

  // Polling interval in milliseconds.
  public static get LAP() {
    return 1000;
  }

  /**
   * Start the metric collection.
   *
   * @return Timeout
   *   A timer instance usable with this.stop() to stop collection.
   */
  public start(): Timeout {
    // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
    this.lastNSec = (hrtime as any).bigint();
    this.timer = setInterval(this.watch.bind(this), CounterBase.LAP);
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
  public watch(): WatchResult {
    const prev = this.lastNSec;
    // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
    const nsec: bigint = (hrtime as any).bigint() as bigint;
    this.lastNSec = nsec;
    return [prev, nsec];
  }
}

export {
  CounterBase,
  LogFunction,
  WatchResult,

  nullLogger,
};
