import "process";
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
 * An off-instance structure to preserve information between instance creations.
 */
interface INodeInfoStore {
  latestCpu: any,
  latestPoll: number,
}

/**
 * Provides the Node.JS-related information: RAM, CPU load.
 */
class NodeInfo implements IInfoSection {
  protected info: INodeInfoData;
  protected process: typeof process;

  /**
   * @param process
   *   The NodeJS process module or a stub for it.
   * @param store
   *   An object in which to store information between instance creations.
   *
   * @constructor
   */
  constructor(p: typeof process, protected store: INodeInfoStore) {
    this.process = p;

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
  }

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
  public getDescription(): IInfoDescription {
    const description = {
      cpuSystem:    { type: "int", label: "CPU system seconds since last sample. May be > 1 on multiple cores." },
      cpuUser:      { type: "int", label: "CPU user seconds since last sample. May be > 1 on multiple cores." },
      ramExternal:  { type: "int", label: "C++ memory bound to V8 JS objects" },
      ramHeapTotal: { type: "int", label: "V8 Total heap" },
      ramHeapUsed:  { type: "int", label: "V8 Used heap" },
      ramRss:       { type: "int", label: "Resident Set Size (heap, code segment, stack)" },
    };

    return description;
  }

  /**
   * Get session information.
   *
   * @returns {Object}
   *   - cpuSystem
   *   - cpuUser
   *   - ramExternal
   *   - ramHeapTotal
   *   - ramHeapUsed
   *   - ramRss
   */
  public getInfo(): INodeInfoData {
    const ram = this.process.memoryUsage();
    const cpu = this.pollCpuUsage();
    const result: INodeInfoData = {
      cpuSystem:    cpu.system,
      cpuUser:      cpu.user,
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
   * @returns {{user: number, system: number}}
   *   The normalized time spent since last polling.
   */
  protected pollCpuUsage() {
    // Date is in msec, cpuUsage is in µsec.
    const ts1 = +new Date() * 1E3;
    const ts0 = this.store.latestPoll || 0;
    // Although Date has msec resolution, in practice, getting identical dates
    // happens easily, so fake an actual millisecond different if the diff is 0,
    // to avoid infinite normalized CPU usage. 1E3 from msec to µsec.
    const tsDiff = (ts1 - ts0) || 1E3;
    this.store.latestPoll = ts1;

    const reading0 = this.store.latestCpu || { user: 0, system: 0 };
    const reading1 = process.cpuUsage();
    this.store.latestCpu = reading1;

    const result = {
      system: (reading1.system - reading0.system) / tsDiff,
      user:   (reading1.user - reading0.user) / tsDiff,
    };
    return result;
  }
}

export {
  NodeInfo,
  INodeInfoData,
  INodeInfoStore,
};
