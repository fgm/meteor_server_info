import Timeout = NodeJS.Timeout;

import {IEventStats, sense} from "event-loop-stats";

import {
  IInfoData,
  IInfoDescription,
  LogFunction,
  NanoTs,
  nullLogger,
} from "../types";
import {CounterBase, PollResult} from "./CounterBase";

// The busterTimer interval.
const BUSTER_LAP = 100;

/**
 *
 * Based on the native libuv hook usage in event-loop-stats.
 */
class ElsCounter extends CounterBase {

  // A timer added just to force inactive loops out of inaction.
  protected busterTimer?: Timeout;

  /**
   * Maintained separately from regular polls to be reset on read.
   */
  protected tickLagMax: number = 0;

  /**
   * @param keep
   *   Keep the event loop running even if only this counter remains.
   * @param log
   *   A "console.log(sprintf(" compatible function.
   */
  constructor(protected keep: boolean = true, log: LogFunction = nullLogger) {
    super(log);
    this.keep = keep;
  }

  /**
   * Resetting tickLagMax and return its value.
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
      tickLagMax: this.tickLagMax,
    };
    this.tickLagMax = 0;
    return max;
  }

  /**
   * @inheritDoc
   */
  public getDescription(): IInfoDescription {
    const numberTypeName = "number";
    const description = {
      loopCount: {
        label: "Number of main loop iterations during last sensing, from ELS.",
        type: numberTypeName,
      },
      loopDelay: {
        label: "Estimated current average event main loop duration, in msec.",
        type: numberTypeName,
      },
      loopDelayMaxMsec: {
        label: "Maximum main loop duration, in msec during last sensing, from ELS.",
        type: numberTypeName,
      },
      loopDelayMinMsec: {
        label: "Minimum main loop duration, in msec during last sensing, from ELS.",
        type: numberTypeName,
      },
      loopDelayTotalMsec: {
        label: "Total main loop delay, in msec during last sensing, from ELS.",
        type: numberTypeName,
      },
      tickLagMax: {
        label: "Maximum tick duration deviation from 1 msec (in msec) since last fetch, not last sensing.",
        type: numberTypeName,
      },
    };

    return description;
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

    // The value in .seconds is known to be a small int.
    poll.loopDelay = (poll.loopDelay as NanoTs).seconds + (poll.loopDelay as NanoTs).nanosec / 1E9;

    const keys = Object.keys(poll).sort();
    const res: IInfoData = {};
    for (const key of keys) {
      res[key] = poll[key];
    }
    return res;
  }

  /**
   * @inheritDoc
   */
  public start(): NodeJS.Timeout {
    const timer = super.start();
    this.busterTimer = setInterval(() => (null), BUSTER_LAP);
    if (!this.keep) {
      // Don't keep the event loop running just for us.
      timer.unref();
      this.busterTimer.unref();
    }

    return timer;
  }

  /**
   * Stop metrics collection. Idempotent, won't error.
   */
  public stop() {
    if (typeof this.busterTimer !== "undefined") {
      clearTimeout(this.busterTimer);
      this.busterTimer = undefined;
    }
    super.stop();
  }

  /**
   * @inheritDoc
   */
  protected poll(): PollResult {
    const sensed: IEventStats = sense();

    const [prev, nsec] = super.poll();
    const actualLapNanoTs = nsec.sub(prev);
    // TODO Convert to nsec - prev after Node >= 10.7.
    const actualLapMsec = actualLapNanoTs.toMsec();
    const expectedLapMsec = ElsCounter.LAP;

    const diffMsec = Math.max(parseFloat((actualLapMsec - expectedLapMsec).toFixed(2)), 0);
    this.log("msec for polling loop: expected %4d, actual %7d, lag %6.2f",
      expectedLapMsec, actualLapMsec, diffMsec,
    );

    this.setLastPoll({
      loopCount:          sensed.num,
      loopDelay:          actualLapNanoTs,
      loopDelayMaxMsec:   sensed.max,
      loopDelayMinMsec:   sensed.min,
      loopDelayTotalMsec: sensed.sum,
    });

    // Note that sensed.max is a duration, defaulting to 1. Lag is the
    // difference from that nominal deviation, so it has to be deducted.
    if (sensed.max - 1 > this.tickLagMax) {
      this.tickLagMax = sensed.max - 1;
    }

    return [prev, nsec];
  }
}

export {
  ElsCounter,
};
