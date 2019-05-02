import CpuUsage = NodeJS.CpuUsage;
import MemoryUsage = NodeJS.MemoryUsage;
import Timeout = NodeJS.Timeout;

import "process";

import {ICounter} from "../../src/NodeCounter/CounterBase";
import {INodeInfoData, NodeInfo} from "../../src/NodeInfo";
import {IDone, IInfoData, IInfoDescription} from "../../src/types";

class MockCounter implements ICounter {
  public started: boolean = false;
  protected info: IInfoData = {};

  public getDescription(): IInfoDescription {
    return {};
  }

  public getLastPoll(): IInfoData {
    return this.info;
  }
  public setLastPoll(info: IInfoData): void {
    this.info = info;
  }
  public start(): Timeout {
    this.started = true;
    const timeout = setTimeout(() => ({}), 0);
    clearTimeout(timeout);
    return timeout;
  }
  public stop(): void {
    this.started = false;
  }
}

/**
 * These tests run on node 8.4, to process.hrtime.bigint() is not available yet.
 */
function testNodeInfo() {
  function getTestingNodeCollector(counter?: ICounter): NodeInfo {
    const mockProcess: any = {
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
      cpuUsage(): CpuUsage {
        return this._cpu;
      },
      memoryUsage(): MemoryUsage {
        return this._memory;
      },
      hrtime: process.hrtime,
    };
    return new NodeInfo(mockProcess, counter);
  }

  test("constructor initializes CPU usage", () => {
    const t0 = process.hrtime();
    const collector = getTestingNodeCollector();
    const t1 = process.hrtime(t0);

    const info: INodeInfoData = collector.getInfo();
    expect(t1[0]).toBeGreaterThanOrEqual(0);
    expect(t1[1]).toBeGreaterThan(0);
    expect(info.cpuSystem).toBe(0);
    expect(info.cpuUser).toBe(0);
    collector.stop();
  });

  test("CPU usage is not empty", (done: IDone) => {
    const collector = new NodeInfo(process);
    // Prime CPU store.
    collector.getInfo();

    const t0 = process.hrtime();
    // Eat CPU, don't let system use it.
    for (let i = 0; i < 1E7; i++) {
      i++;
    }
    setImmediate(() => {
      const t1 = process.hrtime(t0);
      // Convert hrtime from tuple to seconds to compare with CPU usage.
      const lag = t1[0] + t1[1] / 1E9;

      const info: INodeInfoData = collector.getInfo();
      expect(info.cpuSystem).toBeGreaterThanOrEqual(0);
      expect(info.cpuSystem).toBeLessThan(1);
      expect(info.cpuUser).toBeGreaterThan(lag);
      collector.stop();
      done();
    });
  });

  test("All CPU usage information is documented without a counter", () => {
    const collector = getTestingNodeCollector();
    const info: INodeInfoData = collector.getInfo();
    const descriptions: IInfoDescription = collector.getDescription();
    const keys = Object.keys(info);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      const description = descriptions[key];
      expect(description).toBeDefined();
      expect(description).toHaveProperty("type");
      expect(description).toHaveProperty("label");
      expect(description.label.length).toBeGreaterThan(0);
      expect(typeof info[key]).toBe(description.type);
    }
    collector.stop();
  });

  test("All CPU usage information is documented with a counter", () => {
    const collector = getTestingNodeCollector(new MockCounter());
    const info: INodeInfoData = collector.getInfo();
    const descriptions: IInfoDescription = collector.getDescription();
    const keys = Object.keys(info);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      const description = descriptions[key];
      expect(description).toBeDefined();
      expect(description).toHaveProperty("type");
      expect(description).toHaveProperty("label");
      expect(description.label.length).toBeGreaterThan(0);
      expect(typeof info[key]).toBe(description.type);
    }
    collector.stop();
  });

  test("counters are started and stopped", () => {
    const counter: MockCounter = new MockCounter();
    const collector = getTestingNodeCollector(counter);
    expect(counter.started).toBeTruthy();
    collector.stop();
    expect(counter.started).toBeFalsy();
  });
}

export {
  testNodeInfo,
};
