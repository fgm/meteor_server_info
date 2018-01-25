"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _SessionInfo = require("./SessionInfo");

var _SessionInfo2 = _interopRequireDefault(_SessionInfo);

var _MongoInfo = require("./MongoInfo");

var _MongoInfo2 = _interopRequireDefault(_MongoInfo);

var _SocketInfo = require("./SocketInfo");

var _SocketInfo2 = _interopRequireDefault(_SocketInfo);

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
      var sources = {
        'sockets': new _SocketInfo2.default(this.meteor.default_server.stream_server.open_sockets),
        'sessions': new _SessionInfo2.default(this.meteor.default_server.sessions),
        'mongo': new _MongoInfo2.default(this.mongoInternals)
      };

      var results = Object.entries(sources).reduce(this.infoReducer, {});

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

  }, {
    key: "handle",


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
    value: function handle(req, res) {
      res.setHeader("content-type", "application/json");
      return res.end(JSON.stringify(this.getConnectionCounts()));
    }
  }, {
    key: "handleDescription",
    value: function handleDescription(req, res) {
      res.setHeader("content-type", "application/json");
      return res.end(JSON.stringify(ServerInfo.getDescriptions()));
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

  }, {
    key: "infoReducer",
    value: function infoReducer(accu, _ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          section = _ref2[0],
          info = _ref2[1];

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

  }, {
    key: "register",
    value: function register(basicAuth) {
      var _settings = this.settings,
          path = _settings.path,
          user = _settings.user,
          pass = _settings.pass;

      this.connectHandlers.use(path + '/doc', this.handleDescription.bind(this));

      if (typeof basicAuth !== 'undefined') {
        this.connectHandlers.use(path, this.connect.basicAuth(user, pass));
      }
      this.connectHandlers.use(path, this.handle.bind(this));
    }
  }], [{
    key: "getDescriptions",
    value: function getDescriptions() {
      var descriptions = {
        'sockets': _SocketInfo2.default.getDescription(),
        'sessions': _SessionInfo2.default.getDescription(),
        'mongo': _MongoInfo2.default.getDescription()
      };

      return descriptions;
    }
  }]);

  return ServerInfo;
}();

exports.default = ServerInfo;