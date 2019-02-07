import CpuUsage = NodeJS.CpuUsage;
/**
 * Same structure as NodeJS CpuUsage, but not same meaning for the values.
 */
import CpuUsageNormalized = NodeJS.CpuUsage;
import Process = NodeJS.Process;
import { ICounter } from "./NodeCounter/CounterBase";
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
 * Provides the Node.JS-related information: RAM, CPU load.
 */
declare class NodeInfo implements IInfoSection {
    protected process: Process;
    protected counter?: ICounter | undefined;
    protected info: INodeInfoData;
    protected latestCpu: CpuUsage;
    protected latestPoll: number;
    /**
     * @param process
     *   The NodeJS process module or a stub for it.
     * @constructor
     *   The event loop observer to use, if not empty.
     *
     * @constructor
     */
    constructor(process: Process, counter?: ICounter | undefined);
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
     * Stop metrics collection, releasing timers.
     */
    stop(): void;
    /**
     * Update the CPU reading and return it normalized per second.
     *
     * @return
     *   The normalized time spent since last polling.
     */
    protected pollCpuUsage(): CpuUsageNormalized;
}
export { NodeInfo, INodeInfoData, };
