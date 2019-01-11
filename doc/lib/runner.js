"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require('fs');
var crypto = require('crypto');
var sprintf = require("sprintf-js").sprintf;
var process_1 = require("process");
var _a = require('./NodeLoopInfo'), CheapCounter = _a.CheapCounter, CostlyCounter = _a.CostlyCounter, CounterBase = _a.CounterBase, NrCounter = _a.NrCounter;
// ---- Tools ------------------------------------------------------------------
var logT0 = Date.now();
function log(format) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var logFormat = "%7s: " + format;
    var logTime = new Date(Date.now() - logT0).getTime();
    var formattedLogTime = (logTime / 1000).toFixed(3);
    args.unshift(formattedLogTime);
    console.log(sprintf.apply(void 0, __spread([logFormat], args)));
}
/**
 * Active sync wait.
 */
function milliwait(msec) {
    var m0 = Date.now();
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
function read(file) {
    if (file === void 0) { file = 'random'; }
    console.log('Starting to read');
    // This part is supposed to be performed by a background thread so it should not impact the loop (but it does).
    // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
    var t0 = process_1.hrtime.bigint();
    fs.readFile(file, function (err, res) {
        if (err) {
            throw err;
        }
        // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
        var t1 = process_1.hrtime.bigint();
        console.log("Read " + res.length + " bytes in " + (Number(t1 - t0) / 1E9).toFixed(3) + " seconds.");
        setTimeout(function () {
            // This part does impact the loop, although it does not completely block.
            console.log("Using encryption");
            var hash = crypto.createHash('sha256', "not so secret")
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
if (process_1.argv.length < 2 || process_1.argv.length > 3) {
    var path = process_1.argv[1].split('/').pop();
    console.log("Syntax: " + process_1.argv0 + " " + path + " [<use costly ?>]\n\nWithout a trueish value for the optional <use costly ?> argument, " + path + " will use the cheap method.\n  \nIn both cases it will read a ./random file, which could be generated using e.g.:\n  dd if=/dev/urandom of=random bs=1048576 count=1024");
    process_1.exit(1);
}
console.log("PID: " + process_1.pid + ", Loop duration " + CounterBase.LAP + " msec.");
var type = parseInt(process_1.argv[2]);
if (isNaN(type)) {
    type = 0;
}
var counter;
switch (type) {
    default:
        console.log("Testing with cheap counter");
        (counter = new CheapCounter(true, log)).start();
        setTimeout(read, 3000);
        break;
    case 1:
        console.log("Testing with costly counter");
        (counter = new CostlyCounter(log)).start();
        setTimeout(read, 3000);
        break;
    case 2:
        console.log("Testing with NR counter");
        counter = new NrCounter(log);
        counter.start();
        setTimeout(read, 3000);
        setTimeout(function () {
            console.log("Locking CPU");
            badFibonacci(44);
            console.log("CPU unlocked");
        }, 12000);
        setInterval(function () {
            log("Max CPU time per tick: %6.2f", counter.counterReset());
        }, 2000);
}
setTimeout(function () {
    console.log("Exiting");
    process_1.exit();
}, 30000);
module.exports = {
    milliwait: milliwait,
};
//# sourceMappingURL=runner.js.map