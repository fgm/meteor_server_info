"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The basic metric set type used by IInfoData.
 *
 * @see IInfoData
 */
var sprintf_js_1 = require("sprintf-js");
var logT0 = Date.now();
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
    console.log(sprintf_js_1.sprintf.apply(void 0, [logFormat].concat(args)));
};
exports.timingLog = timingLog;
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
    /**
     * Convert the value to a number of milliseconds.
     */
    NanoTs.prototype.toMsec = function () {
        return this.seconds * 1E3 + this.nanosec / 1E6;
    };
    return NanoTs;
}());
exports.NanoTs = NanoTs;
