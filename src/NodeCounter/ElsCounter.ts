import Timeout = NodeJS.Timeout;

import {IEventStats, sense} from "event-loop-stats";

import {IInfoData, IInfoDescription, LogFunction, nullLogger} from "../types";
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
   * @inheritDoc
   */
  public getDescription(): IInfoDescription {
    const numberTypeName = "number";
    const description = {
      loopDelay: {
        label: "Estimated current average event main loop duration, in msec.",
        type: numberTypeName,
      },
      loopDelayCount: {
        label: "Number of main loop iterations since last fetch, from ELS.",
        type: numberTypeName,
      },
      loopDelayMaxMsec: {
        label: "Maximum main loop duration, in msec since last fetch, from ELS.",
        type: numberTypeName,
      },
      loopDelayMinMsec: {
        label: "Minimum main loop duration, in msec since last fetch, from ELS.",
        type: numberTypeName,
      },
      loopDelayTotalMsec: {
        label: "Total main loop delay, in msec since last fetch, from ELS.",
        type: numberTypeName,
      },
    };

    return description;
  }

  /**
   * @inheritDoc
   */
  public getInfo(): IInfoData {
    return this.getLastPoll();
  }

  /**
   * @inheritDoc
   */
  public start(): NodeJS.Timeout {
    const timer = super.start();
    this.busterTimer = setInterval(this.bustOptimizations.bind(this), BUSTER_LAP);
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
   * Do nothing, but exist just to force the event loop to work.
   *
   * @see ElsCounter.start()
   */
  protected bustOptimizations() {}

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
      loopDelay:          actualLapNanoTs,
      loopDelayCount:     sensed.num,
      loopDelayMaxMsec:   sensed.max,
      loopDelayMinMsec:   sensed.min,
      loopDelayTotalMsec: sensed.sum,
    });

    return [prev, nsec];
  }
}

export {
  ElsCounter,
};
