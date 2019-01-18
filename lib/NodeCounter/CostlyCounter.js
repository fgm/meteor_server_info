"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
var CounterBase_1 = require("./CounterBase");
/**
 * This counter actually counts ticks by jumping to and fro the loop phases.
 *
 * It is expensive because:
 *
 * - it prevents the CPU optimization in the poll phase from running because it
 *   sees the "immediate" job queues and does not linger in the poll phase.
 * - its code is cheap but runs on each tick.
 *
 * On an "Intel(R) Core(TM) i7-3770 CPU @ 3.40GHz", it causes about 5% CPU load.
 *
 */
var CostlyCounter = /** @class */ (function (_super) {
    __extends(CostlyCounter, _super);
    /**
     * @param log
     *   A "console.log(sprintf(" compatible function.
     */
    function CostlyCounter(log) {
        if (log === void 0) { log = CounterBase_1.nullLogger; }
        var _this = _super.call(this, log) || this;
        _this.log = log;
        _this.immediateTimer = undefined;
        _this.tickCount = 0;
        return _this;
    }
    /**
     * Start the metric collection.
     *
     * @return
     *   A timer instance usable with this.stop() to stop collection.
     */
    CostlyCounter.prototype.start = function () {
        _super.prototype.start.call(this);
        // Start the actual counting loop.
        return this.counterImmediate();
    };
    /**
     * Stop metrics collection.
     */
    CostlyCounter.prototype.stop = function () {
        if (typeof this.immediateTimer !== "undefined") {
            clearImmediate(this.immediateTimer);
        }
    };
    CostlyCounter.prototype.watch = function () {
        var _a = __read(_super.prototype.watch.call(this), 2), prev = _a[0], nsec = _a[1];
        // The time elapsed since the previous watch() call.
        // TODO replace by nsec - nprev after Node >= 10.7
        var actualLapµsec = Number(nsec.sub(prev)) / 1E3; // nsed to µsec.
        // The time expected to have elapsed since the previous watch() call.
        var expectedLapµsec = CostlyCounter.LAP * 1E3; // msec to µsec.
        // The extra delay incurred from expect to actual time elapsed.
        var diffµsec = Math.max(Math.round(actualLapµsec - expectedLapµsec), 0);
        // The actual number of loops performed since the previous watch() call.
        // Math.max is used in case this code runs before the loop counter when LAP <= 1 msec.
        var effectiveLoopCount = Math.max(this.tickCount, 1);
        // The extra time spent per loop.
        var lag = diffµsec / effectiveLoopCount;
        if (isNaN(lag)) {
            lag = 0;
        }
        var invidualLapµsec = Math.round(actualLapµsec / effectiveLoopCount);
        this.log("µsec for %4d loops: expected %7d, actual %7d, diff %6d. Lag per loop: %6.2f, Time per loop: %6d", effectiveLoopCount, expectedLapµsec, actualLapµsec, diffµsec, lag, invidualLapµsec);
        this.tickCount = 0;
        return [prev, nsec];
    };
    /**
     * Notice: setTimeout(cb, 0) actually means setTimeout(cb, 1).
     *
     * @see https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args
     *
     * "When delay is [...] less than 1, the delay will be set to 1."
     */
    CostlyCounter.prototype.counterImmediate = function () {
        return setTimeout(this.counterTimer.bind(this), 0);
    };
    CostlyCounter.prototype.counterTimer = function () {
        this.tickCount++;
        this.immediateTimer = setImmediate(this.counterImmediate.bind(this));
    };
    return CostlyCounter;
}(CounterBase_1.CounterBase));
exports.CostlyCounter = CostlyCounter;
//# sourceMappingURL=CostlyCounter.js.map