const fs = require('fs');
const crypto = require('crypto');
const sprintf = require("sprintf-js").sprintf;

const { CheapCounter, CostlyCounter, CounterBase, NrCounter } = require('./algorithms');

// ---- Tools ------------------------------------------------------------------

const logT0 = Date.now();

function log(format, ...args) {
  const logFormat = "%7s: " + format;
  const logTime = new Date(Date.now() - logT0).getTime();
  const formattedLogTime = (logTime / 1000).toFixed(3);
  args.unshift(formattedLogTime);
  console.log(sprintf(logFormat, ...args));
}

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
  const t0 = process.hrtime.bigint();
  fs.readFile(file, (err, res) => {
    if (err) {
      throw new Error(err);
    }
    const t1 = process.hrtime.bigint();
    console.log(`Read ${res.length} bytes in ${(Number(t1 - t0)/1E9).toFixed(3)} seconds.`);

    setTimeout(() => {
      // This part does impact the loop, although it does not completely block.
      console.log("Using encryption");
      const hash = crypto.createHash('sha256', "not so secret")
        .update(res)
        .digest('hex');
      console.log("Encrypted bytes: ", hash.length);
    }, 2000);
  });
}

/**
 * Use an voluntarily inefficient implementation to lock CPU during the event loop.
 *
 * @param n
 */
function badFibonacci(n) {
  if (n <= 2) {
    return 1;
  }
  return badFibonacci(n - 1) + badFibonacci(n - 2);
}

// ---- Main logic -------------------------------------------------------------
if (process.argv.length < 2 || process.argv.length > 3) {
  path = process.argv[1].split('/').pop();
  console.log(`Syntax: ${process.argv0} ${path} [<use costly ?>]

Without a trueish value for the optional <use costly ?> argument, ${path} will use the cheap method.
  
In both cases it will read a ./random file, which could be generated using e.g.:
  dd if=/dev/urandom of=random bs=1048576 count=1024`);
  return;
}

console.log(`PID: ${process.pid}, Loop duration ${CounterBase.LAP} msec.`);
let type = parseInt(process.argv[2]);
if (isNaN(type)) {
  type = 0;
}

switch (type) {
  default:
    console.log("Testing with cheap counter");
    (new CheapCounter(true, log)).start();
    setTimeout(read, 3000);
    break;
  case 1:
    console.log("Testing with costly counter");
    (new CostlyCounter(log)).start();
    setTimeout(read, 3000);
  case 2:
    console.log("Testing with NR counter");
    (new NrCounter(log)).start();
    setTimeout(read, 3000);
    setTimeout(() => {
      console.log("Locking CPU");
      badFibonacci(44);
      console.log("CPU unlocked");
    }, 12000);
}

setTimeout(() => {
  console.log("Exiting");
  process.exit();
}, 20000);
