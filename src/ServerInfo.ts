// Node.JS imports.
import connect from "connect";
import {IncomingMessage, ServerResponse} from "http";
import "process";

// Meteor imports.
// Not exposed
// import { Facts } from "meteor/facts";
// Not really usable
// import { Meteor } from "meteor/meteor";
// Not exposed
// import { MongoInternals } from "meteor/mongo";
import {WebApp} from "meteor/webapp";

// Module imports.
import {MongoInfo} from "./MongoInfo";
import {NodeInfo} from "./NodeInfo";
import {SessionInfo} from "./SessionInfo";
import {SocketInfo} from "./SocketInfo";
import {Counter, IInfoDescription, IInfoSection } from "./types";

interface IFacts {
  _factsByPackage: {
    [key: string]: any,
  }
}

interface IMeteor {
  default_server: any,
  settings: {
    [key: string]: any,
  },
}

interface IInfoDescriptions {
  [key: string]: IInfoDescription,
}

interface IServerInfoSettings {
  pass: string,
  path: string,
  user: string,
}

const defaultSettings: IServerInfoSettings = {
  pass: "secureme",
  path: "/serverInfo",
  user: "insecure",
};

// Connect 2 Authentication returns a middleware.
type Connect2Auth = (user: string, pass: string) =>
  (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

class ServerInfo {
  public sections: {
    [key: string]: IInfoSection,
  };
  public connectHandlers: connect.Server;
  public settings: IServerInfoSettings;

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
  constructor(
    public meteor: IMeteor,
    webApp: typeof WebApp,
    public mongoInternals: object,
    public facts: IFacts,
  ) {
    this.settings = meteor.settings.serverInfo as IServerInfoSettings || defaultSettings;
    this.connectHandlers = webApp.connectHandlers;
    // We only use the Meteor default_server key, but we keep the whole Meteor
    // object in case the default_server key might change.
    this.sections = {
      mongo:    new MongoInfo(this.mongoInternals),
      process:  new NodeInfo(process),
      sessions: new SessionInfo(this.meteor.default_server.sessions),
      sockets:  new SocketInfo(this.meteor.default_server.stream_server.open_sockets),
    };
  }

  /**
   * Collect the descriptions provided for the metrics.
   *
   * @return
   *   The descriptions
   */
  public getDescriptions(): IInfoDescriptions {
    const descriptions: IInfoDescriptions = {};
    for (const [name, section] of Object.entries(this.sections)) {
      descriptions[name] = section.getDescription();
    }

    return descriptions;
  }

  /**
   * Collect the information from Meteor structures.
   *
   * @return {{}}
   *   A plain object of metrics by name.
   */
  public getInformation() {
    const results = Object.entries(this.sections).reduce(this.infoReducer, {});
    results.facts = Object.assign({}, this.facts._factsByPackage);

    return results;
  }

  /**
   * Route controller serving the collected info.
   *
   * @param req
   *   A Connect request.
   * @param res
   *   A Connect response.
   */
  public handle(_: IncomingMessage, res: ServerResponse): void {
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify(this.getInformation()));
  }

  /**
   * Route controller serving the documentation about the collected info.
   *
   * @param req
   *   A Connect request.
   * @param res
   *   A Connect response.
   */
  public handleDescription(_: IncomingMessage, res: ServerResponse) {
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify(this.getDescriptions()));
  }

  /**
   * Register a web route for the module.
   *
   * @param basicAuth
   *   Optional. Pass the connect.basicAuth middleware from Connect 2.x here to
   *   apply basic authentication to the info path using the user/pass from
   *   settings.json. If this middleware is not passed, the info route will be
   *   public, and assume it is protected by other means.
   *
   * @return {void}
   */
  public register(basicAuth?: Connect2Auth) {
    const { path, user, pass } = this.settings;
    this.connectHandlers
      .use(path + "/doc", this.handleDescription.bind(this));

    if (typeof basicAuth !== "undefined") {
      this.connectHandlers.use(path, basicAuth!(user, pass));
    }
    this.connectHandlers.use(path, this.handle.bind(this));
  }

  /**
   * Reducer for getInformation().
   *
   * @param  {{}} accu
   *   Accumulator.
   * @param {String} section
   *   The name of the information section.
   * @param  {{}} infoInstance
   *   The section information.
   *
   * @return {*}
   *   The updated accumulator.
   *
   * @private
   *
   * @see ServerInfo.getInformation()
   */
  protected infoReducer(accu: any, [section, infoInstance]: [string, IInfoSection]) {
    interface IValues {
      [key: string]: number,
      [key: number]: number,
    }
    const infoData = infoInstance.getInfo();
    let idk = "";
    let idv = null;
    const infoRaw: {
      [key: string]: number|IValues,
    } = {};
    for ([idk, idv] of Object.entries(infoData)) {
      if (typeof idv === "number") {
        infoRaw[idk] = idv;
      } else {
        // Then it is a Counter: get the values from the map
        const tmp: IValues = (infoRaw[idk] || {}) as IValues;
        const idv2: Counter = idv;
        let k: number|string = "";
        let v: number = 0;
        for ([k, v] of idv2) {
          tmp[k] = v;
        }
        infoRaw[idk] = tmp;
      }
    }

    accu[section] = infoRaw;
    return accu;
  }
}

export {
  ServerInfo,
};
