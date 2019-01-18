import CpuUsage = NodeJS.CpuUsage;
import {cpuUsage} from "process";

import {IInfoData, IInfoDescription, LogFunction, nullLogger} from "../types";
import {CounterBase, WatchResult} from "./CounterBase";

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

  /**
   * @param log
   *   A "console.log(sprintf(" compatible function.
   */
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
   * This method is only public for tests: it is not meant for external use.
   *
   * @return {number}
   *   max(cpuMsecPerTick) since last call to counterReset().
   */
  public counterReset() {
    const max = this.maxCpuMsec;
    this.maxCpuMsec = 0;
    return max;
  }

  /**
   * @inheritDoc
   */
  public getDescription(): IInfoDescription {
    const numberTypeName = "number";
    return {
      clockMsec: {
        label: "Milliseconds since last polling",
        type: numberTypeName,
      },
      cpuMsecPerTick: {
        label: "Average CPU milliseconds used by process per tick since last polling",
        type: numberTypeName,
      },
      cpuMsecSinceLast: {
        label: "CPU milliseconds used by process since last polling",
        type: numberTypeName,
      },
      maxCpuMsec: {
        label: "Maximum of CPU milliseconds used by process since last fetch of the same counter, not last polling",
        type: numberTypeName,
      },
      tickCount: {
        label: "Ticks since last polling",
        type: numberTypeName,
      },
      ticksPerMin: {
        label: "Ticks per minute",
        type: numberTypeName,
      },
    };
  }

  /**
   * @inheritDoc
   */
  public getInfo(): IInfoData {
    return {
      ...this.getLastPoll(),
      // maxCpuMsec is collected in real time, not by polling.
      maxCpuMsec: this.counterReset(),
    };
  }

  /**
   * Start the metric collection.
   *
   * @return
   *   A timer instance usable with this.stop() to stop collection.
   */
  public start(): NodeJS.Timeout {
    super.start();

    // Initialize selector counters (max/min).
    this.counterReset();
    // Start the actual counting loop.
    return this.counterImmediate();
  }

  /**
   * @inheritDoc
   */
  public stop() {
    if (typeof this.immediateTimer !== "undefined") {
      clearImmediate(this.immediateTimer);
      this.immediateTimer = undefined;
    }
  }

  protected watch(): WatchResult {
    const [prev, nsec] = super.watch();

    const usage = cpuUsage();
    const {user, system} = cpuUsage(this.latestWatchUsage);
    const cpuMsecSinceLast = (user + system) / 1E3; // µsec to msec.

    // The actual number of loops performed since the previous watch() call.
    // Math.max is used in case this code runs before the loop counter when LAP <= 1 msec.
    const tickCount = Math.max(this.tickCount, 1);

    // The time elapsed since the previous watch() call.
    // TODO replace by nsec - nprev after Node >= 10.7
    const clockMsec = nsec.sub(prev).toMsec();

    const ticksPerMin = tickCount / clockMsec * 60 * 1000;
    const cpuMsecPerTick = cpuMsecSinceLast / tickCount;
    this.log("%4d ticks in %4d msec => Ticks/minute: %5d, CPU usage %5d msec => CPU/tick %6.3f msec",
      tickCount, clockMsec, ticksPerMin, cpuMsecSinceLast, cpuMsecPerTick,
    );

    this.tickCount = 0;
    this.latestWatchUsage = usage;
    this.setLastPoll({
      clockMsec,
      cpuMsecPerTick,
      cpuMsecSinceLast,
      tickCount,
      ticksPerMin,
    });

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
    const {user, system} = cpuUsage(this.latestCounterUsage);
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
  NrCounter,
};
