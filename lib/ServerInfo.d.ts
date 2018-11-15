/// <reference types="node" />
import connect from "connect";
import { IncomingMessage, ServerResponse } from "http";
import "process";
import { WebApp } from "meteor/webapp";
import { NodeInfoStore } from "./NodeInfo";
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
interface IInfoData {
    [key: string]: number | Counter;
}
interface IInfoSection {
    getInfo: () => IInfoData;
}
interface ServerInfoSettings {
    path: string;
    user: string;
    pass: string;
}
declare type Counter = Map<number | string, number>;
declare type Connect2Auth = (user: string, pass: string) => (req: IncomingMessage, res: ServerResponse, next: Function) => void;
declare const ServerInfo: {
    new (meteor: IMeteor, webApp: typeof WebApp, mongoInternals: object, facts: IFacts): {
        connectHandlers: connect.Server;
        settings: ServerInfoSettings;
        store: {
            process: NodeInfoStore;
        };
        meteor: IMeteor;
        mongoInternals: object;
        facts: IFacts;
        /**
         * Collect the information from Meteor structures.
         *
         * @returns {{}}
         *   A plain object of metrics by name.
         */
        getInformation(): any;
        /**
         * Route controller serving the collected info.
         *
         * @param req
         *   A Connect request.
         * @param res
         *   A Connect response.
         */
        handle(_req: IncomingMessage, res: ServerResponse): void;
        /**
         * Route controller serving the documentation about the collected info.
         *
         * @param req
         *   A Connect request.
         * @param res
         *   A Connect response.
         */
        handleDescription(_req: IncomingMessage, res: ServerResponse): void;
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
        infoReducer(accu: any, [section, infoInstance]: [string, IInfoSection]): any;
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
        register(basicAuth?: Connect2Auth | undefined): void;
    };
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
    getDescriptions(): {
        "sockets": {
            nSockets: {
                type: string;
                label: string;
            };
            nSocketsWithLivedataSessions: {
                type: string;
                label: string;
            };
        };
        "sessions": {
            nDocuments: {
                type: string;
                label: string;
            };
            nSessions: {
                type: string;
                label: string;
            };
            nSubs: {
                type: string;
                label: string;
            };
            usersWithNSubscriptions: {
                type: string;
                label: string;
            };
        };
        "mongo": {
            nObserveHandles: {
                type: string;
                label: string;
            };
            oplogObserveHandles: {
                type: string;
                label: string;
            };
            oplogObserveHandlesCount: {
                type: string;
                label: string;
            };
            pollingObserveHandles: {
                type: string;
                label: string;
            };
            pollingObserveHandlesCount: {
                type: string;
                label: string;
            };
        };
        "process": {
            cpuUser: {
                type: string;
                label: string;
            };
            cpuSystem: {
                type: string;
                label: string;
            };
            ramExternal: {
                type: string;
                label: string;
            };
            ramHeapTotal: {
                type: string;
                label: string;
            };
            ramHeapUsed: {
                type: string;
                label: string;
            };
            ramRss: {
                type: string;
                label: string;
            };
        };
    };
};
export { Counter, IInfoData, IInfoSection, ServerInfo, NodeInfoStore, };
