import { hrtime } from "process";

import Timeout = NodeJS.Timeout;

type WatchResult = [bigint, bigint];
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

  public start(): Timeout {
    // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
    this.lastNSec = (hrtime as any).bigint();
    const timer = setInterval(this.watch.bind(this), CounterBase.LAP);
    return timer;
  }

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
