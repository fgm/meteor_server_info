import CpuUsage = NodeJS.CpuUsage;
import Immediate = NodeJS.Immediate;
import Timeout = NodeJS.Timeout;
import {cpuUsage} from "process";

import {
  IInfoData,
  IInfoDescription,
  LogFunction,
  NanoTs,
  nullLogger,
} from "../types";
import {CounterBase, PollResult} from "./CounterBase";

/**
 * This counter attempts to mimic NewRelic's "CPU time per tick" metric.
 *
 * It is expensive because:
 *
 * - it prevents the CPU optimization in the poll phase from running because it
 *   sees the "immediate" job queues and does not linger in the poll phase.
 * - its code is cheap but runs on each tick.
 *
 * On an "Intel(R) Core(TM) i7-3770 CPU @ 3.40GHz", it causes about 6% CPU load.
 */
class NrCounter extends CounterBase {
  /**
   * The current setImmediate() result.
   */
  protected immediateTimer?: Immediate;

  /**
   * The current setTimeout() result.
   */
  protected nrTimer?: Timeout;

  protected cpuPerTickMax: number = 0;
  protected tickLagMax: number = 0;
  protected latestPollUsage: CpuUsage;
  protected latestTickTimerUsage: CpuUsage;
  protected latestTickTimerNanoTS: NanoTs;

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
    this.latestTickTimerUsage = this.latestPollUsage = cpuUsage();
    this.latestTickTimerNanoTS = NanoTs.forNow();
    this.tickCount = 0;
  }

  /**
   * Resetting max(cpuMsec) and return its value.
   *
   * This method is only public for tests: it is not meant for external use.
   *
   * @return
   *   - max(cpuMsecPerTick)
   *   - max(abs(clockMsecLag))
   *   Both since last call to counterReset().
   */
  public counterReset() {
    const max = {
      cpuPerTickMax: this.cpuPerTickMax,
      tickLagMax: this.tickLagMax,
    };
    this.tickLagMax = 0;
    this.cpuPerTickMax = 0;
    return max;
  }

  /**
   * @inheritDoc
   */
  public getDescription(): IInfoDescription {
    const numberTypeName = "number";
    return {
      cpuPerSecond: {
        label: "CPU milliseconds used by process during last quasi-second.",
        type: numberTypeName,
      },
      cpuPerTickAvg: {
        label: "Average CPU milliseconds used by process per tick during last quasi-second.",
        type: numberTypeName,
      },
      cpuPerTickMax: {
        label: "Maximum of CPU milliseconds used by process since last fetch, not last quasi-second.",
        type: numberTypeName,
      },
      tickCount: {
        label: "Exact tick count during last quasi-second.",
        type: numberTypeName,
      },
      tickLagAvg: {
        label: "Average tick duration deviation from 1 msec (in msec) during last quasi-second.",
        type: numberTypeName,
      },
      tickLagMax: {
        label: "Maximum tick duration deviation from 1 msec (in msec) since last fetch, not last quasi-second.",
        type: numberTypeName,
      },
      ticksPerSec: {
        label: "Average ticks per second during last quasi-second",
        type: numberTypeName,
      },
    };
  }

  /**
   * @inheritDoc
   */
  public getLastPoll(): IInfoData {
    const poll: IInfoData = {
      ...this.lastPoll,
      // Max values are collected in real time, not by polling.
      ...this.counterReset(),
    };
    const keys = Object.keys(poll).sort();
    const res: IInfoData = {};
    for (const key of keys) {
      res[key] = poll[key];
    }
    return res;
  }

  /**
   * @inheritDoc
   *
   * This method is only public for tests: it is not meant for external use.
   */
  public poll(): PollResult {
    const [prev, nsec] = super.poll();

    const usage = cpuUsage();
    const {user, system} = cpuUsage(this.latestPollUsage);
    const cpuMsecPerSecond = (user + system) / 1E3; // µsec to msec.

    // The actual number of loops performed since the previous poll() call.
    // Math.max is used in case this code runs before the loop counter when LAP <= 1 msec.
    const tickCount = Math.max(this.tickCount, 1);

    // The time elapsed since the previous poll() call.
    // TODO replace by nsec - nprev after Node >= 10.7
    const clockMsec = nsec.sub(prev).toMsec();
    const clockMsecPerTick = clockMsec / tickCount;
    const tickLagAvg = clockMsecPerTick - 1;

    const ticksPerSec = tickCount / clockMsec * CounterBase.LAP;
    const cpuMsecPerTickAvg = cpuMsecPerSecond / tickCount;
    this.log(
      "%4d ticks in %4d msec => Ticks/sec: %5d, CPU usage %5d msec => CPU/tick %6.3f msec",
      tickCount, clockMsec, ticksPerSec, cpuMsecPerSecond, cpuMsecPerTickAvg,
    );

    this.tickCount = 0;
    this.latestPollUsage = usage;
    this.setLastPoll({
      cpuPerSecond: cpuMsecPerSecond,
      cpuPerTickAvg: cpuMsecPerTickAvg,
      tickCount,
      tickLagAvg,
      ticksPerSec,
    });

    return [prev, nsec];
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
    return this.tickImmediate();
  }

  /**
   * @inheritDoc
   */
  public stop() {
    if (typeof this.immediateTimer !== "undefined") {
      clearImmediate(this.immediateTimer);
      this.immediateTimer = undefined;
    }
    if (typeof this.nrTimer !== "undefined") {
      clearTimeout(this.nrTimer);
      this.nrTimer = undefined;
    }
    super.stop();
  }

  /**
   * Force the event loop not to idle-wait and go back to the timer step.
   *
   * This is the main reason why this technique is costly, but accurate, as it
   * prevents NodeJS from doing the cost-reducing optimization in the "poll"
   * phase of the event loop.
   *
   * Notice: setTimeout(cb, 0) actually means setTimeout(cb, 1).
   *
   * @see https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args
   *
   * "When delay is [...] less than 1, the delay will be set to 1."
   */
  protected tickImmediate(): NodeJS.Timeout {
    return this.nrTimer = setTimeout(this.tickTimer.bind(this), 0);
  }

  /**
   * Update the maximum loop lag and CPU usage during the last tick.
   *
   * @see poll
   */
  protected tickTimer() {
    // Evaluate maximum clockMsecLag
    // TODO replace this Node 8 version by the one below after Node >= 10.7.
    const clockPrev = this.latestTickTimerNanoTS;
    // Ticks are expected to happen every 1/CounterBase seconds = 1 msec.
    const tickLag = NanoTs.forNow().sub(clockPrev).toMsec() - 1;
    if (Math.abs(tickLag) > Math.abs(this.tickLagMax)) {
      this.tickLagMax = tickLag;
    }
    this.latestTickTimerNanoTS = NanoTs.forNow();

    // Evaluate maximum cpuPerTickMax.
    const usage = cpuUsage();
    const {user, system} = cpuUsage(this.latestTickTimerUsage);
    const cpuMsecPerTick = (user + system) / 1E3; // µsec to msec.
    if (cpuMsecPerTick > this.cpuPerTickMax) {
      this.cpuPerTickMax = cpuMsecPerTick;
    }
    this.latestTickTimerUsage = usage;

    // Update per-tick counter.
    this.tickCount++;

    // Rearm.
    this.immediateTimer = setImmediate(this.tickImmediate.bind(this));
  }
}

export {
  NrCounter,
};
