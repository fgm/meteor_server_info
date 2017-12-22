import connect from "connect";

import SessionInfo from "./SessionInfo";
import MongoInfo from "./MongoInfo";
import SocketInfo from "./SocketInfo";

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
    const sources = {
      'sockets': new SocketInfo(this.meteor.default_server.stream_server.open_sockets),
      'sessions': new SessionInfo(this.meteor.default_server.sessions),
      'mongo': new MongoInfo(this.mongoInternals)
    };

    const results = Object.entries(sources).reduce(this.infoReducer, {});

    results.facts = Object.assign({}, this.facts._factsByPackage);

    return results;
  }

  /**
   * Route controller serving the collected info.
   *
   * @param {Request} req
   *   A Connect request.
   * @param {Response} res
   *   A Connect response.
   *
   * @return {void}
   */
  handle(req, res) {
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify(this.getConnectionCounts()));
  }

  /**
   * Reducer for getConnectionCounts().
   *
   * @param  {{}} accu
   *   Accumulator.
   * @param {String} section
   *   The name of the information section.
   * @param  {{}} info
   *   The section information.
   *
   * @return {*}
   *   The updated accumulator.
   *
   * @private
   *
   * @see ServerInfo.getConnectionCounts()
   */
  infoReducer(accu, [section, info]) {
    accu[section] = info.getInfo();
    return accu;
  }

  /**
   * Register a web route for the module.
   *
   * @return {void}
   */
  register() {
    const { path, user, pass } = this.settings;
    this.connectHandlers
      .use(path, this.connect.basicAuth(user, pass))
      .use(path, this.handle.bind(this));
  }
};

export default ServerInfo;
