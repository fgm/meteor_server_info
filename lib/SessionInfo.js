"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Provides the session-related information: sessions, subscriptions, documents.
 */
var SessionInfo = function () {
  /**
   * @param {Object} sessions
   *   The private structure held by Meteor for its sessions list.
   *
   * @constructor
   */
  function SessionInfo(sessions) {
    _classCallCheck(this, SessionInfo);

    this.info = {
      nDocuments: {},
      nSessions: 0,
      nSubs: {},
      usersWithNSubscriptions: {}
    };
    this.sessions = sessions;
  }

  /**
   * Ensure initialization of a counter. Do not modify it if alreay set.
   *
   * @param {Object} part
   *   The container for the counter.
   * @param {Number|String} key
   *   The counter name.
   *
   * @returns {void}
   *
   * @private
   */


  _createClass(SessionInfo, [{
    key: "initKey",
    value: function initKey(part, key) {
      part[key] = part[key] || 0;
    }

    /**
     * Build the document information for a subscription into this.info.
     *
     * @param {Object} documents
     *   The private structure held by Meteor for the documents of a subscription.
     *
     * @returns {void}
     *
     * @private
     */

  }, {
    key: "_buildDocumentCountsPerSubscription",
    value: function _buildDocumentCountsPerSubscription(documents) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.entries(documents)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _ref = _step.value;

          var _ref2 = _slicedToArray(_ref, 2);

          var type = _ref2[0];
          var document = _ref2[1];

          this.initKey(this.info.nDocuments, type);
          this.info.nDocuments[type] += Object.keys(document).length;
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
    }

    /**
     * Build the subscription information for a session into this.info.
     *
     * @param {Array} subscriptions
     *   The private structure held by Meteor for a subscription within a session.
     *
     * @returns {void}
     *
     * @private
     */

  }, {
    key: "buildSubscriptionInfoPerSession",
    value: function buildSubscriptionInfoPerSession(subscriptions) {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = subscriptions[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var subscription = _step2.value;

          this.initKey(this.info.nSubs, subscription._name);
          this.info.nSubs[subscription._name] += 1;
          this._buildDocumentCountsPerSubscription(subscription._documents);
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

    /**
     * Build the session information into this.info.
     *
     * @param {Array} subscriptions
     *   The private structure held by Meteor for the subscriptions of a session.
     *
     * @returns {void}
     *
     * @private
     */

  }, {
    key: "buildSessionInfo",
    value: function buildSessionInfo(subscriptions) {
      this.info.nSessions += 1;
      var subCount = subscriptions.length;
      this.initKey(this.info.usersWithNSubscriptions, subCount);
      this.info.usersWithNSubscriptions[subCount] += 1;
      this.buildSubscriptionInfoPerSession(subscriptions);
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

  }, {
    key: "getInfo",


    /**
     * Get session information.
     *
     * @returns {Object}
     *   - nSessions: the overall number of sessions
     *   - usersWithNSubscriptions: a hash of the users count per number of subs.
     *   - nSubs: a hash of subscriptions count per subscription name
     *   - nDocuments: a hash of document counts per subscription
     */
    value: function getInfo() {
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = Object.values(this.sessions)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var session = _step3.value;

          this.buildSessionInfo(Object.values(session._namedSubs));
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      return this.info;
    }
  }], [{
    key: "getDescription",
    value: function getDescription() {
      var description = {
        nDocuments: { type: "array", label: "Documents per subscription[][]" },
        nSessions: { type: "int", label: "Sessions" },
        nSubs: { type: "array", label: "Subscriptions per session[]" },
        usersWithNSubscriptions: { type: "array", label: "User counts per subscription count[]" }
      };

      return description;
    }
  }]);

  return SessionInfo;
}();

exports.default = SessionInfo;