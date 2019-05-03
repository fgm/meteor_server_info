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
var event_loop_stats_1 = require("event-loop-stats");
var types_1 = require("../types");
var CounterBase_1 = require("./CounterBase");
// The busterTimer interval.
var BUSTER_LAP = 100;
/**
 *
 * Based on the native libuv hook usage in event-loop-stats.
 */
var ElsCounter = /** @class */ (function (_super) {
    __extends(ElsCounter, _super);
    /**
     * @param keep
     *   Keep the event loop running even if only this counter remains.
     * @param log
     *   A "console.log(sprintf(" compatible function.
     */
    function ElsCounter(keep, log) {
        if (keep === void 0) { keep = true; }
        if (log === void 0) { log = types_1.nullLogger; }
        var _this = _super.call(this, log) || this;
        _this.keep = keep;
        _this.keep = keep;
        return _this;
    }
    /**
     * @inheritDoc
     */
    ElsCounter.prototype.getDescription = function () {
        var numberTypeName = "number";
        var description = {
            loopDelay: {
                label: "Estimated current average event main loop duration, in msec.",
                type: numberTypeName,
            },
            loopDelayCount: {
                label: "Number of main loop iterations since last fetch, from ELS.",
                type: numberTypeName,
            },
            loopDelayMaxMsec: {
                label: "Maximum main loop duration, in msec since last fetch, from ELS.",
                type: numberTypeName,
            },
            loopDelayMinMsec: {
                label: "Minimum main loop duration, in msec since last fetch, from ELS.",
                type: numberTypeName,
            },
            loopDelayTotalMsec: {
                label: "Total main loop delay, in msec since last fetch, from ELS.",
                type: numberTypeName,
            },
        };
        return description;
    };
    /**
     * @inheritDoc
     */
    ElsCounter.prototype.getInfo = function () {
        return this.getLastPoll();
    };
    /**
     * @inheritDoc
     */
    ElsCounter.prototype.start = function () {
        var timer = _super.prototype.start.call(this);
        this.busterTimer = setInterval(this.bustOptimizations.bind(this), BUSTER_LAP);
        if (!this.keep) {
            // Don't keep the event loop running just for us.
            timer.unref();
            this.busterTimer.unref();
        }
        return timer;
    };
    /**
     * Stop metrics collection. Idempotent, won't error.
     */
    ElsCounter.prototype.stop = function () {
        if (typeof this.busterTimer !== "undefined") {
            clearTimeout(this.busterTimer);
            this.busterTimer = undefined;
        }
        _super.prototype.stop.call(this);
    };
    /**
     * Do nothing, but exist just to force the event loop to work.
     *
     * @see ElsCounter.start()
     */
    ElsCounter.prototype.bustOptimizations = function () { };
    /**
     * @inheritDoc
     */
    ElsCounter.prototype.poll = function () {
        var sensed = event_loop_stats_1.sense();
        var _a = __read(_super.prototype.poll.call(this), 2), prev = _a[0], nsec = _a[1];
        var actualLapNanoTs = nsec.sub(prev);
        // TODO Convert to nsec - prev after Node >= 10.7.
        var actualLapMsec = actualLapNanoTs.toMsec();
        var expectedLapMsec = ElsCounter.LAP;
        var diffMsec = Math.max(parseFloat((actualLapMsec - expectedLapMsec).toFixed(2)), 0);
        this.log("msec for polling loop: expected %4d, actual %7d, lag %6.2f", expectedLapMsec, actualLapMsec, diffMsec);
        this.setLastPoll({
            loopDelay: actualLapNanoTs,
            loopDelayCount: sensed.num,
            loopDelayMaxMsec: sensed.max,
            loopDelayMinMsec: sensed.min,
            loopDelayTotalMsec: sensed.sum,
        });
        return [prev, nsec];
    };
    return ElsCounter;
}(CounterBase_1.CounterBase));
exports.ElsCounter = ElsCounter;
//# sourceMappingURL=ElsCounter.js.map