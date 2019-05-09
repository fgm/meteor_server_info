import CpuUsage = NodeJS.CpuUsage;
/**
 * Same structure as NodeJS CpuUsage, but not same meaning for the values.
 */
import CpuUsageNormalized = NodeJS.CpuUsage;
import MemoryUsage = NodeJS.MemoryUsage;
import Process = NodeJS.Process;

import {CounterBase} from "./NodeCounter/CounterBase";
import {IInfoData, IInfoDescription, IInfoSection} from "./types";

interface INodeInfoData extends IInfoData {
  cpuSystem:    number,
  cpuUser:      number,
  ramExternal:  number,
  ramHeapTotal: number,
  ramHeapUsed:  number,
  ramRss:       number,
}

/**
 * Provides the Node.JS-related information: RAM, CPU load.
 */
class NodeInfo implements IInfoSection {

  protected info: INodeInfoData;
  protected latestCpu: CpuUsage = { user: 0, system: 0 };
  protected latestPoll: number = 0;

  /**
   * @param process
   *   The NodeJS process module or a stub for it.
   * @constructor
   *   The event loop observer to use, if not empty.
   *
   * @constructor
   */
  constructor(protected process: Process, protected counter?: CounterBase) {
    this.info = {
      cpuSystem:    0,
      cpuUser:      0,
      ramExternal:  0,
      ramHeapTotal: 0,
      ramHeapUsed:  0,
      ramRss:       0,
    };
    // Initialize the latestPoll/latestCpu properties.
    this.pollCpuUsage();

    // Initialize the NodeJS loop counter if applicable.
    if (typeof this.counter !== "undefined") {
      this.counter.start();
    }
  }

  /**
   * Describe the metrics provided by this service.
   *
   * @return
   *   The description.
   */
  public getDescription(): IInfoDescription {
    const numberTypeName = "number";
    let description = {
      cpuSystem: {
        label: "CPU system seconds since last polling. May be > 1 on multiple cores.",
        type: numberTypeName,
      },
      cpuUser: {
        label: "CPU user seconds since last polling. May be > 1 on multiple cores.",
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

    if (typeof this.counter !== "undefined") {
      description = { ...description, ...this.counter.getDescription() };
    }
    return description;
  }

  /**
   * Get process information about CPU and RAM usage.
   */
  public getInfo(): INodeInfoData {
    const ram:    MemoryUsage        = this.process.memoryUsage();
    const cpu:    CpuUsageNormalized = this.pollCpuUsage();
    let result: INodeInfoData      = {
      cpuSystem:    cpu.system,
      cpuUser:      cpu.user,
      ramExternal:  ram.external,
      ramHeapTotal: ram.heapTotal,
      ramHeapUsed:  ram.heapUsed,
      ramRss:       ram.rss,
    };
    if (typeof this.counter !== "undefined") {
      result = { ...result, ...this.counter.getInfo()};
    }
    return result;
  }

  /**
   * Stop metrics collection, releasing timers.
   */
  public stop() {
    if (typeof this.counter !== "undefined") {
      this.counter.stop();
      delete this.counter;
    }
  }

  /**
   * Update the CPU reading and return it normalized per second.
   *
   * @return
   *   The normalized time spent since last polling.
   */
  protected pollCpuUsage(): CpuUsageNormalized {
    // Date is in msec, cpuUsage is in µsec.
    const ts1 = +new Date() * 1E3;
    const ts0 = this.latestPoll;
    // Although Date has msec resolution, in practice, getting identical dates
    // happens easily, so fake an actual millisecond different if the diff is 0,
    // to avoid infinite normalized CPU usage. 1E3 from msec to µsec.
    const tsDiff = (ts1 - ts0) || 1E3;
    this.latestPoll = ts1;

    const reading0: CpuUsage = this.latestCpu;
    const reading1: CpuUsage = this.process.cpuUsage();
    this.latestCpu = reading1;

    const result: CpuUsageNormalized = {
      system: (reading1.system - reading0.system) / tsDiff,
      user:   (reading1.user - reading0.user) / tsDiff,
    };
    return result;
  }
}

export {
  NodeInfo,
  INodeInfoData,
};
