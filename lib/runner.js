"use strict";
/* This file is a dev-only CLI tool: allow console.log */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:no-console */
// NodeJS.
var crypto_1 = require("crypto");
var fs_1 = __importDefault(require("fs"));
var process_1 = require("process");
// Node modules.
var event_loop_stats_1 = require("event-loop-stats");
// Module imports.
var CounterBase_1 = require("./NodeCounter/CounterBase");
var NrCounter_1 = require("./NodeCounter/NrCounter");
var types_1 = require("./types");
// ---- Tools ------------------------------------------------------------------
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
 * Use an voluntarily terrible implementation to lock CPU during the event loop.
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
var log = types_1.timingLog;
if (process_1.argv.length < 2 || process_1.argv.length > 3) {
    var path = process_1.argv[1].split("/").pop();
    log("Syntax: " + process_1.argv0 + " " + path + " [<use collector ?>]\n\nWithout a trueish value for the optional <use collector?> argument, " + path + " will use the ELS collector.\n\nIn both cases it will read a ./random file, which could be generated using e.g.:\n  dd if=/dev/urandom of=random bs=1048576 count=1024");
    process_1.exit(1);
}
log = types_1.timingLog;
log("PID: " + process_1.pid + ", Loop duration " + CounterBase_1.CounterBase.LAP + " msec.");
var type = parseInt(process_1.argv[2], 10);
if (isNaN(type)) {
    type = 0;
}
var counter;
switch (type) {
    default:
        log("Testing with event-loop-stats");
        event_loop_stats_1.sense();
        setInterval(function () { return null; }, 199);
        setInterval(function () { return console.log(event_loop_stats_1.sense()); }, 1000);
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
        break;
}
setTimeout(function () {
    log("Exiting");
    process_1.exit();
}, 30000);
//# sourceMappingURL=runner.js.map