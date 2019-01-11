"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Provides the Node.JS-related information: RAM, CPU load.
 */
var NodeInfo = /** @class */ (function () {
    /**
     * @param process
     *   The NodeJS process module or a stub for it.
     * @param store
     *   An object in which to store information between instance creations.
     *
     * @constructor
     */
    function NodeInfo(process, store) {
        this.process = process;
        this.store = store;
        this.info = {
            cpuSystem: 0,
            cpuUser: 0,
            loopDelay: 0,
            ramExternal: 0,
            ramHeapTotal: 0,
            ramHeapUsed: 0,
            ramRss: 0,
        };
        // Initialize the latestPoll/latestCpu properties.
        this.pollCpuUsage();
        this.startEventLoopObserver();
    }
    /**
     * Describe the metrics provided by this service.
     *
     * @return
     *   The description.
     */
    NodeInfo.prototype.getDescription = function () {
        var numberTypeName = "number";
        var description = {
            cpuSystem: {
                label: "CPU system seconds since last sample. May be > 1 on multiple cores.",
                type: numberTypeName,
            },
            cpuUser: {
                label: "CPU user seconds since last sample. May be > 1 on multiple cores.",
                type: numberTypeName,
            },
            loopDelay: {
                label: "The delay of the Node.JS event loop",
                type: numberTypeName,
            },
            ramExternal: {
                label: "C++ memory bound to V8 JS objects",
                type: numberTypeName,
            },
            ramHeapTotal: {
                label: "V8 Total heap",
                type: numberTypeName,
            },
            ramHeapUsed: {
                label: "V8 Used heap",
                type: numberTypeName,
            },
            ramRss: {
                label: "Resident Set Size (heap, code segment, stack)",
                type: numberTypeName,
            },
        };
        return description;
    };
    /**
     * Get process information about CPU and RAM usage.
     */
    NodeInfo.prototype.getInfo = function () {
        var ram = this.process.memoryUsage();
        var cpu = this.pollCpuUsage();
        var result = {
            cpuSystem: cpu.system,
            cpuUser: cpu.user,
            loopDelay: this.pollLoop(),
            ramExternal: ram.external,
            ramHeapTotal: ram.heapTotal,
            ramHeapUsed: ram.heapUsed,
            ramRss: ram.rss,
        };
        return result;
    };
    /**
     * Update the CPU reading and return it normalized per second.
     *
     * @return
     *   The normalized time spent since last polling.
     */
    NodeInfo.prototype.pollCpuUsage = function () {
        // Date is in msec, cpuUsage is in µsec.
        var ts1 = +new Date() * 1E3;
        var ts0 = this.store.latestPoll || 0;
        // Although Date has msec resolution, in practice, getting identical dates
        // happens easily, so fake an actual millisecond different if the diff is 0,
        // to avoid infinite normalized CPU usage. 1E3 from msec to µsec.
        var tsDiff = (ts1 - ts0) || 1E3;
        this.store.latestPoll = ts1;
        var reading0 = this.store.latestCpu || { user: 0, system: 0 };
        var reading1 = this.process.cpuUsage();
        this.store.latestCpu = reading1;
        var result = {
            system: (reading1.system - reading0.system) / tsDiff,
            user: (reading1.user - reading0.user) / tsDiff,
        };
        return result;
    };
    NodeInfo.prototype.pollLoop = function () {
        return this.store.latestDelay;
    };
    /**
     * Inspired by https://github.com/keymetrics/pmx
     *
     * @see https://github.com/keymetrics/pmx/blob/master/lib/probes/loop_delay.js
     *
     * Used under its MIT license, per pmx README.md
     */
    NodeInfo.prototype.startEventLoopObserver = function () {
        var _this = this;
        if (typeof (this.store.latestTime) === "undefined") {
            this.store.latestTime = process.hrtime();
        }
        setInterval(function () {
            var newTime = process.hrtime();
            var delay = (newTime[0] - _this.store.latestTime[0]) * 1E3 +
                (newTime[1] - _this.store.latestTime[1]) / 1e6 -
                NodeInfo.EVENT_LOOP_INTERVAL;
            _this.store.latestTime = newTime;
            _this.store.latestDelay = delay;
            // tslint:disable-next-line:no-console
            console.log("Delay: ", Number(delay).toFixed(2));
        }, NodeInfo.EVENT_LOOP_INTERVAL);
    };
    /**
     * The interval at which the event loop delay is measured, in milliseconds.
     *
     * This spreads over multiple ticks of the loop to limit measurement costs.
     */
    NodeInfo.EVENT_LOOP_INTERVAL = 10000;
    return NodeInfo;
}());
exports.NodeInfo = NodeInfo;
//# sourceMappingURL=NodeInfo.js.map