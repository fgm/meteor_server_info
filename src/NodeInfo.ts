import CpuUsage = NodeJS.CpuUsage;
/**
 * Same structure as NodeJS CpuUsage, but not same meaning for the values.
 */
import CpuUsageNormalized = NodeJS.CpuUsage;
import MemoryUsage = NodeJS.MemoryUsage;
import Process = NodeJS.Process;

import {IInfoData, IInfoDescription, IInfoSection} from "./types";

type HrTime = [number, number];

interface INodeInfoData extends IInfoData {
  cpuSystem:    number,
  cpuUser:      number,
  ramExternal:  number,
  ramHeapTotal: number,
  ramHeapUsed:  number,
  ramRss:       number,
  loopDelay:    number,
}

/**
 * An off-instance structure to preserve information between instance creations.
 */
interface INodeInfoStore {
  latestCpu:   CpuUsage,
  latestPoll:  number,
  latestTime:  HrTime,
  latestDelay: number,
}

/**
 * Provides the Node.JS-related information: RAM, CPU load.
 */
class NodeInfo implements IInfoSection {

  /**
   * The interval at which the event loop delay is measured, in milliseconds.
   *
   * This spreads over multiple ticks of the loop to limit measurement costs.
   */
  public static EVENT_LOOP_INTERVAL: number = 10000;

  protected info: INodeInfoData;

  /**
   * @param process
   *   The NodeJS process module or a stub for it.
   * @param store
   *   An object in which to store information between instance creations.
   *
   * @constructor
   */
  constructor(protected process: Process, protected store: INodeInfoStore) {
    this.info = {
      cpuSystem:    0,
      cpuUser:      0,
      loopDelay:    0,
      ramExternal:  0,
      ramHeapTotal: 0,
      ramHeapUsed:  0,
      ramRss:       0,
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
  public getDescription(): IInfoDescription {
    const numberTypeName = "number";
    const description = {
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
  }

  /**
   * Get process information about CPU and RAM usage.
   */
  public getInfo(): INodeInfoData {
    const ram:    MemoryUsage        = this.process.memoryUsage();
    const cpu:    CpuUsageNormalized = this.pollCpuUsage();
    const result: INodeInfoData      = {
      cpuSystem:    cpu.system,
      cpuUser:      cpu.user,
      loopDelay:    this.pollLoop(),
      ramExternal:  ram.external,
      ramHeapTotal: ram.heapTotal,
      ramHeapUsed:  ram.heapUsed,
      ramRss:       ram.rss,
    };
    return result;
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
    const ts0 = this.store.latestPoll || 0;
    // Although Date has msec resolution, in practice, getting identical dates
    // happens easily, so fake an actual millisecond different if the diff is 0,
    // to avoid infinite normalized CPU usage. 1E3 from msec to µsec.
    const tsDiff = (ts1 - ts0) || 1E3;
    this.store.latestPoll = ts1;

    const reading0: CpuUsage = this.store.latestCpu || { user: 0, system: 0 };
    const reading1: CpuUsage = this.process.cpuUsage();
    this.store.latestCpu = reading1;

    const result: CpuUsageNormalized = {
      system: (reading1.system - reading0.system) / tsDiff,
      user:   (reading1.user - reading0.user) / tsDiff,
    };
    return result;
  }

  protected pollLoop(): number {
    return this.store.latestDelay;
  }

  /**
   * Inspired by https://github.com/keymetrics/pmx
   *
   * @see https://github.com/keymetrics/pmx/blob/master/lib/probes/loop_delay.js
   *
   * Used under its MIT license, per pmx README.md
   */
  protected startEventLoopObserver() {
    if (typeof(this.store.latestTime) === "undefined") {
      this.store.latestTime = process.hrtime();
    }

    setInterval(() => {
        const newTime: HrTime = process.hrtime();
        const delay: number =
          (newTime[0] - this.store.latestTime [0]) * 1E3 +
          (newTime[1] - this.store.latestTime [1]) / 1e6 -
          NodeInfo.EVENT_LOOP_INTERVAL;
        this.store.latestTime = newTime;
        this.store.latestDelay = delay;
        // tslint:disable-next-line:no-console
        console.log("Delay: ", Number(delay).toFixed(2));
      }, NodeInfo.EVENT_LOOP_INTERVAL);
  }
}

export {
  NodeInfo,
  INodeInfoData,
  INodeInfoStore,
};
