"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("process");
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
    function NodeInfo(p, store) {
        this.store = store;
        this.process = p;
        this.info = {
            cpuUser: 0,
            cpuSystem: 0,
            ramExternal: 0,
            ramHeapTotal: 0,
            ramHeapUsed: 0,
            ramRss: 0,
        };
        // Initialize the latestPoll/latestCpu properties.
        this.pollCpuUsage();
    }
    /**
     * Update the CPU reading and return it normalized per second.
     *
     * @returns {{user: number, system: number}}
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
        var reading1 = process.cpuUsage();
        this.store.latestCpu = reading1;
        var result = {
            user: (reading1.user - reading0.user) / tsDiff,
            system: (reading1.system - reading0.system) / tsDiff,
        };
        return result;
    };
    /**
     * Describe the metrics provided by this service.
     *
     * @return {{
     *   nDocuments: {type: string, label: string},
     *   nSessions: {type: string, label: string},
     *   nSubs: {type: string, label: string},
     *   usersWithNSubscriptions: {type: string, label: string}
     * }}
     *  The description.
     */
    NodeInfo.getDescription = function () {
        var description = {
            cpuUser: { type: "int", label: "CPU user seconds since last sample. May be > 1 on multiple cores." },
            cpuSystem: { type: "int", label: "CPU system seconds since last sample. May be > 1 on multiple cores." },
            ramExternal: { type: "int", label: "C++ memory bound to V8 JS objects" },
            ramHeapTotal: { type: "int", label: "V8 Total heap" },
            ramHeapUsed: { type: "int", label: "V8 Used heap" },
            ramRss: {
                type: "int",
                label: "Resident Set Size (heap, code segment, stack)",
            },
        };
        return description;
    };
    /**
     * Get session information.
     *
     * @returns {Object}
     *   - ramRss
     *   - ramHeapTotal
     *   - ramHeapUsed
     *   - ramExternal
     *   - cpuSystem
     *   - cpuUser
     */
    NodeInfo.prototype.getInfo = function () {
        var ram = this.process.memoryUsage();
        var cpu = this.pollCpuUsage();
        var result = {
            cpuUser: cpu.user,
            cpuSystem: cpu.system,
            ramExternal: ram.external,
            ramHeapTotal: ram.heapTotal,
            ramHeapUsed: ram.heapUsed,
            ramRss: ram.rss,
        };
        return result;
    };
    return NodeInfo;
}());
exports.NodeInfo = NodeInfo;
//# sourceMappingURL=NodeInfo.js.map