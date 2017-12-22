/**
 * Provides the MongoDB-related information: observers and observed collections.
 */
class MongoInfo {
  /**
   * Constructor.
   *
   * @param {Object} MongoInternals
   *   The Meteor MongoInternals service.
   *
   * @constructor
   */
  constructor(MongoInternals) {
    this.info = {
      nObserveHandles: 0,
      oplogObserveHandles: {},
      oplogObserveHandlesCount: 0,
      pollingObserveHandles: {},
      pollingObserveHandlesCount: 0
    };
    this.muxes = MongoInternals.defaultRemoteCollectionDriver().mongo._observeMultiplexers;
  }

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
  buildCollectionInfo(type, collectionName) {
    this.info[type + "Count"] += 1;
    this.info[type][collectionName] = this.info[type][collectionName] || 0;
    this.info[type][collectionName] += 1;
  }

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
  buildHandleInfo(handle) {
    this.info.nObserveHandles += 1;

    // TODO check whether handle._observeDriver can actually occur.
    const driver = handle._observeDriver || handle._multiplexer._observeDriver;

    const collectionName = driver._cursorDescription.collectionName;
    const observerType = driver._usesOplog ? "oplogObserveHandles" : "pollingObserveHandles";
    this.buildCollectionInfo(observerType, collectionName);
  }

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
  getInfo() {
    for (const mux of Object.values(this.muxes)) {
      for (const handle of Object.values(mux._handles)) {
        this.buildHandleInfo(handle);
      }
    }

    return this.info;
  }
}

export default MongoInfo;
