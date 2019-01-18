import { hrtime } from "process";

import Timeout = NodeJS.Timeout;

/**
 * The result of a watch() iteration: a previous/current pair of nanotimestamps.
 *
 * It can only represent positive durations.
 *
 * TODO Remove this workaround workaround after Node >= 10.7 with bigint.
 */
class NanoTs {
  /**
   * Ensures normalize values: only positive integers, nanosec < 1E9.
   *
   * Converts extra nsec to extra seconds if needed.
   *
   * @param seconds
   * @param nanosec
   */
  constructor(protected seconds: number = 0, protected nanosec: number = 0) {
    // Ensure integer values to avoid float rounding issues.
    this.seconds = Math.trunc(Math.abs(seconds));
    this.nanosec = Math.trunc(Math.abs(nanosec));
    if (this.nanosec > 1E9) {
      const remainder = this.nanosec % 1E9;
      this.seconds += (this.nanosec - remainder / 1E9);
      this.nanosec = remainder;
    }
  }

  /**
   * Subtract a *smaller* NanoTs from a larger one.
   *
   * @param other
   *
   * @throws Error
   *   In case of data corruption, or if the other value is larger than the instance.
   */
  public sub(other: NanoTs): NanoTs {
    let ndiff = this.nanosec - other.nanosec;
    if (Math.abs(ndiff) >= 1E9) {
      throw new Error("Data corruption detected: 0 <= nsec <= 1E9, so nsec diff cannot be >= 1E9");
    }
    let sdiff = this.seconds - other.seconds;
    if (Math.abs(sdiff) > 1E21) {
      throw new Error("ECMA-262 only guarantees 21 digits of accuracy, cannot subtract accurately");
    }

    if (sdiff < 0) {
      throw new Error("Subtracted value is larger than base value: result would be negative.");
    }

    if (ndiff < 0) {
      // -1E9 <= ndiff < 0 by construction, so just add 1 sec:
      // sdiff > 0 and sdiff integer => sdiff - 1 >= 0.
      sdiff -= 1;
      ndiff += 1E9;
    }

    return new NanoTs(sdiff, ndiff);
  }
}

// TODO: convert to [bigint, bigint] after Meteor (1.9 ?) switches to NodeJS >= 10.7.
type WatchResult = [NanoTs, NanoTs];

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
  protected lastNSec: NanoTs;

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

  /**
   * Start the metric collection.
   *
   * @return Timeout
   *   A timer instance usable with this.stop() to stop collection.
   */
  public start(): Timeout {
    // TODO replace this Node 8 version by the one below after Node >= 10.7.
    const hrt = hrtime();
    this.lastNSec = new NanoTs(hrt[0], hrt[1]);

    /* TODO Node 11.6 version with the next TODO
    // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
    this.lastNSec = (hrtime as any).bigint();
    */

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

    // TODO replace this Node 8 version by the one below after Node >= 10.7.
    const hrt = hrtime();
    const nsec: NanoTs = new NanoTs(hrt[0], hrt[1]);

    /* TODO Node 11.6 version with the next TODO
    // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
    const nsec: bigint = (hrtime as any).bigint() as bigint;
    */
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
