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
var NrCounter_1 = require("../../src/NodeCounter/NrCounter");
var types_1 = require("../../src/types");
/**
 * These tests run on node 8.4, to process.hrtime.bigint() is not available yet.
 */
function testNrCounter() {
    function getTestingNrCounter() {
        return new NrCounter_1.NrCounter(types_1.nullLogger);
    }
    test("All NrCounter information is documented", function () {
        var e_1, _a;
        var counter = getTestingNrCounter();
        // Force counter to store metrics without triggering the asynchronous behaviour.
        counter.counterReset();
        counter.poll();
        var metrics = counter.getLastPoll();
        var descriptions = counter.getDescription();
        var keys = Object.keys(metrics);
        expect(keys.length).toBeGreaterThan(0);
        try {
            for (var keys_1 = __values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
                var key = keys_1_1.value;
                var description = descriptions[key];
                expect(description).toBeDefined();
                expect(description).toHaveProperty("type");
                expect(description).toHaveProperty("label");
                expect(description.label.length).toBeGreaterThan(0);
                expect(typeof metrics[key]).toBe(description.type);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (keys_1_1 && !keys_1_1.done && (_a = keys_1.return)) _a.call(keys_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
    test("All NrCounter documentation has metrics", function () {
        var e_2, _a;
        var counter = getTestingNrCounter();
        // Force counter to store metrics without triggering the asynchronous behaviour.
        counter.counterReset();
        counter.poll();
        var metrics = counter.getLastPoll();
        var descriptions = counter.getDescription();
        var keys = Object.keys(descriptions);
        expect(keys.length).toBeGreaterThan(0);
        try {
            for (var keys_2 = __values(keys), keys_2_1 = keys_2.next(); !keys_2_1.done; keys_2_1 = keys_2.next()) {
                var key = keys_2_1.value;
                var metric = metrics[key];
                expect(metric).toBeDefined();
                expect(typeof metric).toBe(descriptions[key].type);
                if (typeof metric === "number") {
                    expect(Math.abs(metric)).toBeGreaterThanOrEqual(0);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (keys_2_1 && !keys_2_1.done && (_a = keys_2.return)) _a.call(keys_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
    });
}
exports.testNrCounter = testNrCounter;
//# sourceMappingURL=NrCounterTest.js.map