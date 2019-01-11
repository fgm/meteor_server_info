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
    CounterBase.prototype.start = function () {
        // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
        this.lastNSec = process_1.hrtime.bigint();
        var timer = setInterval(this.watch.bind(this), CounterBase.LAP);
        return timer;
    };
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
        if (log === void 0) { log = nullLogger; }
        var _this = _super.call(this, log) || this;
        _this.log = log;
        _this.immediateTimer = undefined;
        _this.tickCount = 0;
        return _this;
    }
    CostlyCounter.prototype.start = function () {
        _super.prototype.start.call(this);
        // Start the actual counting loop.
        return this.counterImmediate();
    };
    CostlyCounter.prototype.stop = function () {
        if (typeof this.immediateTimer !== "undefined") {
            clearImmediate(this.immediateTimer);
        }
    };
    CostlyCounter.prototype.watch = function () {
        var _a = __read(_super.prototype.watch.call(this), 2), prev = _a[0], nsec = _a[1];
        // The time elapsed since the previous watch() call.
        var actualLapµsec = Number(nsec - prev) / 1E3; // nsed to µsec.
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
}(CounterBase));
exports.CostlyCounter = CostlyCounter;
/**
 *
 * It is cheap because:
 *
 * - it only prevents the CPU optimization in the poll phase from running once
 *   over a number of ticks. With ticks around 1 msec and LAP = 1000, this means
 *   once over 1000 ticks.
 * - its code is cheap and runs only once over 1000 ticks too.
 *
 * On an "Intel(R) Core(TM) i7-3770 CPU @ 3.40GHz", it causes less than 0.5% CPU load.
 */
var CheapCounter = /** @class */ (function (_super) {
    __extends(CheapCounter, _super);
    function CheapCounter(keep, log) {
        if (keep === void 0) { keep = true; }
        if (log === void 0) { log = nullLogger; }
        var _this = _super.call(this, log) || this;
        _this.keep = keep;
        _this.keep = keep;
        return _this;
    }
    CheapCounter.prototype.start = function () {
        var timer = _super.prototype.start.call(this);
        if (!this.keep) {
            // Don't keep the event loop running just for us.
            timer.unref();
        }
        return timer;
    };
    CheapCounter.prototype.watch = function () {
        var _a = __read(_super.prototype.watch.call(this), 2), prev = _a[0], nsec = _a[1];
        var actualLapMsec = Number(nsec - prev) / 1E6;
        var expectedLapMsec = CheapCounter.LAP;
        var diffMsec = Math.max(parseFloat((actualLapMsec - expectedLapMsec).toFixed(2)), 0);
        this.log("msec for polling loop: expected %4d, actual %7d, lag %6.2f", expectedLapMsec, actualLapMsec, diffMsec);
        return [prev, nsec];
    };
    return CheapCounter;
}(CounterBase));
exports.CheapCounter = CheapCounter;
/**
 * This counter attempts to mimic NewRelics "CPU time per tick" metric.
 *
 * It is expensive because:
 *
 * - it prevents the CPU optimization in the poll phase from running because it
 *   sees the "immediate" job queues and does not linger in the poll phase.
 * - its code is cheap but runs on each tick.
 *
 * On an "Intel(R) Core(TM) i7-3770 CPU @ 3.40GHz", it causes about 5% CPU load.
 */
var NrCounter = /** @class */ (function (_super) {
    __extends(NrCounter, _super);
    function NrCounter(log) {
        if (log === void 0) { log = nullLogger; }
        var _this = _super.call(this, log) || this;
        _this.immediateTimer = undefined;
        _this.latestCounterUsage = _this.latestWatchUsage = process_1.cpuUsage();
        _this.maxCpuMsec = 0;
        _this.tickCount = 0;
        return _this;
    }
    /**
     * Resetting max(cpuMsec) and return its value.
     *
     * @return {number}
     *   max(cpuMsecPerTick) since last call to counterReset().
     */
    NrCounter.prototype.counterReset = function () {
        var max = this.maxCpuMsec;
        this.maxCpuMsec = 0;
        return max;
    };
    NrCounter.prototype.start = function () {
        _super.prototype.start.call(this);
        // Initialize selector counters (max/min).
        this.counterReset();
        // Start the actual counting loop.
        return this.counterImmediate();
    };
    NrCounter.prototype.stop = function () {
        if (typeof this.immediateTimer !== "undefined") {
            clearImmediate(this.immediateTimer);
        }
    };
    NrCounter.prototype.watch = function () {
        var _a = __read(_super.prototype.watch.call(this), 2), prev = _a[0], nsec = _a[1];
        var usage = process_1.cpuUsage();
        var _b = process_1.cpuUsage(this.latestWatchUsage), user = _b.user, system = _b.system;
        var cpuMsecSinceLast = (user + system) / 1E3; // µsec to msec.
        // The actual number of loops performed since the previous watch() call.
        // Math.max is used in case this code runs before the loop counter when LAP <= 1 msec.
        var tickCount = Math.max(this.tickCount, 1);
        // The time elapsed since the previous watch() call.
        var clockMsec = Number(nsec - prev) / 1E6; // nsec to msec.
        var ticksPerMin = tickCount / clockMsec * 60 * 1000;
        var cpuMsecPerTick = cpuMsecSinceLast / tickCount;
        this.log("%4d ticks in %4d msec => Ticks/minute: %5d, CPU usage %5d msec => CPU/tick %6.3f msec", tickCount, clockMsec, ticksPerMin, cpuMsecSinceLast, cpuMsecPerTick);
        this.tickCount = 0;
        this.latestWatchUsage = usage;
        return [prev, nsec];
    };
    /**
     * Notice: setTimeout(cb, 0) actually means setTimeout(cb, 1).
     *
     * @see https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args
     *
     * "When delay is [...] less than 1, the delay will be set to 1."
     */
    NrCounter.prototype.counterImmediate = function () {
        return setTimeout(this.counterTimer.bind(this), 0);
    };
    NrCounter.prototype.counterTimer = function () {
        var usage = process_1.cpuUsage();
        var _a = process_1.cpuUsage(this.latestCounterUsage), user = _a.user, system = _a.system;
        var cpuMsecSinceLast = (user + system) / 1E3; // µsec to msec.
        if (cpuMsecSinceLast > this.maxCpuMsec) {
            this.maxCpuMsec = cpuMsecSinceLast;
        }
        this.tickCount++;
        this.immediateTimer = setImmediate(this.counterImmediate.bind(this));
        this.latestCounterUsage = usage;
    };
    return NrCounter;
}(CounterBase));
exports.NrCounter = NrCounter;
//# sourceMappingURL=NodeLoopInfo.js.map