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
var event_loop_stats_1 = require("event-loop-stats");
var types_1 = require("../types");
var CounterBase_1 = require("./CounterBase");
console.log("sense", event_loop_stats_1.sense);
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
            maxLoopDelay: {
                label: "Maximum main loop duration, in msec.",
                type: numberTypeName,
            },
            minLoopDelay: {
                label: "Minimum main loop duration, in msec.",
                type: numberTypeName,
            },
            numLoopDelay: {
                label: "Number of main loop iterations.",
                type: numberTypeName,
            },
            sumLoopDelay: {
                label: "Total main loop delay, in msec.",
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
        if (!this.keep) {
            // Don't keep the event loop running just for us.
            timer.unref();
        }
        return timer;
    };
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
        this.setLastPoll(__assign({ loopDelay: actualLapNanoTs }, sensed));
        return [prev, nsec];
    };
    return ElsCounter;
}(CounterBase_1.CounterBase));
exports.ElsCounter = ElsCounter;
//# sourceMappingURL=ElsCounter.js.map