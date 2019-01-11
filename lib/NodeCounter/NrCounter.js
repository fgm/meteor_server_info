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
var CounterBase_1 = require("./CounterBase");
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
        if (log === void 0) { log = CounterBase_1.nullLogger; }
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
}(CounterBase_1.CounterBase));
exports.NrCounter = NrCounter;
//# sourceMappingURL=NrCounter.js.map