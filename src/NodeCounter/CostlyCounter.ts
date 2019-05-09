import Immediate = NodeJS.Immediate;

import {IInfoDescription, LogFunction, nullLogger} from "../types";
import {CounterBase, PollResult } from "./CounterBase";

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
 * @deprecated As of Meteor 1.2.5, this class is deprecated: ElsCounter provides
 *   similar results with far less server load. It will be removed in 1.3 at the
 *   latest.
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
      diffMsec: {
        label: "Difference between actual and expected milliseconds since last polling",
        type: numberTypeName,
      },
      expectedLapMsec: {
        label: "Expected milliseconds since last polling",
        type: numberTypeName,
      },
      individualLapMsec: {
        label: "Average milliseconds per tick since last polling",
        type: numberTypeName,
      },
      lag: {
        label: "Difference between expected and actual tick duration since last polling",
        type: numberTypeName,
      },
      tickCount: {
        label: "Ticks since last polling",
        type: numberTypeName,
      },
      ticksPerSec: {
        label: "Ticks per second",
        type: numberTypeName,
      },
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

  /**
   * @inheritDoc
   */
  protected poll(): PollResult {
    const [prev, nsec] = super.poll();

    // The actual number of loops performed since the previous poll() call.
    // Math.max is used in case this code runs before the loop counter when LAP <= 1 msec.
    const tickCount = Math.max(this.tickCount, 1);

    // The time elapsed since the previous poll() call.
    // TODO replace by nsec - nprev after Node >= 10.7
    const clockMsec = nsec.sub(prev).toMsec();

    const ticksPerSec = tickCount / clockMsec * 1000;

    // The time expected to have elapsed since the previous poll() call.
    const expectedLapMsec = CostlyCounter.LAP;

    // The extra delay incurred from expect to actual time elapsed.
    const diffMsec = Math.max(Math.round(clockMsec - expectedLapMsec), 0);

    // The extra time spent per loop.
    let lag = diffMsec / tickCount;
    if (isNaN(lag)) {
      lag = 0;
    }
    const individualLapMsec = Math.round(clockMsec / tickCount);
    this.log(
      "%4d ticks in %4d msec (expected %4d) => Ticks/sec: %5d, diff %3d. Lag per loop: %6.2f, Time per loop: %6d",
      tickCount, clockMsec, expectedLapMsec, ticksPerSec, diffMsec, lag, individualLapMsec,
    );

    this.tickCount = 0;

    this.setLastPoll({
      clockMsec,
      diffMsec,
      expectedLapMsec,
      individualLapMsec,
      lag,
      tickCount,
      ticksPerSec,
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
    this.tickCount++;
    this.immediateTimer = setImmediate(this.counterImmediate.bind(this));
  }
}

export {
  CostlyCounter,
};
