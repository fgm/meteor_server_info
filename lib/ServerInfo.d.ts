import connect from "connect";
import { IncomingMessage, ServerResponse } from "http";
import "process";
import { WebApp } from "meteor/webapp";
import { CounterType } from "./NodeCounter/CounterFactory";
import { IInfoDescription, IInfoSection } from "./types";
interface IFacts {
    _factsByPackage: {
        [key: string]: any;
    };
}
interface IMeteor {
    default_server: any;
    settings: {
        [key: string]: any;
    };
}
interface IInfoDescriptions {
    [key: string]: IInfoDescription;
}
/**
 * The settings expected to be found in Meteor.settings.serverInfo.
 *
 * The eventLoopStrategy defaults to no measurement, to avoid their cost.
 */
interface IServerInfoSettings {
    eventLoopStrategy?: CounterType;
    pass: string;
    path: string;
    user: string;
    verbose: boolean;
}
declare type Connect2Auth = (user: string, pass: string) => (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
declare class ServerInfo {
    meteor: IMeteor;
    mongoInternals: object;
    facts: IFacts;
    sections: {
        [key: string]: IInfoSection;
    };
    connectHandlers: connect.Server;
    settings: IServerInfoSettings;
    /**
     * {constructor}
     *
     * @param {Meteor} meteor
     *   The Meteor global.
     * @param {WebApp} webApp
     *   The Meteor WebApp service.
     * @param {MongoInternals} mongoInternals
     *   The Meteor MongoInternals service.
     * @param {Facts} facts
     *   The Meteor Facts collector service.
     *
     * TODO check whether Meteor.default_server might actually change over time.
     */
    constructor(meteor: IMeteor, webApp: typeof WebApp, mongoInternals: object, facts: IFacts);
    /**
     * Collect the descriptions provided for the metrics.
     *
     * @return
     *   The descriptions
     */
    getDescriptions(): IInfoDescriptions;
    /**
     * Collect the information from Meteor structures.
     *
     * @return {{}}
     *   A plain object of metrics by name.
     */
    getInformation(): any;
    /**
     * Route controller serving the collected info.
     *
     * @param _
     *   A Connect request. Ignored.
     * @param res
     *   A Connect response.
     */
    handle(_: IncomingMessage, res: ServerResponse): void;
    /**
     * Route controller serving the documentation about the collected info.
     *
     * @param _
     *   A Connect request: ignored
     * @param res
     *   A Connect response.
     */
    handleDescription(_: IncomingMessage, res: ServerResponse): void;
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
    register(basicAuth?: Connect2Auth): void;
    /**
     * Reducer for getInformation().
     *
     * @param {{}} accu
     *   Accumulator.
     * @param {String} section
     *   The name of the information section.
     * @param {{}} infoInstance
     *   The section information.
     *
     * @return {*}
     *   The updated accumulator.
     *
     * @private
     *
     * @see ServerInfo.getInformation()
     */
    protected infoReducer(accu: any, [section, infoInstance]: [string, IInfoSection]): any;
}
export { ServerInfo, };
