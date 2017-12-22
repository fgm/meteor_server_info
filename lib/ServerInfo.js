"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _connect = require("connect");

var _connect2 = _interopRequireDefault(_connect);

var _SessionInfo = require("./SessionInfo");

var _SessionInfo2 = _interopRequireDefault(_SessionInfo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ServerInfo = function () {
  /**
   * {constructor}
   *
   * @param {Meteor} Meteor
   *   The Meteor global.
   * @param {WebApp} WebApp
   *   The Meteor WebApp service.
   * @param {MongoInternals} MongoInternals
   *   The Meteor MongoInternals service.
   * @param {Facts} Facts
   *   The Meteor Facts collector service.
   *
   * TODO check whether Meteor.default_server might actually change over time.
   */
  function ServerInfo(Meteor, WebApp, MongoInternals, Facts) {
    _classCallCheck(this, ServerInfo);

    this.settings = Meteor.settings.serverInfo || {
      path: "/serverInfo",
      user: "insecure",
      pass: "secureme"
    };
    this.connect = _connect2.default;
    this.connectHandlers = WebApp.connectHandlers;
    this.facts = Facts;
    // We only use its default_server key, but we keep the whole Meteor object
    // in case the default_server key might change.
    this.meteor = Meteor;
    this.mongoInternals = MongoInternals;
  }

  /**
   * Collect the counters from Meteor structures.
   *
   * @returns {{}}
   *   A plain object of metrics by name.
   */


  _createClass(ServerInfo, [{
    key: "getConnectionCounts",
    value: function getConnectionCounts() {
      var results = {
        nLiveResultsSets: 0,
        nObserveHandles: 0,
        oplogObserveHandlesCount: 0,
        pollingObserveHandlesCount: 0,
        oplogObserveHandles: {},
        pollingObserveHandles: {}
      };

      results.sockets = this.getSocketCounts();
      results.sessions = new _SessionInfo2.default(this.meteor.default_server.sessions).getSessionInfo();

      _.each(this.mongoInternals.defaultRemoteCollectionDriver().mongo._observeMultiplexers, function (muxer) {
        _.each(muxer._handles, function (handle) {
          results.nObserveHandles += 1;

          var logStat = function logStat(type, collectionName) {
            results[type + 'Count'] += 1;
            results[type][collectionName] = results[type][collectionName] || 0;
            results[type][collectionName] += 1;
          };

          var driver = handle._observeDriver || muxer._observeDriver;
          var collectionName = driver._cursorDescription.collectionName;
          if (driver._usesOplog) {
            logStat('oplogObserveHandles', collectionName);
          } else {
            logStat('pollingObserveHandles', collectionName);
          }
        });
      });

      // walk facts
      if (this.facts._factsByPackage) {
        results.facts = {};
        _.each(this.facts._factsByPackage, function (facts, pkg) {
          results.facts[pkg] = facts;
        });
      }

      return results;
    }

    /**
     * Check out the connections and what we know about them
     *
     * @returns {Object}
     *   - nSockets: the global socket count
     *   - nSocketsWithLivedataSessions: the number of sockets with live data.
     */

  }, {
    key: "getSocketCounts",
    value: function getSocketCounts() {
      var info = {
        nSockets: 0,
        nSocketsWithLivedataSessions: 0
      };
      _.each(this.meteor.default_server.stream_server.open_sockets, function (socket) {
        info.nSockets += 1;

        if (socket.meteor_session) {
          info.nSocketsWithLivedataSessions += 1;
        }
      });

      return info;
    }
  }, {
    key: "handle",
    value: function handle(req, res) {
      res.setHeader("content-type", "application/json");
      return res.end(JSON.stringify(this.getConnectionCounts()));
    }
  }, {
    key: "register",
    value: function register() {
      var _settings = this.settings,
          path = _settings.path,
          user = _settings.user,
          pass = _settings.pass;

      this.connectHandlers.use(path, this.connect.basicAuth(user, pass)).use(path, this.handle.bind(this));
    }
  }]);

  return ServerInfo;
}();

exports.default = ServerInfo;