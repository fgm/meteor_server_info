"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Provides the MongoDB-related information: observers and observed collections.
 */
var MongoInfo = function () {
  /**
   * Constructor.
   *
   * @param {Object} MongoInternals
   *   The Meteor MongoInternals service.
   *
   * @constructor
   */
  function MongoInfo(MongoInternals) {
    _classCallCheck(this, MongoInfo);

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


  _createClass(MongoInfo, [{
    key: "buildCollectionInfo",
    value: function buildCollectionInfo(type, collectionName) {
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

  }, {
    key: "buildHandleInfo",
    value: function buildHandleInfo(handle) {
      this.info.nObserveHandles += 1;

      // TODO check whether handle._observeDriver can actually occur.
      var driver = handle._observeDriver || handle._multiplexer._observeDriver;

      var collectionName = driver._cursorDescription.collectionName;
      var observerType = driver._usesOplog ? "oplogObserveHandles" : "pollingObserveHandles";
      this.buildCollectionInfo(observerType, collectionName);
    }

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

  }, {
    key: "getInfo",


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
    value: function getInfo() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.values(this.muxes)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var mux = _step.value;
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = Object.values(mux._handles)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var handle = _step2.value;

              this.buildHandleInfo(handle);
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return this.info;
    }
  }], [{
    key: "getDescription",
    value: function getDescription() {
      var description = {
        nObserveHandles: { type: "integer", label: "Overall observers count" },
        oplogObserveHandles: { type: "array", label: "Oplog-based observers[]" },
        oplogObserveHandlesCount: { type: "integer", label: "Oplog-based observers" },
        pollingObserveHandles: { type: "array", label: "Polling-based observers[]" },
        pollingObserveHandlesCount: { type: "integer", label: "Polling-based observers" }
      };

      return description;
    }
  }]);

  return MongoInfo;
}();

exports.default = MongoInfo;