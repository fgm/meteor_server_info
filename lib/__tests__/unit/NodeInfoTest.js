"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("process");
var NodeInfo_1 = require("../../src/NodeInfo");
var MockCounter = /** @class */ (function () {
    function MockCounter() {
        this.started = false;
        this.info = {};
    }
    MockCounter.prototype.getDescription = function () {
        return {};
    };
    MockCounter.prototype.getLastPoll = function () {
        return this.info;
    };
    MockCounter.prototype.setLastPoll = function (info) {
        this.info = info;
    };
    MockCounter.prototype.start = function () {
        this.started = true;
        var timeout = setTimeout(function () { }, 0);
        clearTimeout(timeout);
        return timeout;
    };
    MockCounter.prototype.stop = function () {
        this.started = false;
    };
    return MockCounter;
}());
/**
 * These tests run on node 8.4, to process.hrtime.bigint() is not available yet.
 */
function testNodeInfo() {
    function getTestingNodeCollector(counter) {
        var mockProcess = {
            _cpu: {
                system: 1,
                user: 2,
            },
            _memory: {
                external: 3,
                heapTotal: 4,
                heapUsed: 5,
                rss: 6,
            },
            cpuUsage: function () {
                return this._cpu;
            },
            memoryUsage: function () {
                return this._memory;
            },
            hrtime: process.hrtime,
        };
        return new NodeInfo_1.NodeInfo(mockProcess, counter);
    }
    test("constructor initializes CPU usage", function () {
        var t0 = process.hrtime();
        var collector = getTestingNodeCollector();
        var t1 = process.hrtime(t0);
        var info = collector.getInfo();
        expect(t1[0]).toBeGreaterThanOrEqual(0);
        expect(t1[1]).toBeGreaterThan(0);
        expect(info.cpuSystem).toBe(0);
        expect(info.cpuUser).toBe(0);
        collector.stop();
    });
    test("CPU usage is not empty", function (done) {
        var collector = new NodeInfo_1.NodeInfo(process);
        // Prime CPU store.
        collector.getInfo();
        var t0 = process.hrtime();
        // Eat CPU, don't let system use it.
        for (var i = 0; i < 1E7; i++) {
            i++;
        }
        setImmediate(function () {
            var t1 = process.hrtime(t0);
            // Convert hrtime from tuple to seconds to compare with CPU usage.
            var lag = t1[0] + t1[1] / 1E9;
            var info = collector.getInfo();
            expect(info.cpuSystem).toBeGreaterThanOrEqual(0);
            expect(info.cpuSystem).toBeLessThan(1);
            expect(info.cpuUser).toBeGreaterThan(lag);
            collector.stop();
            done();
        });
    });
    test("All CPU usage information is documented without a counter", function () {
        var e_1, _a;
        var collector = getTestingNodeCollector();
        var info = collector.getInfo();
        var descriptions = collector.getDescription();
        var keys = Object.keys(info);
        expect(keys.length).toBeGreaterThan(0);
        try {
            for (var keys_1 = __values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
                var key = keys_1_1.value;
                var description = descriptions[key];
                expect(description).toBeDefined();
                expect(description).toHaveProperty("type");
                expect(description).toHaveProperty("label");
                expect(description.label.length).toBeGreaterThan(0);
                expect(typeof info[key]).toBe(description.type);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (keys_1_1 && !keys_1_1.done && (_a = keys_1.return)) _a.call(keys_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        collector.stop();
    });
    test("All CPU usage information is documented with a counter", function () {
        var e_2, _a;
        var collector = getTestingNodeCollector(new MockCounter());
        var info = collector.getInfo();
        var descriptions = collector.getDescription();
        var keys = Object.keys(info);
        expect(keys.length).toBeGreaterThan(0);
        try {
            for (var keys_2 = __values(keys), keys_2_1 = keys_2.next(); !keys_2_1.done; keys_2_1 = keys_2.next()) {
                var key = keys_2_1.value;
                var description = descriptions[key];
                expect(description).toBeDefined();
                expect(description).toHaveProperty("type");
                expect(description).toHaveProperty("label");
                expect(description.label.length).toBeGreaterThan(0);
                expect(typeof info[key]).toBe(description.type);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (keys_2_1 && !keys_2_1.done && (_a = keys_2.return)) _a.call(keys_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        collector.stop();
    });
    test("counters are started and stopped", function () {
        var counter = new MockCounter();
        var collector = getTestingNodeCollector(counter);
        expect(counter.started).toBeTruthy();
        collector.stop();
        expect(counter.started).toBeFalsy();
    });
}
exports.testNodeInfo = testNodeInfo;
//# sourceMappingURL=NodeInfoTest.js.map