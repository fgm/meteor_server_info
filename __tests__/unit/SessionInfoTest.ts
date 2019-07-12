import {
  INamedSessions,
  ISessionInfoData,
  ISubscription,
  SessionInfo,
} from "../../src/SessionInfo";
import {IInfoDescription, NanoTs} from "../../src/types";

function testSessionInfo() {
  function getTestingSessionCollector(): SessionInfo[] {
    const subs: ISubscription[] = [
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
    // Meteor 1.6 to 1.8.0.2 format.
    const sessions: INamedSessions = {
      sess1: {
        _namedSubs: {
          sub0: subs[0],
          sub1: subs[1],
        },
        id: "sess1",
      },
      sess2: {
        _namedSubs: {
          sub1: subs[1],
          sub2: subs[2],
          sub3: subs[3],
          sub4: subs[4]},
        id: "sess2",
      },
    };
    // Meteor 1.8.1 format.
    const sessionMap: Map<string, any> = new Map([
      ["sess1", {
        _namedSubs: new Map([
          ["sub0", subs[0]],
          ["sub1", subs[1]],
        ]),
        id: "sess1",
      }],
      ["sess2", {
        _namedSubs: new Map([
          ["sub1", subs[1]],
          ["sub2", subs[2]],
          ["sub3", subs[3]],
          ["sub4", subs[4]],
        ]),
        id: "sess2",
      }],
    ]);

    const collector = new SessionInfo(sessions);
    const mapCollector = new SessionInfo(sessionMap);

    return [collector, mapCollector];
  }

  test("constructor initializes properties", () => {
    for (const collector of getTestingSessionCollector()) {
      const info: ISessionInfoData = collector.getInfo();
      // Note1: PhpStorm currently shows a TS2693 on the "Map" references, but the compiler doesn't.
      // Note2: this shape test is probably redundant with the ISessionInfoData type information.
      expect(info).toMatchObject({
        nDocuments: expect.any(Map),
        nSessions: expect.any(Number),
        nSubs: expect.any(Map),
        usersWithNSubscriptions: expect.any(Map),
      });
    }
  });

  test("nDocuments counter map is valid", () => {
    for (const collector of getTestingSessionCollector()) {
      const info: ISessionInfoData = collector.getInfo();
      const nDocuments = info.nDocuments;
      const expectations: {[index: string]: any} = {
        collection01: 4, // 2 on sess1 + 2 on sess2
        collection02: 1,
        collection11: 2, // 1 on sess1 + 1 on sess2
        collection22: 3,
        collection31: 0,
      };
      const actualKeys = Array.from(nDocuments.keys()).sort();
      expect(actualKeys).toEqual(Object.keys(expectations).sort());
      nDocuments.forEach((v, k) => {
        expect(v).toBe(expectations[k]);
      });
    }
  });

  test("nSessions counter is valid", () => {
    for (const collector of getTestingSessionCollector()) {
      const info: ISessionInfoData = collector.getInfo();
      expect(info.nSessions).toBe(2); // sess1 and sess2
    }
  });

  test("nSubs counter map is valid", () => {
    for (const collector of getTestingSessionCollector()) {
      const info: ISessionInfoData = collector.getInfo();
      const nSubs = info.nSubs;
      const expectations: {[index: string]: any} = {
        sub0: 1,
        sub1: 2,
        sub2: 1,
        sub3: 1,
        sub4: 1,
      };
      const actualKeys = Array.from(nSubs.keys()).sort();
      expect(actualKeys).toEqual(Object.keys(expectations).sort());
      nSubs.forEach((v, k) => {
        expect(v).toBe(expectations[k]);
      });
    }
  });

  test("usersWithNSubscriptions counter map is valid", () => {
    for (const collector of getTestingSessionCollector()) {
      const info: ISessionInfoData = collector.getInfo();
      const users = info.usersWithNSubscriptions;
      // Object.keys() return object keys as strings so use Map to have numeric keys.
      // @ts-ignore
      const expectations = new Map([
        [2, 1], // sess1: sub0, 1.
        [4, 1], // sess2: sub1, 2, 3, 4.
      ]);
      // @ts-ignore
      const actualKeys = Array.from(users.keys()).sort();
      // @ts-ignore
      expect(actualKeys).toEqual(Array.from(expectations.keys()).sort());
      // @ts-ignore
      users.forEach((v: number | NanoTs, k: number | string) => {
        expect(typeof k === "number").toBe(true);
        expect(v).toBe(expectations.get(k as number));
      });
    }
  });

  test("All CPU usage information is documented", () => {
    for (const collector of getTestingSessionCollector()) {
      const info: ISessionInfoData = collector.getInfo();
      const descriptions: IInfoDescription = collector.getDescription();
      const keys = Object.keys(info);
      expect(keys.length).toBeGreaterThan(0);
      for (const key of keys) {
        const description = descriptions[key];
        expect(description).toBeDefined();
        expect(description).toHaveProperty("type");
        expect(description).toHaveProperty("label");
        expect(description.label.length).toBeGreaterThan(0);
        const type = typeof info[key];
        if (type !== "object") {
          expect(type).toBe(description.type);
        } else {
          const name = info[key].constructor["name"];
          expect(name).toBe(description.type);
        }
      }
    }
  });
}

export {
  testSessionInfo,
};
