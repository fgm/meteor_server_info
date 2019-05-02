import {IEventStats, sense} from "event-loop-stats";

import {IInfoData, IInfoDescription, LogFunction, nullLogger} from "../types";
import {CounterBase, PollResult} from "./CounterBase";

console.log("sense",  sense);

/**
 *
 * Based on the native libuv hook usage in event-loop-stats.
 */
class ElsCounter extends CounterBase {

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
      maxLoopDelay: {
        label: "Maximum main loop duration, in msec.",
        type: numberTypeName,
      },
      minLoopDelay: {
        label: "Minimum main loop duration, in msec.",
        type: numberTypeName,
      },
      numLoopDelay: {
        label: "Number of main loop iterations.",
        type: numberTypeName,
      },
      sumLoopDelay: {
        label: "Total main loop delay, in msec.",
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
    if (!this.keep) {
      // Don't keep the event loop running just for us.
      timer.unref();
    }
    return timer;
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
      loopDelay: actualLapNanoTs,
      ...sensed,
    });

    return [prev, nsec];
  }
}

export {
  ElsCounter,
};
