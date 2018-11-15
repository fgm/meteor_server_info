import { Counter, IInfoData, IInfoSection } from "./ServerInfo";
interface MongoInfoData extends IInfoData {
    nObserveHandles: number;
    oplogObserveHandles: Counter;
    oplogObserveHandlesCount: number;
    pollingObserveHandles: Counter;
    pollingObserveHandlesCount: number;
}
interface observerHandle {
    _observeDriver?: any;
    _multiplexer: any;
}
/**
 * Provides the MongoDB-related information: observers and observed collections.
 */
declare class MongoInfo implements IInfoSection {
    info: MongoInfoData;
    muxes: any;
    /**
     * Constructor.
     *
     * @param {Object} MongoInternals
     *   The Meteor MongoInternals service.
     *
     * @constructor
     */
    constructor(MongoInternals: any);
    /**
     * Build information about observed collections into this.info.
     *
     * @param {String} type
     *   The observer type.
     * @param {String} collectionName
     *   The observed collection name.
     *
     * @returns {void}
     *
     * @private
     */
    buildCollectionInfo(type: "pollingObserveHandles" | "oplogObserveHandles", collectionName: string): void;
    /**
     * Build information about observed collections into this.info.
     *
     * @param {Object} handle
     *   The private structure held by Meteor for an observer.
     *
     * @returns {void}
     *
     * @private
     */
    buildHandleInfo(handle: observerHandle): void;
    /**
     * Describe the metrics provided by this service.
     *
     * @return {{
     *   nObserveHandles: {type: string, label: string},
     *   oplogObserveHandles: {type: string, label: string},
     *   oplogObserveHandlesCount: {type: string, label: string},
     *   pollingObserveHandles: {type: string, label: string},
     *   pollingObserveHandlesCount: {type: string, label: string}
     * }}
     *   The description.
     */
    static getDescription(): {
        nObserveHandles: {
            type: string;
            label: string;
        };
        oplogObserveHandles: {
            type: string;
            label: string;
        };
        oplogObserveHandlesCount: {
            type: string;
            label: string;
        };
        pollingObserveHandles: {
            type: string;
            label: string;
        };
        pollingObserveHandlesCount: {
            type: string;
            label: string;
        };
    };
    /**
     * Get MongoDB-level information.
     *
     * @returns {*}
     *   - nObserveHandles: the total count of observe handles
     *   - oplogObserveHandles hash: count of oplog observers by collection
     *   - oplogObserveHandlesCount: the total count of oplog observers
     *   - pollingObserveHandles hash: count of polling observers by collection
     *   - pollingObserveHandlesCount: the total count of polling observers.
     */
    getInfo(): MongoInfoData;
}
export default MongoInfo;
