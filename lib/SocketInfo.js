'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Provides the socket-level information.
 */
var SocketInfo = function () {
  /**
   * Constructor.
   *
   * @param {Array} sockets
   *   The sockets opened on the active stream server.
   *
   * @constructor
   */
  function SocketInfo(sockets) {
    _classCallCheck(this, SocketInfo);

    this.info = {
      nSockets: 0,
      nSocketsWithLivedataSessions: 0
    };
    this.sockets = sockets;
  }

  /**
   * Describe the metrics provided by this service.
   *
   * @return {{
   *   nSockets: {type: string, label: string},
   *   nSocketsWithLivedataSessions: {type: string, label: string},
   * }}
   *  The description.
   */


  _createClass(SocketInfo, [{
    key: 'getInfo',


    /**
     * Check out the connections and what we know about them
     *
     * @returns {Object}
     *   - nSockets: the global socket count
     *   - nSocketsWithLivedataSessions: the number of sockets with live data.
     */
    value: function getInfo() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.sockets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var socket = _step.value;

          this.info.nSockets += 1;

          if (socket.meteor_session) {
            this.info.nSocketsWithLivedataSessions += 1;
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
    key: 'getDescription',
    value: function getDescription() {
      var description = {
        nSockets: { type: 'integer', label: 'Count of open sockets' },
        nSocketsWithLivedataSessions: { type: 'integer', label: 'Count of sockets with live data' }
      };

      return description;
    }
  }]);

  return SocketInfo;
}();

exports.default = SocketInfo;