"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeGcInfo = void 0;
var gc = (require("gc-stats"))();
var sprintf_js_1 = require("sprintf-js");
/**
 * Class GcObserver is the type supporting GC observation via gc-stats.
 */
var GcObserver = /** @class */ (function () {
    function GcObserver() {
        this.prevCurrentMinute = 0.0;
        this.prevMsecMax = 0.0;
        this.prevCallsScavenger = 0;
        this.prevCallsMSC = 0;
        this.prevCallsIncremental = 0;
        this.prevCallsWeakPhantom = 0;
        this.prevMsecScavenger = 0.0;
        this.prevMsecMSC = 0.0;
        this.prevMsecIncremental = 0.0;
        this.prevMsecWeakPhantom = 0.0;
        this.currentMinute = 0.0;
        this.msecMax = 0.0;
        this.callsScavenger = 0;
        this.callsMSC = 0;
        this.callsIncremental = 0;
        this.callsWeakPhantom = 0;
        this.msecScavenger = 0.0;
        this.msecMSC = 0.0;
        this.msecIncremental = 0.0;
        this.msecWeakPhantom = 0.0;
    }
    GcObserver.prototype.getInfo = function () {
        var calls = this.prevCallsScavenger +
            this.prevCallsMSC +
            this.prevCallsIncremental +
            this.prevCallsWeakPhantom;
        var msec = this.prevMsecScavenger +
            this.prevMsecMSC +
            this.prevMsecIncremental +
            this.prevMsecWeakPhantom;
        var info = {
            currentMinute: this.prevCurrentMinute,
            msecPerGcAvg: (calls !== 0) ? msec / calls : 0,
            msecPerGcMax: this.prevMsecMax,
            msecTotal: msec,
            callsIncrementalMarking: this.prevCallsIncremental,
            callsMarkSweepCompactor: this.prevCallsMSC,
            callsScavenger: this.prevCallsScavenger,
            callsWeakPhantomCallbacks: this.prevCallsWeakPhantom,
            msecIncrementalMarking: Math.round(this.prevMsecIncremental),
            msecMarkSweepCompactor: Math.round(this.prevMsecMSC),
            msecScavenger: Math.round(this.prevMsecScavenger),
            msecWeakPhantomCallbacks: Math.round(this.prevMsecWeakPhantom),
        };
        return info;
    };
    GcObserver.prototype.getRunningInfo = function () {
        var calls = this.callsScavenger +
            this.callsMSC +
            this.callsIncremental +
            this.callsWeakPhantom;
        var msec = this.msecScavenger +
            this.msecMSC +
            this.msecIncremental +
            this.msecWeakPhantom;
        var info = {
            currentMinute: this.currentMinute,
            msecPerGcAvg: (calls !== 0) ? msec / calls : 0,
            msecPerGcMax: this.msecMax,
            msecTotal: msec,
            callsIncrementalMarking: this.callsIncremental,
            callsMarkSweepCompactor: this.callsMSC,
            callsScavenger: this.callsScavenger,
            callsWeakPhantomCallbacks: this.callsWeakPhantom,
            msecIncrementalMarking: Math.round(this.msecIncremental),
            msecMarkSweepCompactor: Math.round(this.msecMSC),
            msecScavenger: Math.round(this.msecScavenger),
            msecWeakPhantomCallbacks: Math.round(this.msecWeakPhantom),
        };
        return info;
    };
    GcObserver.prototype.start = function () {
        this.init();
        gc.on("stats", this.handleSample.bind(this));
    };
    GcObserver.prototype.stop = function () {
        gc.removeListener("stats", this.handleSample.bind(this));
        this.init();
    };
    /**
     * Build the timestamp of the beginning of the current minute.
     *
     * JavaScript dates are in milliseconds, so divide by 60*1000 to get the UNIX
     * timestamp of an exact minute, then re-multiply the rounded result to get
     * seconds.
     */
    GcObserver.prototype.getCurrentMinute = function () {
        return Math.floor((+new Date() / 60000)) * 60;
    };
    GcObserver.prototype.init = function () {
        this.prevCurrentMinute = this.currentMinute;
        this.prevMsecMax = this.msecMax;
        this.prevCallsScavenger = this.callsScavenger;
        this.prevCallsMSC = this.callsMSC;
        this.prevCallsIncremental = this.callsIncremental;
        this.prevCallsWeakPhantom = this.callsWeakPhantom;
        this.prevMsecScavenger = this.msecScavenger;
        this.prevMsecMSC = this.msecMSC;
        this.prevMsecIncremental = this.msecIncremental;
        this.prevMsecWeakPhantom = this.msecWeakPhantom;
        this.currentMinute = 0.0;
        this.msecMax = 0.0;
        this.callsScavenger = 0;
        this.callsMSC = 0;
        this.callsIncremental = 0;
        this.callsWeakPhantom = 0;
        this.msecScavenger = 0.0;
        this.msecMSC = 0.0;
        this.msecIncremental = 0.0;
        this.msecWeakPhantom = 0.0;
    };
    /**
     * Extract information from a GC sample and store it on the observer.
     *
     * @param {IInfoData} stats
     *   A stats record as documented on https://github.com/dainis/node-gcstats .
     */
    GcObserver.prototype.handleSample = function (stats) {
        var current = this.getCurrentMinute();
        if (current !== this.currentMinute) {
            this.init();
            this.currentMinute = current;
        }
        // GC pauses are in nanoseconds, convert to milliseconds.
        var pause = stats.pause / 1E6;
        if (pause > this.msecMax) {
            this.msecMax = pause;
        }
        switch (stats.gctype) {
            case 1:
                this.callsScavenger++;
                this.msecScavenger += pause;
                break;
            case 2:
                this.callsMSC++;
                this.msecMSC += pause;
                break;
            case 4:
                this.callsIncremental++;
                this.msecIncremental += pause;
                break;
            case 8:
                this.callsWeakPhantom++;
                this.msecWeakPhantom += pause;
                break;
            default:
                throw new Error(sprintf_js_1.sprintf("Unknown GC type: %d", stats.gctype));
        }
    };
    return GcObserver;
}());
/**
 * Provides the Node.JS-related information: RAM, CPU load.
 */
var NodeGcInfo = /** @class */ (function () {
    /**
     * @constructor
     */
    function NodeGcInfo() {
        this.gcObserver = new GcObserver();
        this.gcObserver.start();
    }
    /**
     * Describe the metrics provided by this service.
     *
     * @return
     *   The description.
     */
    NodeGcInfo.prototype.getDescription = function () {
        var numberTypeName = "number";
        var description = {
            currentMinute: {
                label: "The timestamp of the beginning of the minute during which the measures are taken",
                type: numberTypeName,
            },
            msecPerGcAvg: {
                label: "Average milliseconds per GC operation of any type during the last minute",
                type: numberTypeName,
            },
            msecPerGcMax: {
                label: "Maximum milliseconds per GC operation of any type during the last minute",
                type: numberTypeName,
            },
            msecTotal: {
                label: "Total milliseconds for all types of GC operations during the last minute",
                type: numberTypeName,
            },
            callsIncrementalMarking: {
                label: "Number of calls to the Incremental marker during the last minute",
                type: numberTypeName,
            },
            callsMarkSweepCompactor: {
                label: "Number of calls to the Mark/Sweep/Compact (major) GC during the last minute",
                type: numberTypeName,
            },
            callsScavenger: {
                label: "Number of calls to the Scavenge (minor) GC during the last minute",
                type: numberTypeName,
            },
            callsWeakPhantomCallbacks: {
                label: "Number of calls to Weak/Phantom callbacks during the last minute",
                type: numberTypeName,
            },
            msecIncrementalMarking: {
                label: "Milliseconds spent doing Incremental marking during the last minute",
                type: numberTypeName,
            },
            msecMarkSweepCompactor: {
                label: "Milliseconds spent by the Mark/Sweep/Compactor during the last minute",
                type: numberTypeName,
            },
            msecScavenger: {
                label: "Milliseconds spent by the Scavenger during the last minute",
                type: numberTypeName,
            },
            msecWeakPhantomCallbacks: {
                label: "Milliseconds spent in weak/phantom callbacks during the last minute",
                type: numberTypeName,
            },
        };
        return description;
    };
    /**
     * Get process information about CPU and RAM usage.
     */
    NodeGcInfo.prototype.getInfo = function () {
        return this.gcObserver.getInfo();
    };
    NodeGcInfo.prototype.start = function () {
        this.gcObserver.start();
    };
    /**
     * Stop metrics collection, releasing timers.
     */
    NodeGcInfo.prototype.stop = function () {
        this.gcObserver.stop();
    };
    return NodeGcInfo;
}());
exports.NodeGcInfo = NodeGcInfo;
//# sourceMappingURL=NodeGcInfo.js.map