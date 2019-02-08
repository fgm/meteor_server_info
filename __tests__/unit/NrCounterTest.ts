import {NrCounter} from "../../src/NodeCounter/NrCounter";
import {
  IInfoData,
  IInfoDescription,
  nullLogger,
} from "../../src/types";

/**
 * These tests run on node 8.4, to process.hrtime.bigint() is not available yet.
 */
function testNrCounter() {
  function getTestingNrCounter(): NrCounter {
    return new NrCounter(nullLogger);
  }

  test("All NrCounter information is documented", () => {
    const counter: NrCounter = getTestingNrCounter();
    // Force counter to store metrics without triggering the asynchronous behaviour.
    counter.counterReset();
    (counter as any).watch();

    const metrics: IInfoData = counter.getLastPoll();
    const descriptions: IInfoDescription = counter.getDescription();
    const keys = Object.keys(metrics);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      const description = descriptions[key];
      expect(description).toBeDefined();
      expect(description).toHaveProperty("type");
      expect(description).toHaveProperty("label");
      expect(description.label.length).toBeGreaterThan(0);
      expect(typeof metrics[key]).toBe(description.type);
    }
  });

  test("All NrCounter documentation has metrics", () => {
    const counter: NrCounter = getTestingNrCounter();
    // Force counter to store metrics without triggering the asynchronous behaviour.
    counter.counterReset();
    (counter as any).watch();

    const metrics: IInfoData = counter.getLastPoll();
    const descriptions: IInfoDescription = counter.getDescription();
    const keys = Object.keys(descriptions);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      const metric = metrics[key];
      expect(metric).toBeDefined();
      expect(typeof metric).toBe(descriptions[key].type);
      if (typeof metric === "number") {
        expect(Math.abs(metric as number)).toBeGreaterThanOrEqual(0);
      }
    }
  });
}

export {
  testNrCounter,
};
