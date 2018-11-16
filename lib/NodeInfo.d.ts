/// <reference types="node" />
import "process";
import { IInfoData, IInfoDescription, IInfoSection } from "./types";
interface INodeInfoData extends IInfoData {
    cpuSystem: number;
    cpuUser: number;
    ramExternal: number;
    ramHeapTotal: number;
    ramHeapUsed: number;
    ramRss: number;
}
/**
 * An off-instance structure to preserve information between instance creations.
 */
interface INodeInfoStore {
    latestCpu: any;
    latestPoll: number;
}
/**
 * Provides the Node.JS-related information: RAM, CPU load.
 */
declare class NodeInfo implements IInfoSection {
    protected store: INodeInfoStore;
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
    constructor(p: typeof process, store: INodeInfoStore);
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
    getDescription(): IInfoDescription;
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
    getInfo(): INodeInfoData;
    /**
     * Update the CPU reading and return it normalized per second.
     *
     * @returns {{user: number, system: number}}
     *   The normalized time spent since last polling.
     */
    protected pollCpuUsage(): {
        system: number;
        user: number;
    };
}
export { NodeInfo, INodeInfoData, INodeInfoStore, };
