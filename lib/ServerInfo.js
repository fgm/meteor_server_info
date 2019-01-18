"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("process");
// Module imports.
var MongoInfo_1 = require("./MongoInfo");
var CounterFactory_1 = require("./NodeCounter/CounterFactory");
var NodeInfo_1 = require("./NodeInfo");
var SessionInfo_1 = require("./SessionInfo");
var SocketInfo_1 = require("./SocketInfo");
var defaultSettings = {
    pass: "secureme",
    path: "/serverInfo",
    user: "insecure",
};
var ServerInfo = /** @class */ (function () {
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
    function ServerInfo(meteor, webApp, mongoInternals, facts, counterType) {
        this.meteor = meteor;
        this.mongoInternals = mongoInternals;
        this.facts = facts;
        this.settings = meteor.settings.serverInfo || defaultSettings;
        this.connectHandlers = webApp.connectHandlers;
        // We only use the Meteor default_server key, but we keep the whole Meteor
        // object in case the default_server key might change.
        var counter = (typeof counterType !== "undefined")
            ? CounterFactory_1.CounterFactory.create(counterType)
            : undefined;
        this.sections = {
            mongo: new MongoInfo_1.MongoInfo(this.mongoInternals),
            process: new NodeInfo_1.NodeInfo(process, counter),
            sessions: new SessionInfo_1.SessionInfo(this.meteor.default_server.sessions),
            sockets: new SocketInfo_1.SocketInfo(this.meteor.default_server.stream_server.open_sockets),
        };
    }
    /**
     * Collect the descriptions provided for the metrics.
     *
     * @return
     *   The descriptions
     */
    ServerInfo.prototype.getDescriptions = function () {
        var e_1, _a;
        var descriptions = {};
        try {
            for (var _b = __values(Object.entries(this.sections)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), name_1 = _d[0], section = _d[1];
                descriptions[name_1] = section.getDescription();
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return descriptions;
    };
    /**
     * Collect the information from Meteor structures.
     *
     * @return {{}}
     *   A plain object of metrics by name.
     */
    ServerInfo.prototype.getInformation = function () {
        var results = Object.entries(this.sections).reduce(this.infoReducer, {});
        results.facts = Object.assign({}, this.facts._factsByPackage);
        return results;
    };
    /**
     * Route controller serving the collected info.
     *
     * @param req
     *   A Connect request.
     * @param res
     *   A Connect response.
     */
    ServerInfo.prototype.handle = function (_, res) {
        res.setHeader("content-type", "application/json");
        return res.end(JSON.stringify(this.getInformation()));
    };
    /**
     * Route controller serving the documentation about the collected info.
     *
     * @param req
     *   A Connect request.
     * @param res
     *   A Connect response.
     */
    ServerInfo.prototype.handleDescription = function (_, res) {
        res.setHeader("content-type", "application/json");
        return res.end(JSON.stringify(this.getDescriptions()));
    };
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
    ServerInfo.prototype.register = function (basicAuth) {
        var _a = this.settings, path = _a.path, user = _a.user, pass = _a.pass;
        this.connectHandlers
            .use(path + "/doc", this.handleDescription.bind(this));
        if (typeof basicAuth !== "undefined") {
            this.connectHandlers.use(path, basicAuth(user, pass));
        }
        this.connectHandlers.use(path, this.handle.bind(this));
    };
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
    ServerInfo.prototype.infoReducer = function (accu, _a) {
        var _b = __read(_a, 2), section = _b[0], infoInstance = _b[1];
        var e_2, _c, _d, e_3, _e, _f;
        var infoData = infoInstance.getInfo();
        var idk = "";
        var idv = null;
        var infoRaw = {};
        try {
            for (var _g = __values(Object.entries(infoData)), _h = _g.next(); !_h.done; _h = _g.next()) {
                _d = __read(_h.value, 2), idk = _d[0], idv = _d[1];
                if (typeof idv === "number") {
                    infoRaw[idk] = idv;
                }
                else {
                    // Then it is a Counter: get the values from the map
                    var tmp = (infoRaw[idk] || {});
                    var idv2 = idv;
                    var k = "";
                    var v = 0;
                    try {
                        for (var idv2_1 = __values(idv2), idv2_1_1 = idv2_1.next(); !idv2_1_1.done; idv2_1_1 = idv2_1.next()) {
                            _f = __read(idv2_1_1.value, 2), k = _f[0], v = _f[1];
                            tmp[k] = v;
                        }
                    }
                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                    finally {
                        try {
                            if (idv2_1_1 && !idv2_1_1.done && (_e = idv2_1.return)) _e.call(idv2_1);
                        }
                        finally { if (e_3) throw e_3.error; }
                    }
                    infoRaw[idk] = tmp;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_h && !_h.done && (_c = _g.return)) _c.call(_g);
            }
            finally { if (e_2) throw e_2.error; }
        }
        accu[section] = infoRaw;
        return accu;
    };
    return ServerInfo;
}());
exports.ServerInfo = ServerInfo;
//# sourceMappingURL=ServerInfo.js.map