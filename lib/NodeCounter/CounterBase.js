"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var process_1 = require("process");
/**
 * The result of a watch() iteration: a previous/current pair of nanotimestamps.
 *
 * It can only represent positive durations.
 *
 * TODO Remove this workaround workaround after Node >= 10.7 with bigint.
 */
var NanoTs = /** @class */ (function () {
    /**
     * Ensures normalize values: only positive integers, nanosec < 1E9.
     *
     * Converts extra nsec to extra seconds if needed.
     *
     * @param seconds
     * @param nanosec
     */
    function NanoTs(seconds, nanosec) {
        if (seconds === void 0) { seconds = 0; }
        if (nanosec === void 0) { nanosec = 0; }
        this.seconds = seconds;
        this.nanosec = nanosec;
        // Ensure integer values to avoid float rounding issues.
        this.seconds = Math.trunc(Math.abs(seconds));
        this.nanosec = Math.trunc(Math.abs(nanosec));
        if (this.nanosec > 1E9) {
            var remainder = this.nanosec % 1E9;
            this.seconds += (this.nanosec - remainder / 1E9);
            this.nanosec = remainder;
        }
    }
    /**
     * Subtract a *smaller* NanoTs from a larger one.
     *
     * @param other
     *
     * @throws Error
     *   In case of data corruption, or if the other value is larger than the instance.
     */
    NanoTs.prototype.sub = function (other) {
        var ndiff = this.nanosec - other.nanosec;
        if (Math.abs(ndiff) >= 1E9) {
            throw new Error("Data corruption detected: 0 <= nsec <= 1E9, so nsec diff cannot be >= 1E9");
        }
        var sdiff = this.seconds - other.seconds;
        if (Math.abs(sdiff) > 1E21) {
            throw new Error("ECMA-262 only guarantees 21 digits of accuracy, cannot subtract accurately");
        }
        if (sdiff < 0) {
            throw new Error("Subtracted value is larger than base value: result would be negative.");
        }
        if (ndiff < 0) {
            // -1E9 <= ndiff < 0 by construction, so just add 1 sec:
            // sdiff > 0 and sdiff integer => sdiff - 1 >= 0.
            sdiff -= 1;
            ndiff += 1E9;
        }
        return new NanoTs(sdiff, ndiff);
    };
    return NanoTs;
}());
/**
 * nullLogger is a silent logger usable by Counter classes.
 *
 * @param {string}_format
 * @param {any[]} _args
 */
var nullLogger = function (_format) {
    var _args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        _args[_i - 1] = arguments[_i];
    }
    return;
};
exports.nullLogger = nullLogger;
var CounterBase = /** @class */ (function () {
    /**
     * @param log
     *   A "console.log(sprintf(" compatible function.
     */
    function CounterBase(log) {
        if (log === void 0) { log = nullLogger; }
        this.log = log;
        // TODO replace by BigInt(0) after Node >= 10.7.
        this.lastNSec = new NanoTs();
    }
    Object.defineProperty(CounterBase, "LAP", {
        // Polling interval in milliseconds.
        get: function () {
            return 1000;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Start the metric collection.
     *
     * @return Timeout
     *   A timer instance usable with this.stop() to stop collection.
     */
    CounterBase.prototype.start = function () {
        // TODO replace this Node 8 version by the one below after Node >= 10.7.
        var hrt = process_1.hrtime();
        this.lastNSec = new NanoTs(hrt[0], hrt[1]);
        /* TODO Node 11.6 version with the next TODO
        // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
        this.lastNSec = (hrtime as any).bigint();
        */
        this.timer = setInterval(this.watch.bind(this), CounterBase.LAP);
        return this.timer;
    };
    /**
     * Stop metrics collection. Idempotent, won't error.
     */
    CounterBase.prototype.stop = function () {
        if (typeof this.timer !== "undefined") {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    };
    /**
     * Observe the current metrics value and update last nanotimestamp.
     */
    CounterBase.prototype.watch = function () {
        var prev = this.lastNSec;
        // TODO replace this Node 8 version by the one below after Node >= 10.7.
        var hrt = process_1.hrtime();
        var nsec = new NanoTs(hrt[0], hrt[1]);
        /* TODO Node 11.6 version with the next TODO
        // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
        const nsec: bigint = (hrtime as any).bigint() as bigint;
        */
        this.lastNSec = nsec;
        return [prev, nsec];
    };
    return CounterBase;
}());
exports.CounterBase = CounterBase;
//# sourceMappingURL=CounterBase.js.map