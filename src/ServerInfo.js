import "process";

import SessionInfo from "./SessionInfo";
import MongoInfo from "./MongoInfo";
import NodeInfo from "./NodeInfo";
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
      pass: "secureme",
    };
    this.connectHandlers = WebApp.connectHandlers;
    this.facts = Facts;
    // We only use its default_server key, but we keep the whole Meteor object
    // in case the default_server key might change.
    this.meteor = Meteor;
    this.mongoInternals = MongoInternals;
    this.store = {
      "process": {},
    };
  }

  /**
   * Collect the information from Meteor structures.
   *
   * @returns {{}}
   *   A plain object of metrics by name.
   */
  getInformation() {
    const sources = {
      "sockets":  new SocketInfo(this.meteor.default_server.stream_server.open_sockets),
      "sessions": new SessionInfo(this.meteor.default_server.sessions),
      "mongo":    new MongoInfo(this.mongoInternals),
      "process":  new NodeInfo(process, this.store.process),
    };

    const results = Object.entries(sources).reduce(this.infoReducer, {});

    results.facts = Object.assign({}, this.facts._factsByPackage);

    return results;
  }

  /**
   * Collect the descriptions provided for the metrics.
   *
   * @return {{
   * sockets: {},
   * sessions: {},
   * mongo: {}
   * }}
   *   The descriptions
   */
  static getDescriptions() {
    const descriptions = {
      "sockets":  SocketInfo.getDescription(),
      "sessions": SessionInfo.getDescription(),
      "mongo":    MongoInfo.getDescription(),
      "process":  NodeInfo.getDescription(),
    };

    return descriptions;
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
    return res.end(JSON.stringify(this.getInformation()));
  }

  handleDescription(req, res) {
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify(ServerInfo.getDescriptions()));
  }

  /**
   * Reducer for getInformation().
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
   * @see ServerInfo.getInformation()
   */
  infoReducer(accu, [section, info]) {
    accu[section] = info.getInfo();
    return accu;
  }

  /**
   * Register a web route for the module.
   *
   * @param {Function} basicAuth
   *   Optional. Pass the connect.basicAuth middleware from Connect 2.x here to
   *   apply basic authentication to the info path using the user/pass from
   *   settings.json. If this middleware is not passed, the info route will be
   *   public, and assume it is protected by other means.
   *
   * @return {void}
   */
  register(basicAuth = null) {
    const { path, user, pass } = this.settings;
    this.connectHandlers
      .use(path + "/doc", this.handleDescription.bind(this));

    if (basicAuth !== null) {
      this.connectHandlers.use(path, this.connect.basicAuth(user, pass));
    }
    this.connectHandlers.use(path, this.handle.bind(this));
  }
};

export default ServerInfo;
