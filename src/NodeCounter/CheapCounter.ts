import {
  IInfoData,
  IInfoDescription,
  LogFunction,
  NanoTs,
  nullLogger,
} from "../types";
import {CounterBase, PollResult} from "./CounterBase";

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
        label: "Estimated average event main loop duration, in msec.",
        type: numberTypeName,
      },
    };

    return description;
  }

  /**
   * @inheritDoc
   */
  public getInfo(): IInfoData {
    const polled = this.getLastPoll();
    // The value in .seconds is known to be a small int.
    polled.loopDelay = (polled.loopDelay as NanoTs).seconds + (polled.loopDelay as NanoTs).nanosec / 1E9;
    return polled;
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
    const [prev, nsec] = super.poll();
    const actualLapNanoTs = nsec.sub(prev);
    // TODO Convert to nsec - prev after Node >= 10.7.
    const actualLapMsec = actualLapNanoTs.toMsec();
    const expectedLapMsec = CheapCounter.LAP;

    const diffMsec = Math.max(parseFloat((actualLapMsec - expectedLapMsec).toFixed(2)), 0);
    this.log("msec for polling loop: expected %4d, actual %7d, lag %6.2f",
      expectedLapMsec, actualLapMsec, diffMsec,
    );

    this.setLastPoll({
      loopDelay: actualLapNanoTs,
    });

    return [prev, nsec];
  }
}

export {
  CheapCounter,
};
