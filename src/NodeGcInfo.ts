const gc = (require("gc-stats"))();

import {sprintf} from "sprintf-js";
import {IInfoData, IInfoDescription, IInfoSection} from "./types";

interface INodeGcInfoData extends IInfoData {
  currentMinute:             number,
  msecPerGcAvg:              number,
  msecPerGcMax:              number,
  msecTotal:                 number,
  callsScavenger:            number,
  callsMarkSweepCompactor:   number,
  callsIncrementalMarking:   number,
  callsWeakPhantomCallbacks: number,
  msecScavenger:             number,
  msecMarkSweepCompactor:    number,
  msecIncrementalMarking:    number,
  msecWeakPhantomCallbacks:  number,
}

type GcTypeId = 1 | 2 | 4 | 8;

/**
 * Class GcObserver is the type supporting GC observation via gc-stats.
 */
class GcObserver {
  protected prevCurrentMinute: number = 0.0;
  protected prevMsecMax: number = 0.0;

  protected prevCallsScavenger: number = 0;
  protected prevCallsMSC: number = 0;
  protected prevCallsIncremental: number = 0;
  protected prevCallsWeakPhantom: number = 0;

  protected prevMsecScavenger: number = 0.0;
  protected prevMsecMSC: number = 0.0;
  protected prevMsecIncremental: number = 0.0;
  protected prevMsecWeakPhantom: number = 0.0;

  protected currentMinute: number = 0.0;
  protected msecMax: number = 0.0;

  protected callsScavenger: number = 0;
  protected callsMSC: number = 0;
  protected callsIncremental: number = 0;
  protected callsWeakPhantom: number = 0;

  protected msecScavenger: number = 0.0;
  protected msecMSC: number = 0.0;
  protected msecIncremental: number = 0.0;
  protected msecWeakPhantom: number = 0.0;

  public getInfo(): INodeGcInfoData {
    const calls = this.prevCallsScavenger +
      this.prevCallsMSC +
      this.prevCallsIncremental +
      this.prevCallsWeakPhantom;
    const msec = this.prevMsecScavenger +
      this.prevMsecMSC +
      this.prevMsecIncremental +
      this.prevMsecWeakPhantom;

    const info: INodeGcInfoData = {
      currentMinute: this.prevCurrentMinute,
      msecPerGcAvg: (calls !== 0) ? msec / calls : 0,
      msecPerGcMax: this.prevMsecMax,
      msecTotal: msec,

      callsIncrementalMarking: this.prevCallsIncremental,
      callsMarkSweepCompactor: this.prevCallsMSC,
      callsScavenger: this.prevCallsScavenger,
      callsWeakPhantomCallbacks: this.prevCallsWeakPhantom,

      msecIncrementalMarking: Math.round(this.prevMsecIncremental),
      msecMarkSweepCompactor: Math.round(this.prevMsecMSC),
      msecScavenger: Math.round(this.prevMsecScavenger),
      msecWeakPhantomCallbacks: Math.round(this.prevMsecWeakPhantom),
    };

    return info;
  }

  public getRunningInfo(): INodeGcInfoData {
    const calls = this.callsScavenger +
      this.callsMSC +
      this.callsIncremental +
      this.callsWeakPhantom;
    const msec = this.msecScavenger +
      this.msecMSC +
      this.msecIncremental +
      this.msecWeakPhantom;

    const info: INodeGcInfoData = {
      currentMinute: this.currentMinute,
      msecPerGcAvg: (calls !== 0) ? msec / calls : 0,
      msecPerGcMax: this.msecMax,
      msecTotal: msec,

      callsIncrementalMarking: this.callsIncremental,
      callsMarkSweepCompactor: this.callsMSC,
      callsScavenger: this.callsScavenger,
      callsWeakPhantomCallbacks: this.callsWeakPhantom,

      msecIncrementalMarking: Math.round(this.msecIncremental),
      msecMarkSweepCompactor: Math.round(this.msecMSC),
      msecScavenger: Math.round(this.msecScavenger),
      msecWeakPhantomCallbacks: Math.round(this.msecWeakPhantom),
    };

    return info;
  }

  public start() {
    this.init();
    gc.on("stats", this.handleSample.bind(this));
  }

  public stop() {
    gc.removeListener("stats", this.handleSample.bind(this));
    this.init();
  }

  /**
   * Build the timestamp of the beginning of the current minute.
   *
   * JavaScript dates are in milliseconds, so divide by 60*1000 to get the UNIX
   * timestamp of an exact minute, then re-multiply the rounded result to get
   * seconds.
   */
  protected getCurrentMinute(): number {
    return Math.floor((+ new Date() / 60000)) * 60;
  }

  protected init(): void {
    this.prevCurrentMinute = this.currentMinute;
    this.prevMsecMax = this.msecMax;

    this.prevCallsScavenger = this.callsScavenger;
    this.prevCallsMSC = this.callsMSC;
    this.prevCallsIncremental = this.callsIncremental;
    this.prevCallsWeakPhantom = this.callsWeakPhantom;

    this.prevMsecScavenger = this.msecScavenger;
    this.prevMsecMSC = this.msecMSC;
    this.prevMsecIncremental = this.msecIncremental;
    this.prevMsecWeakPhantom = this.msecWeakPhantom;

    this.currentMinute = 0.0;
    this.msecMax = 0.0;

    this.callsScavenger = 0;
    this.callsMSC = 0;
    this.callsIncremental = 0;
    this.callsWeakPhantom = 0;

    this.msecScavenger = 0.0;
    this.msecMSC = 0.0;
    this.msecIncremental = 0.0;
    this.msecWeakPhantom = 0.0;
  }

  /**
   * Extract information from a GC sample and store it on the observer.
   *
   * @param {IInfoData} stats
   *   A stats record as documented on https://github.com/dainis/node-gcstats .
   */
  protected handleSample(stats: IInfoData) {
    const current = this.getCurrentMinute();
    if (current !== this.currentMinute) {
      this.init();
      this.currentMinute = current;
    }

    // GC pauses are in nanoseconds, convert to milliseconds.
    const pause = (stats.pause as number) / 1E6;

    if (pause > this.msecMax) {
      this.msecMax = pause;
    }

    switch (stats.gctype as GcTypeId) {
      case 1:
        this.callsScavenger++;
        this.msecScavenger += pause;
        break;
      case 2:
        this.callsMSC++;
        this.msecMSC += pause;
        break;
      case 4:
        this.callsIncremental++;
        this.msecIncremental += pause;
        break;
      case 8:
        this.callsWeakPhantom++;
        this.msecWeakPhantom += pause;
        break;
      default:
        throw new Error(sprintf("Unknown GC type: %d", stats.gctype));
    }
  }
}

/**
 * Provides the Node.JS-related information: RAM, CPU load.
 */
class NodeGcInfo implements IInfoSection {

  protected gcObserver: GcObserver;

  /**
   * @constructor
   */
  constructor() {
    this.gcObserver = new GcObserver();
    this.gcObserver.start();
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
      currentMinute: {
        label: "The timestamp of the beginning of the minute during which the measures are taken",
        type: numberTypeName,
      },
      msecPerGcAvg: {
        label: "Average milliseconds per GC operation of any type during the last minute",
        type: numberTypeName,
      },
      msecPerGcMax: {
        label: "Maximum milliseconds per GC operation of any type during the last minute",
        type: numberTypeName,
      },
      msecTotal: {
        label: "Total milliseconds for all types of GC operations during the last minute",
        type: numberTypeName,
      },

      callsIncrementalMarking: {
        label: "Number of calls to the Incremental marker during the last minute",
        type: numberTypeName,
      },
      callsMarkSweepCompactor: {
        label: "Number of calls to the Mark/Sweep/Compact (major) GC during the last minute",
        type: numberTypeName,
      },
      callsScavenger: {
        label: "Number of calls to the Scavenge (minor) GC during the last minute",
        type: numberTypeName,
      },
      callsWeakPhantomCallbacks: {
        label: "Number of calls to Weak/Phantom callbacks during the last minute",
        type: numberTypeName,
      },

      msecIncrementalMarking: {
        label: "Milliseconds spent doing Incremental marking during the last minute",
        type: numberTypeName,
      },
      msecMarkSweepCompactor: {
        label: "Milliseconds spent by the Mark/Sweep/Compactor during the last minute",
        type: numberTypeName,
      },
      msecScavenger: {
        label: "Milliseconds spent by the Scavenger during the last minute",
        type: numberTypeName,
      },
      msecWeakPhantomCallbacks: {
        label: "Milliseconds spent in weak/phantom callbacks during the last minute",
        type: numberTypeName,
      },
    };

    return description;
  }

  /**
   * Get process information about CPU and RAM usage.
   */
  public getInfo(): INodeGcInfoData {
    return this.gcObserver.getInfo();
  }

  public start(): void {
    this.gcObserver.start();
  }
  /**
   * Stop metrics collection, releasing timers.
   */
  public stop() {
    this.gcObserver.stop();
  }
}

export {
  NodeGcInfo,
  INodeGcInfoData,
};
