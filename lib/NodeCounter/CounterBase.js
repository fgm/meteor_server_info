"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("../types");
/**
 * The general logic of counters may imply TWO different looping constructs:
 *
 * - a metrics loop, which generates work values
 * - a polling loop, which gathers current work values and stores them for review
 *
 * In the simple CheapCounter, there is no specific metric loop, but
 * CostlyCounter and NrCounter use a separate metrics "loop" made of alternate
 * setTimeout()/setImmediate() jumps running around the NodeJS event loop.
 */
var CounterBase = /** @class */ (function () {
    /**
     * @param log
     *   A "console.log(sprintf(" compatible function.
     */
    function CounterBase(log) {
        if (log === void 0) { log = types_1.nullLogger; }
        this.log = log;
        this.lastPoll = {};
        // TODO replace by BigInt(0) after Node >= 10.7.
        this.lastNSec = new types_1.NanoTs();
    }
    Object.defineProperty(CounterBase, "LAP", {
        // Polling interval in milliseconds.
        get: function () {
            return 1000;
        },
        enumerable: true,
        configurable: true
    });
    CounterBase.prototype.getInfo = function () {
        return this.getLastPoll();
    };
    CounterBase.prototype.getDescription = function () {
        return {
            lastNSec: { label: "The last time the loop was polled, in nanoseconds", type: "NanoTs" },
        };
    };
    /**
     * @inheritDoc
     */
    CounterBase.prototype.getLastPoll = function () {
        return this.lastPoll;
    };
    /**
     * @inheritDoc
     */
    CounterBase.prototype.setLastPoll = function (info) {
        this.lastPoll = info;
    };
    /**
     * Start the polling loop. Child classes will also start a metric loop.
     *
     * @return Timeout
     *   A timer instance usable with this.stop() to stop collection.
     */
    CounterBase.prototype.start = function () {
        // TODO replace this Node 8 version by the one below after Node >= 10.7.
        this.lastNSec = types_1.NanoTs.forNow();
        /* TODO Node 11.6 version with the next TODO
        // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
        this.lastNSec = (hrtime as any).bigint();
        */
        this.timer = setInterval(this.poll.bind(this), CounterBase.LAP);
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
    CounterBase.prototype.poll = function () {
        var prev = this.lastNSec;
        // TODO replace this Node 8 version by the one below after Node >= 10.7.
        var nsec = types_1.NanoTs.forNow();
        /* TODO Node 11.6 version with the next TODO
        // TODO remove the cast after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30471
        const nsec: bigint = (hrtime as any).bigint() as bigint;
        */
        this.lastNSec = nsec;
        this.setLastPoll({
            lastNSec: nsec,
        });
        return [prev, nsec];
    };
    return CounterBase;
}());
exports.CounterBase = CounterBase;
//# sourceMappingURL=CounterBase.js.map