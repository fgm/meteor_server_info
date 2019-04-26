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
var SessionInfo_1 = require("../../src/SessionInfo");
function testSessionInfo() {
    function getTestingSessionCollector() {
        var subs = [
            // A subscription on two collections.
            {
                _documents: {
                    collection01: {
                        d011: true,
                        d012: true,
                    },
                    collection02: {
                        d021: true,
                    },
                },
                _name: "sub0",
            },
            // A subscription on a single collection.
            {
                _documents: {
                    collection11: {
                        d111: true,
                    },
                },
                _name: "sub1",
            },
            // This subscription include one of the same collections as sub0,
            // so its documents must be counted twice.
            {
                _documents: {
                    collection01: {
                        d011: true,
                        d012: true,
                    },
                    collection22: {
                        d221: true,
                        d222: true,
                        d223: true,
                    },
                },
                _name: "sub2",
            },
            // A subscription to an empty collection
            {
                _documents: {
                    collection31: {},
                },
                _name: "sub3",
            },
            // A subscription to no collection.
            {
                _documents: {},
                _name: "sub4",
            },
        ];
        var sessions = {
            sess1: {
                _namedSubs: { sub0: subs[0], sub1: subs[1] },
                id: "sess1",
            },
            sess2: {
                _namedSubs: { sub1: subs[1], sub2: subs[2], sub3: subs[3], sub4: subs[4] },
                id: "sess2",
            },
        };
        var collector = new SessionInfo_1.SessionInfo(sessions);
        return collector;
    }
    test("constructor initializes properties", function () {
        var collector = getTestingSessionCollector();
        var info = collector.getInfo();
        // Note1: PhpStorm currently shows a TS2693 on the "Map" references, but the compiler doesn't.
        // Note2: this shape test is probably redundant with the ISessionInfoData type information.
        expect(info).toMatchObject({
            nDocuments: expect.any(Map),
            nSessions: expect.any(Number),
            nSubs: expect.any(Map),
            usersWithNSubscriptions: expect.any(Map),
        });
    });
    test("nDocuments counter map is valid", function () {
        var collector = getTestingSessionCollector();
        var info = collector.getInfo();
        var nDocuments = info.nDocuments;
        var expectations = {
            collection01: 4,
            collection02: 1,
            collection11: 2,
            collection22: 3,
            collection31: 0,
        };
        var actualKeys = Array.from(nDocuments.keys()).sort();
        expect(actualKeys).toEqual(Object.keys(expectations).sort());
        nDocuments.forEach(function (v, k) {
            expect(v).toBe(expectations[k]);
        });
    });
    test("nSessions counter is valid", function () {
        var collector = getTestingSessionCollector();
        var info = collector.getInfo();
        expect(info.nSessions).toBe(2); // sess1 and sess2
    });
    test("nSubs counter map is valid", function () {
        var collector = getTestingSessionCollector();
        var info = collector.getInfo();
        var nSubs = info.nSubs;
        var expectations = {
            sub0: 1,
            sub1: 2,
            sub2: 1,
            sub3: 1,
            sub4: 1,
        };
        var actualKeys = Array.from(nSubs.keys()).sort();
        expect(actualKeys).toEqual(Object.keys(expectations).sort());
        nSubs.forEach(function (v, k) {
            expect(v).toBe(expectations[k]);
        });
    });
    test("usersWithNSubscriptions counter map is valid", function () {
        var collector = getTestingSessionCollector();
        var info = collector.getInfo();
        var users = info.usersWithNSubscriptions;
        // Object.keys() return object keys as strings so use Map to have numeric keys.
        // @ts-ignore
        var expectations = new Map([
            [2, 1],
            [4, 1],
        ]);
        // @ts-ignore
        var actualKeys = Array.from(users.keys()).sort();
        // @ts-ignore
        expect(actualKeys).toEqual(Array.from(expectations.keys()).sort());
        // @ts-ignore
        users.forEach(function (v, k) {
            expect(typeof k === "number").toBe(true);
            expect(v).toBe(expectations.get(k));
        });
    });
    test("All CPU usage information is documented", function () {
        var e_1, _a;
        var collector = getTestingSessionCollector();
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
                var type = typeof info[key];
                if (type !== "object") {
                    expect(type).toBe(description.type);
                }
                else {
                    var name_1 = info[key].constructor["name"];
                    expect(name_1).toBe(description.type);
                }
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
}
exports.testSessionInfo = testSessionInfo;
//# sourceMappingURL=SessionInfoTest.js.map