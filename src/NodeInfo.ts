import "process";
import {IInfoData} from "./ServerInfo";

interface NodeInfoData extends IInfoData {
  cpuUser:      number,
  cpuSystem:    number,
  ramExternal:  number,
  ramHeapTotal: number,
  ramHeapUsed:  number,
  ramRss:       number,
}

/**
 * An off-instance structure to preserve information between instance creations.
 */
interface NodeInfoStore {
  latestCpu: any,
  latestPoll: number,
}

/**
 * Provides the Node.JS-related information: RAM, CPU load.
 */
class NodeInfo {
  public info: NodeInfoData;
  public process: typeof process;

  /**
   * @param process
   *   The NodeJS process module or a stub for it.
   * @param store
   *   An object in which to store information between instance creations.
   *
   * @constructor
   */
  constructor(p: typeof process, public store: NodeInfoStore) {
    this.process = p;

    this.info = {
      cpuUser:      0,
      cpuSystem:    0,
      ramExternal:  0,
      ramHeapTotal: 0,
      ramHeapUsed:  0,
      ramRss:       0,
    };
    // Initialize the latestPoll/latestCpu properties.
    this.pollCpuUsage();
  }

  /**
   * Update the CPU reading and return it normalized per second.
   *
   * @returns {{user: number, system: number}}
   *   The normalized time spent since last polling.
   */
  pollCpuUsage() {
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
      user:   (reading1.user - reading0.user) / tsDiff,
      system: (reading1.system - reading0.system) / tsDiff,
    };
    return result;
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
  static getDescription() {
    const description = {
      cpuUser:      { type: "int", label: "CPU user seconds since last sample. May be > 1 on multiple cores." },
      cpuSystem:    { type: "int", label: "CPU system seconds since last sample. May be > 1 on multiple cores." },
      ramExternal:  { type: "int", label: "C++ memory bound to V8 JS objects" },
      ramHeapTotal: { type: "int", label: "V8 Total heap" },
      ramHeapUsed:  { type: "int", label: "V8 Used heap" },
      ramRss:       {
        type:  "int",
        label: "Resident Set Size (heap, code segment, stack)",
      },
    };

    return description;
  }

  /**
   * Get session information.
   *
   * @returns {Object}
   *   - ramRss
   *   - ramHeapTotal
   *   - ramHeapUsed
   *   - ramExternal
   *   - cpuSystem
   *   - cpuUser
   */
  getInfo(): NodeInfoData {
    const ram = this.process.memoryUsage();
    const cpu = this.pollCpuUsage();
    const result: NodeInfoData = {
      cpuUser:      cpu.user,
      cpuSystem:    cpu.system,
      ramExternal:  ram.external,
      ramHeapTotal: ram.heapTotal,
      ramHeapUsed:  ram.heapUsed,
      ramRss:       ram.rss,
    };
    return result;
  }
}

export {
  NodeInfo,
  NodeInfoData,
  NodeInfoStore,
};
