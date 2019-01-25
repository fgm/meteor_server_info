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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var types_1 = require("../types");
var CounterBase_1 = require("./CounterBase");
/**
 * This counter attempts to mimic NewRelic's "CPU time per tick" metric.
 *
 * It is expensive because:
 *
 * - it prevents the CPU optimization in the poll phase from running because it
 *   sees the "immediate" job queues and does not linger in the poll phase.
 * - its code is cheap but runs on each tick.
 *
 * On an "Intel(R) Core(TM) i7-3770 CPU @ 3.40GHz", it causes about 6% CPU load.
 */
var NrCounter = /** @class */ (function (_super) {
    __extends(NrCounter, _super);
    /**
     * @param log
     *   A "console.log(sprintf(" compatible function.
     */
    function NrCounter(log) {
        if (log === void 0) { log = types_1.nullLogger; }
        var _this = _super.call(this, log) || this;
        _this.log = log;
        _this.immediateTimer = undefined;
        _this.latestCounterUsage = _this.latestWatchUsage = process_1.cpuUsage();
        _this.cpuMsecMax = 0;
        _this.tickCount = 0;
        return _this;
    }
    /**
     * Resetting max(cpuMsec) and return its value.
     *
     * This method is only public for tests: it is not meant for external use.
     *
     * @return {number}
     *   max(cpuMsecPerTick) since last call to counterReset().
     */
    NrCounter.prototype.counterReset = function () {
        var max = this.cpuMsecMax;
        this.cpuMsecMax = 0;
        return max;
    };
    /**
     * @inheritDoc
     */
    NrCounter.prototype.getDescription = function () {
        var numberTypeName = "number";
        return {
            clockMsec: {
                label: "Milliseconds since last polling",
                type: numberTypeName,
            },
            cpuMsec: {
                label: "CPU milliseconds used by process since last polling.",
                type: numberTypeName,
            },
            cpuMsecMax: {
                label: "Maximum of CPU milliseconds used by process since last fetch of the same counter, not last polling",
                type: numberTypeName,
            },
            cpuMsecPerTick: {
                label: "Average CPU milliseconds used by process per tick since last polling",
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
     * @inheritDoc
     */
    NrCounter.prototype.getLastPoll = function () {
        return __assign({}, this.lastPoll, { 
            // cpuMsecMax is collected in real time, not by polling.
            cpuMsecMax: this.counterReset() });
    };
    /**
     * Start the metric collection.
     *
     * @return
     *   A timer instance usable with this.stop() to stop collection.
     */
    NrCounter.prototype.start = function () {
        _super.prototype.start.call(this);
        // Initialize selector counters (max/min).
        this.counterReset();
        // Start the actual counting loop.
        return this.counterImmediate();
    };
    /**
     * @inheritDoc
     */
    NrCounter.prototype.stop = function () {
        if (typeof this.immediateTimer !== "undefined") {
            clearImmediate(this.immediateTimer);
            this.immediateTimer = undefined;
        }
    };
    /**
     * @inheritDoc
     */
    NrCounter.prototype.watch = function () {
        var _a = __read(_super.prototype.watch.call(this), 2), prev = _a[0], nsec = _a[1];
        var usage = process_1.cpuUsage();
        var _b = process_1.cpuUsage(this.latestWatchUsage), user = _b.user, system = _b.system;
        var cpuMsecSinceLast = (user + system) / 1E3; // µsec to msec.
        // The actual number of loops performed since the previous watch() call.
        // Math.max is used in case this code runs before the loop counter when LAP <= 1 msec.
        var tickCount = Math.max(this.tickCount, 1);
        // The time elapsed since the previous watch() call.
        // TODO replace by nsec - nprev after Node >= 10.7
        var clockMsec = nsec.sub(prev).toMsec();
        var ticksPerSec = tickCount / clockMsec * 1000;
        var cpuMsecPerTick = cpuMsecSinceLast / tickCount;
        this.log("%4d ticks in %4d msec => Ticks/sec: %5d, CPU usage %5d msec => CPU/tick %6.3f msec", tickCount, clockMsec, ticksPerSec, cpuMsecSinceLast, cpuMsecPerTick);
        this.tickCount = 0;
        this.latestWatchUsage = usage;
        this.setLastPoll({
            clockMsec: clockMsec,
            cpuMsecPerTick: cpuMsecPerTick,
            cpuMsecSinceLast: cpuMsecSinceLast,
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
    NrCounter.prototype.counterImmediate = function () {
        return setTimeout(this.counterTimer.bind(this), 0);
    };
    NrCounter.prototype.counterTimer = function () {
        var usage = process_1.cpuUsage();
        var _a = process_1.cpuUsage(this.latestCounterUsage), user = _a.user, system = _a.system;
        var cpuMsecSinceLast = (user + system) / 1E3; // µsec to msec.
        if (cpuMsecSinceLast > this.cpuMsecMax) {
            this.cpuMsecMax = cpuMsecSinceLast;
        }
        this.tickCount++;
        this.immediateTimer = setImmediate(this.counterImmediate.bind(this));
        this.latestCounterUsage = usage;
    };
    return NrCounter;
}(CounterBase_1.CounterBase));
exports.NrCounter = NrCounter;
//# sourceMappingURL=NrCounter.js.map