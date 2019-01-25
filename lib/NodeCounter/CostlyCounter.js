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
var types_1 = require("../types");
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
 */
var CostlyCounter = /** @class */ (function (_super) {
    __extends(CostlyCounter, _super);
    /**
     * @param log
     *   A "console.log(sprintf(" compatible function.
     */
    function CostlyCounter(log) {
        if (log === void 0) { log = types_1.nullLogger; }
        var _this = _super.call(this, log) || this;
        _this.log = log;
        _this.immediateTimer = undefined;
        _this.tickCount = 0;
        return _this;
    }
    /**
     * @inheritDoc
     */
    CostlyCounter.prototype.getDescription = function () {
        var numberTypeName = "number";
        return {
            clockMsec: {
                label: "Milliseconds since last polling",
                type: numberTypeName,
            },
            diffMsec: {
                label: "Difference between actual and expected milliseconds since last polling",
                type: numberTypeName,
            },
            expectedLapMsec: {
                label: "Expected milliseconds since last polling",
                type: numberTypeName,
            },
            individualLapMsec: {
                label: "Average milliseconds per tick since last polling",
                type: numberTypeName,
            },
            lag: {
                label: "Difference between expected and actual tick duration since last polling",
                type: numberTypeName,
            },
            tickCount: {
                label: "Ticks since last polling",
                type: numberTypeName,
            },
            ticksPerSec: {
                label: "Ticks per second",
                type: numberTypeName,
            },
        };
    };
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
     * @inheritDoc
     */
    CostlyCounter.prototype.stop = function () {
        if (typeof this.immediateTimer !== "undefined") {
            clearImmediate(this.immediateTimer);
            this.immediateTimer = undefined;
        }
    };
    /**
     * @inheritDoc
     */
    CostlyCounter.prototype.watch = function () {
        var _a = __read(_super.prototype.watch.call(this), 2), prev = _a[0], nsec = _a[1];
        // The actual number of loops performed since the previous watch() call.
        // Math.max is used in case this code runs before the loop counter when LAP <= 1 msec.
        var tickCount = Math.max(this.tickCount, 1);
        // The time elapsed since the previous watch() call.
        // TODO replace by nsec - nprev after Node >= 10.7
        var clockMsec = nsec.sub(prev).toMsec();
        var ticksPerSec = tickCount / clockMsec * 1000;
        // The time expected to have elapsed since the previous watch() call.
        var expectedLapMsec = CostlyCounter.LAP;
        // The extra delay incurred from expect to actual time elapsed.
        var diffMsec = Math.max(Math.round(clockMsec - expectedLapMsec), 0);
        // The extra time spent per loop.
        var lag = diffMsec / tickCount;
        if (isNaN(lag)) {
            lag = 0;
        }
        var individualLapMsec = Math.round(clockMsec / tickCount);
        this.log("%4d ticks in %4d msec (expected %4d) => Ticks/sec: %5d, diff %3d. Lag per loop: %6.2f, Time per loop: %6d", tickCount, clockMsec, expectedLapMsec, ticksPerSec, diffMsec, lag, individualLapMsec);
        this.tickCount = 0;
        this.setLastPoll({
            clockMsec: clockMsec,
            diffMsec: diffMsec,
            expectedLapMsec: expectedLapMsec,
            individualLapMsec: individualLapMsec,
            lag: lag,
            tickCount: tickCount,
            ticksPerSec: ticksPerSec,
        });
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