import * as process from "process";

import CpuUsage = NodeJS.CpuUsage;
import MemoryUsage = NodeJS.MemoryUsage;
//import Process = NodeJS.Process;

import {INodeInfoData, INodeInfoStore, NodeInfo} from "../../src/NodeInfo";

/**
 * These tests run on node 8.4, to process.hrtime.bigint() is not available yet.
 */
function testNodeInfo() {
  function getTestingNodeCollector(): NodeInfo {
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
    };

    const store: INodeInfoStore = {} as INodeInfoStore;
    const collector = new NodeInfo(mockProcess, store);

    return collector;
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
  });

  test("CPU usage is not empty", () => {
    const store: INodeInfoStore = {} as INodeInfoStore;
    const collector = new NodeInfo(process, store);
    // Prime CPU store.
    collector.getInfo();

    const t0 = process.hrtime();
    // Eat CPU, don't let system use it.
    for (let i = 0; i < 2E6; i++) {
      i++;
    }
    const t1 = process.hrtime(t0);
    // Convert hrtime from tuple to seconds to compare with CPU usage.
    const lag = t1[0] + t1[1] / 1E9;

    const info: INodeInfoData = collector.getInfo();
    console.log(info, t1);
    expect(info.cpuSystem).toBeGreaterThanOrEqual(0);
    expect(info.cpuSystem).toBeLessThan(1);
    expect(info.cpuUser).toBeGreaterThan(lag);
  });
}

export {
  testNodeInfo,
}
