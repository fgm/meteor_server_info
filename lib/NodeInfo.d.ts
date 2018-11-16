/// <reference types="node" />
import CpuUsage = NodeJS.CpuUsage;
/**
 * Same structure as NodeJS CpuUsage, but not same meaning for the values.
 */
import CpuUsageNormalized = NodeJS.CpuUsage;
import Process = NodeJS.Process;
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
    latestCpu: CpuUsage;
    latestPoll: number;
}
/**
 * Provides the Node.JS-related information: RAM, CPU load.
 */
declare class NodeInfo implements IInfoSection {
    protected process: Process;
    protected store: INodeInfoStore;
    protected info: INodeInfoData;
    /**
     * @param process
     *   The NodeJS process module or a stub for it.
     * @param store
     *   An object in which to store information between instance creations.
     *
     * @constructor
     */
    constructor(process: Process, store: INodeInfoStore);
    /**
     * Describe the metrics provided by this service.
     *
     * @return
     *   The description.
     */
    getDescription(): IInfoDescription;
    /**
     * Get process information about CPU and RAM usage.
     */
    getInfo(): INodeInfoData;
    /**
     * Update the CPU reading and return it normalized per second.
     *
     * @returns
     *   The normalized time spent since last polling.
     */
    protected pollCpuUsage(): CpuUsageNormalized;
}
export { NodeInfo, INodeInfoData, INodeInfoStore, };
