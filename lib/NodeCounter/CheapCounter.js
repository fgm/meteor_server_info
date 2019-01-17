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
    /**
     * @param keep
     *   Keep the event loop running even if only this counter remains.
     * @param log
     *   A "console.log(sprintf(" compatible function.
     */
    function CheapCounter(keep, log) {
        if (keep === void 0) { keep = true; }
        if (log === void 0) { log = CounterBase_1.nullLogger; }
        var _this = _super.call(this, log) || this;
        _this.keep = keep;
        _this.keep = keep;
        return _this;
    }
    /**
     * @inheritDoc
     */
    CheapCounter.prototype.start = function () {
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
    CheapCounter.prototype.watch = function () {
        var _a = __read(_super.prototype.watch.call(this), 2), prev = _a[0], nsec = _a[1];
        var actualLapMsec = Number(nsec - prev) / 1E6;
        var expectedLapMsec = CheapCounter.LAP;
        var diffMsec = Math.max(parseFloat((actualLapMsec - expectedLapMsec).toFixed(2)), 0);
        this.log("msec for polling loop: expected %4d, actual %7d, lag %6.2f", expectedLapMsec, actualLapMsec, diffMsec);
        return [prev, nsec];
    };
    return CheapCounter;
}(CounterBase_1.CounterBase));
exports.CheapCounter = CheapCounter;
//# sourceMappingURL=CheapCounter.js.map