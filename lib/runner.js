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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = require("crypto");
var fs_1 = __importDefault(require("fs"));
var sprintf_js_1 = require("sprintf-js");
var process_1 = require("process");
var CheapCounter_1 = require("./NodeCounter/CheapCounter");
var CostlyCounter_1 = require("./NodeCounter/CostlyCounter");
var CounterBase_1 = require("./NodeCounter/CounterBase");
var NrCounter_1 = require("./NodeCounter/NrCounter");
// ---- Tools ------------------------------------------------------------------
var logT0 = Date.now();
/**
 * timingLog wraps a sprintf() call by prepending the time since command start.
 *
 * @param {string} format
 * @param {any[]} args
 */
var timingLog = function (format) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var logFormat = "%7s: " + format;
    var logTime = new Date(Date.now() - logT0).getTime();
    var formattedLogTime = (logTime / 1000).toFixed(3);
    args.unshift(formattedLogTime);
    // tslint:disable-next-line:no-console
    console.log(sprintf_js_1.sprintf.apply(void 0, __spread([logFormat], args)));
};
exports.timingLog = timingLog;
/**
 * Active sync wait.
 */
function milliwait(msec) {
    var m0 = Date.now();
    while (Date.now() - m0 < msec) {
        // Active loop.
    }
}
exports.milliwait = milliwait;
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
    if (file === void 0) { file = "random"; }
    log("Starting to read");
    // This part is supposed to be performed by a background thread so it should not impact the loop (but it does).
    // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
    var t0 = process_1.hrtime.bigint();
    fs_1.default.readFile(file, function (err, res) {
        if (err) {
            throw err;
        }
        // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
        var t1 = process_1.hrtime.bigint();
        log("Read " + res.length + " bytes in " + (Number(t1 - t0) / 1E9).toFixed(3) + " seconds.");
        setTimeout(function () {
            // This part does impact the loop, although it does not completely block.
            log("Using encryption");
            var hash = crypto_1.createHash("sha256")
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
function badFibonacci(n) {
    if (n <= 2) {
        return 1;
    }
    return badFibonacci(n - 1) + badFibonacci(n - 2);
}
// ---- Main logic -------------------------------------------------------------
var log = timingLog;
if (process_1.argv.length < 2 || process_1.argv.length > 3) {
    var path = process_1.argv[1].split("/").pop();
    log("Syntax: " + process_1.argv0 + " " + path + " [<use costly ?>]\n\nWithout a trueish value for the optional <use costly ?> argument, " + path + " will use the cheap method.\n\nIn both cases it will read a ./random file, which could be generated using e.g.:\n  dd if=/dev/urandom of=random bs=1048576 count=1024");
    process_1.exit(1);
}
log = timingLog;
log("PID: " + process_1.pid + ", Loop duration " + CounterBase_1.CounterBase.LAP + " msec.");
var type = parseInt(process_1.argv[2], 10);
if (isNaN(type)) {
    type = 0;
}
var counter;
switch (type) {
    default:
        log("Testing with cheap counter");
        (counter = new CheapCounter_1.CheapCounter(true, log)).start();
        setTimeout(read, 3000);
        break;
    case 1:
        log("Testing with costly counter");
        (counter = new CostlyCounter_1.CostlyCounter(log)).start();
        setTimeout(read, 3000);
        break;
    case 2:
        log("Testing with NR counter");
        counter = new NrCounter_1.NrCounter(log);
        counter.start();
        setTimeout(read, 3000);
        setTimeout(function () {
            log("Locking CPU");
            badFibonacci(44);
            log("CPU unlocked");
        }, 12000);
        setInterval(function () {
            log("Max CPU time per tick: %6.2f", counter.counterReset());
        }, 2000);
}
setTimeout(function () {
    log("Exiting");
    process_1.exit();
}, 30000);
//# sourceMappingURL=runner.js.map