import Immediate = NodeJS.Immediate;
import {CounterBase, LogFunction, nullLogger, WatchResult } from "./CounterBase";

/**
 * This counter actually counts ticks by jumping to and fro the loop phases.
 *
 * It is expensive because:
 *
 * - it prevents the CPU optimization in the poll phase from running because it
 *   sees the "immediate" job queues and does not linger in the poll phase.
 * - its code is cheap but runs on each tick.
 *
 * On an "Intel(R) Core(TM) i7-3770 CPU @ 3.40GHz", it causes about 5% CPU load.
 *
 */
class CostlyCounter extends CounterBase {
  /**
   * The current setImmediate() result.
   */
  protected immediateTimer?: Immediate;

  /**
   * The latest tick count.
   */
  protected tickCount: number;

  /**
   * @param log
   *   A "console.log(sprintf(" compatible function.
   */
  constructor(protected log: LogFunction = nullLogger) {
    super(log);
    this.immediateTimer = undefined;
    this.tickCount = 0;
  }

  public start(): NodeJS.Timeout {
    super.start();
    // Start the actual counting loop.
    return this.counterImmediate();
  }

  public stop() {
    if (typeof this.immediateTimer !== "undefined") {
      clearImmediate(this.immediateTimer);
    }
  }

  public watch(): WatchResult {
    const [prev, nsec] = super.watch();

    // The time elapsed since the previous watch() call.
    const actualLapµsec = Number(nsec - prev) / 1E3; // nsed to µsec.

    // The time expected to have elapsed since the previous watch() call.
    const expectedLapµsec = CostlyCounter.LAP * 1E3; // msec to µsec.

    // The extra delay incurred from expect to actual time elapsed.
    const diffµsec = Math.max(Math.round(actualLapµsec - expectedLapµsec), 0);

    // The actual number of loops performed since the previous watch() call.
    // Math.max is used in case this code runs before the loop counter when LAP <= 1 msec.
    const effectiveLoopCount = Math.max(this.tickCount, 1);

    // The extra time spent per loop.
    let lag = diffµsec / effectiveLoopCount;
    if (isNaN(lag)) {
      lag = 0;
    }
    const invidualLapµsec = Math.round(actualLapµsec / effectiveLoopCount);
    this.log("µsec for %4d loops: expected %7d, actual %7d, diff %6d. Lag per loop: %6.2f, Time per loop: %6d",
      effectiveLoopCount, expectedLapµsec, actualLapµsec, diffµsec, lag, invidualLapµsec,
    );

    this.tickCount = 0;
    return [prev, nsec];
  }

  /**
   * Notice: setTimeout(cb, 0) actually means setTimeout(cb, 1).
   *
   * @see https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args
   *
   * "When delay is [...] less than 1, the delay will be set to 1."
   */
  protected counterImmediate(): NodeJS.Timeout {
    return setTimeout(this.counterTimer.bind(this), 0);
  }

  protected counterTimer() {
    this.tickCount++;
    this.immediateTimer = setImmediate(this.counterImmediate.bind(this));
  }
}

export {
  CostlyCounter,
};
