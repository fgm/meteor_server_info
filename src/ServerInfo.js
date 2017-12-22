import connect from "connect";

import SessionInfo from "./SessionInfo";
import MongoInfo from "./MongoInfo";

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
    const results = {};

    results.sockets = this.getSocketCounts();
    results.sessions = (new SessionInfo(this.meteor.default_server.sessions))
      .getInfo();
    results.mongo = (new MongoInfo(this.mongoInternals))
      .getInfo();

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
