"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var process_1 = require("process");
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
        this.lastNSec = BigInt(0);
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
        // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
        this.lastNSec = process_1.hrtime.bigint();
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
        // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
        var nsec = process_1.hrtime.bigint();
        this.lastNSec = nsec;
        return [prev, nsec];
    };
    return CounterBase;
}());
exports.CounterBase = CounterBase;
//# sourceMappingURL=CounterBase.js.map