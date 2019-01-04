const fs = require('fs');
const crypto = require('crypto');
const process = require('process');
const sprintf = require("sprintf-js").sprintf;

/**
 * This counter actually counts ticks by jumping to and fro the loop phases.
 *
 * It is expensive because:
 *
 * - it prevents the CPU optimization in the poll phase from running because it
 *   sees the "immediate" job queues and does not linger.
 * - its code is cheap but runs on each tick.
 *
 * On an "Intel(R) Core(TM) i7-3770 CPU @ 3.40GHz", it causes about 5% CPU load.
 *
 * @property {Immediate} immediateTimer
 * @property {BigInt} lastNsec
 *   The latest time measurement, in nanoseconds.
 * @property {number} tickCount
 *   The latest tick count.
 */
class CostlyCounter {
  // Polling interval in milliseconds.
  static get LAP() {
    return 1000;
  }

  constructor() {
    this.immediateTimer = null;
    this.lastNsec = BigInt(0);
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
    this.lastNsec = process.hrtime.bigint();
    this.counterImmediate();
    this.watch();
  }

  stop() {
    clearImmediate(this.immediateTimer);
  }

  watch() {
    const nsec = process.hrtime.bigint();
    const actualLapµsec = Number(nsec - this.lastNsec) / 1E3;
    const expectedLapµsec = CostlyCounter.LAP * 1E3; // msec to µsec
    const diffµsec = Math.max(Math.round(actualLapµsec - expectedLapµsec), 0);

    // In case this code runs before the loop counter when LAP <= 1 msec.
    const effectiveLoopCount = Math.max(this.tickCount, 1);

    let lag = Math.round(diffµsec / effectiveLoopCount);
    if (isNaN(lag)) {
      lag = 0;
    }
    const invidualLapµsec = Math.round(actualLapµsec / effectiveLoopCount);
    console.log(sprintf('µsec for %4d loops: expected %7d, actual %7d, diff %6d. Lag per loop: %6d, Time per loop: %6d',
      effectiveLoopCount, expectedLapµsec, actualLapµsec, diffµsec, lag, invidualLapµsec));

    this.lastNsec = nsec;
    this.tickCount = 0;
    setTimeout(this.watch.bind(this), CostlyCounter.LAP);
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
 * @property {BigInt} lastNsec
 *   The latest time measurement, in nanoseconds.
 */
class CheapCounter {
  // Polling interval in milliseconds.
  static get LAP() {
    return 1000;
  }

  constructor(keep = true) {
    this.keep = keep;
    this.lastNsec = BigInt(0);
  }

  start() {
    this.lastNsec = process.hrtime.bigint();
    const timer = setInterval(this.watch.bind(this), CheapCounter.LAP);
    if (!this.keep) {
      // Don't keep the event loop running just for us.
      timer.unref();
    }
  }

  watch() {
    const nsec = process.hrtime.bigint();
    const actualLapMsec = Number(nsec - this.lastNsec) / 1E6;
    const expectedLapMsec = CheapCounter.LAP;

    const diffMsec = Math.max((actualLapMsec - expectedLapMsec).toFixed(2), 0);
    console.log(sprintf('msec for polling loop: expected %4d, actual %7d, lag %6.2f',
      expectedLapMsec, actualLapMsec, diffMsec));

    this.lastNsec = nsec;
  }
}

// ---- Tools ------------------------------------------------------------------

/**
 * Active sync wait.
 *
 * @param {number} msec
 */
function milliwait(msec) {
  const m0 = Date.now();
  while (Date.now() - m0 < msec) {
  }
}

/**
 * Read and hash a disk file.
 *
 * Try having at least 1 GB in it.
 *
 * Can be generated with this command for 1 GB:
 *   dd if=/dev/urandom of=random bs=1048576 count=1024
 *
 * @param file
 */
function read(file = 'random') {
  console.log('Starting to read');
  // This part is performed by a background thread so does not impact the loop.
  fs.readFile(file, (err, res) => {
    console.log(err, res.length);

    // This part does impact the loop, although it does not completely block.
    const hash = crypto.createHash('sha256', "not so secret")
      .update(res)
      .digest('hex');
    console.log("Encrypted bytes: ", hash.length);
  });
}

// ---- Main logic -------------------------------------------------------------
const cheap = false;

console.log("PID: ", process.pid);

if (cheap) {
  (new CheapCounter(true)).start();
  setTimeout(read, 3000);
} else {
  (new CostlyCounter()).start();
  setTimeout(read, 1000);
}
