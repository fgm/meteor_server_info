import connect from "connect";

import SessionInfo from "./SessionInfo";

const ServerInfo = class ServerInfo {
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
  constructor(Meteor, WebApp, MongoInternals, Facts) {
    this.settings = Meteor.settings.serverInfo || {
      path: "/serverInfo",
      user: "insecure",
      pass: "secureme"
    };
    this.connect = connect;
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
  getConnectionCounts() {
    const results = {
      nLiveResultsSets: 0,
      nObserveHandles: 0,
      oplogObserveHandlesCount: 0,
      pollingObserveHandlesCount: 0,
      oplogObserveHandles: {},
      pollingObserveHandles: {},
    };

    results.sockets = this.getSocketCounts();
    results.sessions = (new SessionInfo(this.meteor.default_server.sessions))
      .getSessionInfo();

    _.each(this.mongoInternals.defaultRemoteCollectionDriver().mongo._observeMultiplexers, function (muxer) {
      _.each(muxer._handles, function (handle) {
        results.nObserveHandles += 1;

        const logStat = function (type, collectionName) {
          results[type + 'Count'] += 1;
          results[type][collectionName] = results[type][collectionName] || 0
          results[type][collectionName] += 1;
        };

        const driver = handle._observeDriver || muxer._observeDriver;
        const collectionName = driver._cursorDescription.collectionName;
        if (driver._usesOplog) {
          logStat('oplogObserveHandles', collectionName);
        }
        else {
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
  getSocketCounts() {
    const info = {
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

  handle(req, res) {
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify(this.getConnectionCounts()));
  }

  register() {
    const { path, user, pass } = this.settings;
    this.connectHandlers
      .use(path, this.connect.basicAuth(user, pass))
      .use(path, this.handle.bind(this));
  }
};

export default ServerInfo;
