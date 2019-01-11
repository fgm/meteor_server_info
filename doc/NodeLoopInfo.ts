import { cpuUsage, hrtime } from "process";
import CpuUsage = NodeJS.CpuUsage;
import Timeout = NodeJS.Timeout;
import Immediate = NodeJS.Immediate;

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
class CheapCounter extends CounterBase {
  constructor(protected keep: boolean = true, log: LogFunction = nullLogger) {
    super(log);
    this.keep = keep;
  }

  public start(): NodeJS.Timeout {
    const timer = super.start();
    if (!this.keep) {
      // Don't keep the event loop running just for us.
      timer.unref();
    }
    return timer;
  }

  public watch(): WatchResult {
    const [prev, nsec] = super.watch();
    const actualLapMsec = Number(nsec - prev) / 1E6;
    const expectedLapMsec = CheapCounter.LAP;

    const diffMsec = Math.max(parseFloat((actualLapMsec - expectedLapMsec).toFixed(2)), 0);
    this.log("msec for polling loop: expected %4d, actual %7d, lag %6.2f",
      expectedLapMsec, actualLapMsec, diffMsec,
    );
    return [prev, nsec];
  }
}

/**
 * This counter attempts to mimic NewRelics "CPU time per tick" metric.
 *
 * It is expensive because:
 *
 * - it prevents the CPU optimization in the poll phase from running because it
 *   sees the "immediate" job queues and does not linger in the poll phase.
 * - its code is cheap but runs on each tick.
 *
 * On an "Intel(R) Core(TM) i7-3770 CPU @ 3.40GHz", it causes about 5% CPU load.
 */
class NrCounter extends CounterBase {
  protected immediateTimer?: NodeJS.Immediate;
  protected latestCounterUsage: CpuUsage;
  protected latestWatchUsage: CpuUsage;
  protected maxCpuMsec: number;
  /**
   * The latest tick count.
   */
  protected tickCount: number;

  constructor(log: LogFunction = nullLogger) {
    super(log);
    this.immediateTimer = undefined;
    this.latestCounterUsage = this.latestWatchUsage = cpuUsage();
    this.maxCpuMsec = 0;
    this.tickCount = 0;
  }

  /**
   * Resetting max(cpuMsec) and return its value.
   *
   * @return {number}
   *   max(cpuMsecPerTick) since last call to counterReset().
   */
  public counterReset() {
    const max = this.maxCpuMsec;
    this.maxCpuMsec = 0;
    return max;
  }

  public start(): NodeJS.Timeout {
    super.start();
    // Initialize selector counters (max/min).
    this.counterReset();
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
    const usage = cpuUsage();
    const { user, system } = cpuUsage(this.latestWatchUsage);
    const cpuMsecSinceLast = (user + system) / 1E3; // µsec to msec.

    // The actual number of loops performed since the previous watch() call.
    // Math.max is used in case this code runs before the loop counter when LAP <= 1 msec.
    const tickCount = Math.max(this.tickCount, 1);

    // The time elapsed since the previous watch() call.
    const clockMsec = Number(nsec - prev) / 1E6; // nsec to msec.

    const ticksPerMin = tickCount / clockMsec * 60 * 1000;
    const cpuMsecPerTick = cpuMsecSinceLast / tickCount;
    this.log("%4d ticks in %4d msec => Ticks/minute: %5d, CPU usage %5d msec => CPU/tick %6.3f msec",
      tickCount, clockMsec, ticksPerMin, cpuMsecSinceLast, cpuMsecPerTick,
    );

    this.tickCount = 0;
    this.latestWatchUsage = usage;
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
    const usage = cpuUsage();
    const { user, system } = cpuUsage(this.latestCounterUsage);
    const cpuMsecSinceLast = (user + system) / 1E3; // µsec to msec.
    if (cpuMsecSinceLast > this.maxCpuMsec) {
      this.maxCpuMsec = cpuMsecSinceLast;
    }

    this.tickCount++;
    this.immediateTimer = setImmediate(this.counterImmediate.bind(this));
    this.latestCounterUsage = usage;
  }
}

export {
  CheapCounter,
  CostlyCounter,
  CounterBase,
  LogFunction,
  NrCounter,

  nullLogger,
};
