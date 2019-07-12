import CpuUsage = NodeJS.CpuUsage;
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
 *
 * Unlike the earlier userland CostlyCounter and NrCounter, its cost remains
 * very low, which is why it replaced them in v1.3.0.
 *
 * On an "Intel(R) Core(TM) i7-3770 CPU @ 3.40GHz", it causes less than
 * 0.05% CPU load, unlike the 5%-8% of the userland counters it replaces.
 *
 * For this counter, CpuUsage is normalized to the sum of user and system usage,
 * as in the ps(1) command "time" values.
 */
class ElsCounter extends CounterBase {

  // A timer added just to force inactive loops out of inaction.
  protected busterTimer?: Timeout;

  /**
   * Maintained separately from regular polls to be reset on read.
   */
  protected lastFetchCpuUsage: number = 0;

  /**
   * Maintained separately from regular polls to be reset on read.
   */
  protected cpuUsageMaxSinceLastFetch: number = 0;

  /**
   * Maintained separately from regular polls to be reset on read.
   */
  protected cpuUsagePrev: CpuUsage;

  /**
   * Maintained separately from regular polls to be reset on read.
   */
  protected lastFetchTs: NanoTs = NanoTs.forNow();

  /**
   * Maintained separately from regular polls to be reset on read.
   */
  protected loopCountSinceLastFetch: number = 0;

  /**
   * Maintained separately from regular polls to be reset on read.
   */
  protected loopLagMaxMsecSinceLastFetch: number = 0;

  /**
   * @param keep
   *   Keep the event loop running even if only this counter remains.
   * @param log
   *   A "console.log(sprintf(" compatible function.
   */
  constructor(protected keep: boolean = true, log: LogFunction = nullLogger) {
    super(log);
    this.cpuUsagePrev = process.cpuUsage();
    this.keep = keep;
  }

  /**
   * Resetting loopLagMaxMsecSinceLastFetch and return its value.
   *
   * This method is only public for tests: it is not meant for external use.
   *
   * @return
   *   - max(cpuMsecPerTick)
   *   - max(abs(clockMsecLag))
   *   Both since last call to counterReset().
   */
  public counterReset() {
    const now = NanoTs.forNow();
    const max = {
      cpuUsageMaxSinceLastFetch: this.cpuUsageMaxSinceLastFetch,
      loopCountPerSecSinceLastFetch: this.loopCountSinceLastFetch / ((now.toMsec() - this.lastFetchTs.toMsec()) / 1E3),
      loopLagMaxMsecSinceLastFetch: this.loopLagMaxMsecSinceLastFetch,
    };

    this.cpuUsagePrev = process.cpuUsage();
    this.cpuUsageMaxSinceLastFetch = 0;
    this.lastFetchCpuUsage = 0;

    this.lastFetchTs = now;
    this.loopCountSinceLastFetch = 0;
    this.loopLagMaxMsecSinceLastFetch = 0;
    return max;
  }

  /**
   * @inheritDoc
   */
  public getDescription(): IInfoDescription {
    const numberTypeName = "number";
    return {
      cpuUsageMaxSinceLastFetch: {
        label: "Maximum user+system CPU usage percentage per sensing, since last fetch, from ELS.",
        type: numberTypeName,
      },
      loopCount: {
        label: "Number of main loop iterations during last sensing, from ELS.",
        type: numberTypeName,
      },
      loopCountPerSecSinceLastFetch: {
        label: "Number of main loop iterations per second since last fetch, averaged from ELS.",
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
      loopDelayMsec: {
        label: "Estimated current average event main loop duration, in msec.",
        type: numberTypeName,
      },
      loopDelayTotalMsec: {
        label: "Total main loop delay, in msec during last sensing, from ELS.",
        type: numberTypeName,
      },
      loopLagMaxMsecSinceLastFetch: {
        label: "Maximum tick duration deviation from 1 msec (in msec) since last fetch, not last sensing.",
        type: numberTypeName,
      },
    };
  }

  /**
   * @inheritDoc
   */
  public getInfo(): IInfoData {
    const poll: IInfoData = {
      ...this.getLastPoll(),
      // Max and count values are collected in real time, not by polling.
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
   * Retrieve the latest sampled results.
   *
   * MAY reset some information: see NrCounter for an example.
   */
  public getLastPoll(): IInfoData {
    const poll = this.lastPoll;

    // The value in .seconds is known to be a small int.
    poll.loopDelayMsec = (poll.loopDelayMsec as NanoTs).seconds + (poll.loopDelayMsec as NanoTs).nanosec / 1E9;
    return poll;
  }

  /**
   * @inheritDoc
   */
  public start(): NodeJS.Timeout {
    this.setLastPoll({
      loopCount:          0,
      loopDelayMaxMsec:   0,
      loopDelayMinMsec:   0,
      loopDelayMsec:      new NanoTs(0, 0),
      loopDelayTotalMsec: 0,
    });

    const timer = super.start();
    this.lastFetchTs = NanoTs.forNow();
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
      loopDelayMaxMsec:   sensed.max,
      loopDelayMinMsec:   sensed.min,
      loopDelayMsec:      actualLapNanoTs,
      loopDelayTotalMsec: sensed.sum,
    });

    const usage = process.cpuUsage();
    const usageDiff = process.cpuUsage(this.cpuUsagePrev);
    this.cpuUsagePrev = usage;
    const usageRatio: number = ((usageDiff.user + usageDiff.system) / 1E6) / (nsec.sub(prev).toMsec() / 1E3);
    if (usageRatio > this.cpuUsageMaxSinceLastFetch) {
      this.cpuUsageMaxSinceLastFetch = usageRatio;
    }

    // Note that sensed.max is a duration, defaulting to 1. Lag is the
    // difference from that nominal deviation, so it has to be deducted.
    if (sensed.max - 1 > this.loopLagMaxMsecSinceLastFetch) {
      this.loopLagMaxMsecSinceLastFetch = sensed.max - 1;
    }
    this.loopCountSinceLastFetch += sensed.num;

    return [prev, nsec];
  }
}

export {
  ElsCounter,
};
