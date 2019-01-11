import { createHash } from "crypto";
import fs from "fs";
import { sprintf } from "sprintf-js";

import { argv, argv0, exit, hrtime, pid } from "process";

import {
  CheapCounter,
  CostlyCounter,
  CounterBase,
  LogFunction,
  NrCounter,
} from "./NodeLoopInfo";

// ---- Tools ------------------------------------------------------------------

const logT0 = Date.now();

/**
 * timingLog wraps a sprintf() call by prepending the time since command start.
 *
 * @param {string} format
 * @param {any[]} args
 */
const timingLog: LogFunction = (format: string, ...args: any[]): void => {
  const logFormat = "%7s: " + format;
  const logTime = new Date(Date.now() - logT0).getTime();
  const formattedLogTime = (logTime / 1000).toFixed(3);
  args.unshift(formattedLogTime);
  // tslint:disable-next-line:no-console
  console.log(sprintf(logFormat, ...args));
};

/**
 * Active sync wait.
 */
function milliwait(msec: number) {
  const m0 = Date.now();
  while (Date.now() - m0 < msec) {
    // Active loop.
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
function read(file = "random") {
  log("Starting to read");
  // This part is supposed to be performed by a background thread so it should not impact the loop (but it does).
  // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
  const t0 = (hrtime as any).bigint();
  fs.readFile(file, (err: Error, res: Uint8Array) => {
    if (err) {
      throw err;
    }
    // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
    const t1 = (hrtime as any).bigint();
    log(`Read ${res.length} bytes in ${(Number(t1 - t0) / 1E9).toFixed(3)} seconds.`);

    setTimeout(() => {
      // This part does impact the loop, although it does not completely block.
      log("Using encryption");
      const hash = createHash("sha256")
        .update(res)
        .digest("hex");
      log("Encrypted bytes: %d", hash.length);
    }, 2000);
  });
}

/**
 * Use an voluntarily inefficient implementation to lock CPU during the event loop.
 *
 * @param n
 */
function badFibonacci(n: number): number {
  if (n <= 2) {
    return 1;
  }
  return badFibonacci(n - 1) + badFibonacci(n - 2);
}

// ---- Main logic -------------------------------------------------------------
let log: LogFunction = timingLog;
if (argv.length < 2 || argv.length > 3) {
  const path = argv[1].split("/").pop();
  log(`Syntax: ${argv0} ${path} [<use costly ?>]

Without a trueish value for the optional <use costly ?> argument, ${path} will use the cheap method.

In both cases it will read a ./random file, which could be generated using e.g.:
  dd if=/dev/urandom of=random bs=1048576 count=1024`);
  exit(1);
}

log = timingLog;

log(`PID: ${pid}, Loop duration ${CounterBase.LAP} msec.`);
let type = parseInt(argv[2], 10);
if (isNaN(type)) {
  type = 0;
}

let counter: any;

switch (type) {
  default:
    log("Testing with cheap counter");
    (counter = new CheapCounter(true, log)).start();
    setTimeout(read, 3000);
    break;

  case 1:
    log("Testing with costly counter");
    (counter = new CostlyCounter(log)).start();
    setTimeout(read, 3000);
    break;

  case 2:
    log("Testing with NR counter");
    counter = new NrCounter(log);
    counter.start();
    setTimeout(read, 3000);
    setTimeout(() => {
      log("Locking CPU");
      badFibonacci(44);
      log("CPU unlocked");
    }, 12000);
    setInterval(() => {
      log("Max CPU time per tick: %6.2f", counter.counterReset());
    }, 2000);

}

setTimeout(() => {
  log("Exiting");
  exit();
}, 30000);

export {
  milliwait,
  timingLog,
};
