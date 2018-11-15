/// <reference types="node" />
import "process";
import { IInfoData } from "./ServerInfo";
interface NodeInfoData extends IInfoData {
    cpuUser: number;
    cpuSystem: number;
    ramExternal: number;
    ramHeapTotal: number;
    ramHeapUsed: number;
    ramRss: number;
}
/**
 * An off-instance structure to preserve information between instance creations.
 */
interface NodeInfoStore {
    latestCpu: any;
    latestPoll: number;
}
/**
 * Provides the Node.JS-related information: RAM, CPU load.
 */
declare class NodeInfo {
    store: NodeInfoStore;
    info: NodeInfoData;
    process: typeof process;
    /**
     * @param process
     *   The NodeJS process module or a stub for it.
     * @param store
     *   An object in which to store information between instance creations.
     *
     * @constructor
     */
    constructor(p: typeof process, store: NodeInfoStore);
    /**
     * Update the CPU reading and return it normalized per second.
     *
     * @returns {{user: number, system: number}}
     *   The normalized time spent since last polling.
     */
    pollCpuUsage(): {
        user: number;
        system: number;
    };
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
    static getDescription(): {
        cpuUser: {
            type: string;
            label: string;
        };
        cpuSystem: {
            type: string;
            label: string;
        };
        ramExternal: {
            type: string;
            label: string;
        };
        ramHeapTotal: {
            type: string;
            label: string;
        };
        ramHeapUsed: {
            type: string;
            label: string;
        };
        ramRss: {
            type: string;
            label: string;
        };
    };
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
    getInfo(): NodeInfoData;
}
export { NodeInfo, NodeInfoData, NodeInfoStore, };
