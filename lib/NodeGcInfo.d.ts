import { IInfoData, IInfoDescription, IInfoSection } from "./types";
interface INodeGcInfoData extends IInfoData {
    currentMinute: number;
    msecPerGcAvg: number;
    msecPerGcMax: number;
    msecTotal: number;
    callsScavenger: number;
    callsMarkSweepCompactor: number;
    callsIncrementalMarking: number;
    callsWeakPhantomCallbacks: number;
    msecScavenger: number;
    msecMarkSweepCompactor: number;
    msecIncrementalMarking: number;
    msecWeakPhantomCallbacks: number;
}
/**
 * Class GcObserver is the type supporting GC observation via gc-stats.
 */
declare class GcObserver {
    protected currentMinute: number;
    protected msecMax: number;
    protected callsScavenger: number;
    protected callsMSC: number;
    protected callsIncremental: number;
    protected callsWeakPhantom: number;
    protected msecScavenger: number;
    protected msecMSC: number;
    protected msecIncremental: number;
    protected msecWeakPhantom: number;
    getInfo(): INodeGcInfoData;
    start(): void;
    stop(): void;
    /**
     * Build the timestamp of the beginning of the current minute.
     *
     * JavaScript dates are in milliseconds, so divide by 60*1000 to get the UNIX
     * timestamp of an exact minute, then re-multiply the rounded result to get
     * seconds.
     */
    protected getCurrentMinute(): number;
    protected init(): void;
    /**
     * Extract information from a GC sample and store it on the observer.
     *
     * @param {IInfoData} stats
     *   A stats record as documented on https://github.com/dainis/node-gcstats .
     */
    protected handleSample(stats: IInfoData): void;
}
/**
 * Provides the Node.JS-related information: RAM, CPU load.
 */
declare class NodeGcInfo implements IInfoSection {
    protected gcObserver: GcObserver;
    /**
     * @constructor
     */
    constructor();
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
    getInfo(): INodeGcInfoData;
    start(): void;
    /**
     * Stop metrics collection, releasing timers.
     */
    stop(): void;
}
export { NodeGcInfo, INodeGcInfoData, };
