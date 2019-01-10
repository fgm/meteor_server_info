const process = require('process');

/**
 * @property {BigInt} lastNsec
 *   The latest time measurement, in nanoseconds.
 * @property {function} log
 *   A "console.log(sprintf(" compatible function.
 */
class CounterBase {
  constructor(log) {
    this.lastNsec = BigInt(0);
    this.log = log;
  }

  // Polling interval in milliseconds.
  static get LAP() {
    return 1000;
  }

  start() {
    this.lastNsec = process.hrtime.bigint();
    const timer = setInterval(this.watch.bind(this), CounterBase.LAP);
    return timer;
  }

  watch() {
    const prev = this.lastNsec;
    const nsec = process.hrtime.bigint();
    this.lastNsec = nsec;
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
 * @property {Immediate} immediateTimer
 * @property {number} tickCount
 *   The latest tick count.
 */
class CostlyCounter extends CounterBase {
  constructor(log) {
    super(log);
    this.immediateTimer = null;
    this.tickCount = 0;
  }

  /**
   * Notice: setTimeout(cb, 0) actually means setTimeout(cb, 1).
   *
   * @see https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args
   *
   * "When delay is [...] less than 1, the delay will be set to 1."
   */
  counterImmediate() {
    setTimeout(this.counterTimer.bind(this), 0);
  }

  counterTimer() {
    this.tickCount++;
    this.immediateTimer = setImmediate(this.counterImmediate.bind(this));
  }

  start() {
    super.start();
    // Start the actual counting loop.
    this.counterImmediate();
  }

  stop() {
    clearImmediate(this.immediateTimer);
  }

  watch() {
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
    this.log('µsec for %4d loops: expected %7d, actual %7d, diff %6d. Lag per loop: %6.2f, Time per loop: %6d',
      effectiveLoopCount, expectedLapµsec, actualLapµsec, diffµsec, lag, invidualLapµsec
    );

    this.tickCount = 0;
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
 *
 * @property {boolean} keep
 *   Keep the event loop running just for this timer ?
 */
class CheapCounter extends CounterBase {

  constructor(keep = true, log) {
    super(log);
    this.keep = keep;
  }

  start() {
    const timer = super.start();
    if (!this.keep) {
      // Don't keep the event loop running just for us.
      timer.unref();
    }
  }

  watch() {
    const [prev, nsec] = super.watch();
    const actualLapMsec = Number(nsec - prev) / 1E6;
    const expectedLapMsec = CheapCounter.LAP;

    const diffMsec = Math.max((actualLapMsec - expectedLapMsec).toFixed(2), 0);
    this.log('msec for polling loop: expected %4d, actual %7d, lag %6.2f',
      expectedLapMsec, actualLapMsec, diffMsec);

  }
}

module.exports = {
  CheapCounter,
  CostlyCounter,
  CounterBase,
};
