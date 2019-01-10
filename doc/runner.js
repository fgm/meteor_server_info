const fs = require('fs');
const crypto = require('crypto');
const sprintf = require("sprintf-js").sprintf;

const { CheapCounter, CostlyCounter, CounterBase } = require('./algorithms');

// ---- Tools ------------------------------------------------------------------

function log(format, ...args) {
  console.log(sprintf(format, ...args));
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

    // This part does impact the loop, although it does not completely block.
    const hash = crypto.createHash('sha256', "not so secret")
      .update(res)
      .digest('hex');
    console.log("Encrypted bytes: ", hash.length);
  });
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
const cheap = !process.argv[2];
if (cheap) {
  console.log("Testing with cheap counter");
  (new CheapCounter(true, log)).start();
  setTimeout(read, 3000);
} else {
  console.log("Testing with costly counter");
  (new CostlyCounter(log)).start();
  setTimeout(read, 3000);
}
return;

setTimeout(() => {
  process.exit();
}, 12000);
