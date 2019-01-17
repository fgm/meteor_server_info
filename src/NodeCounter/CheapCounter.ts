import {CounterBase, LogFunction, nullLogger, WatchResult} from "./CounterBase";

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

export {
  CheapCounter,
};
