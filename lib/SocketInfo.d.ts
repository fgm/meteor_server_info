import { IInfoData } from "./ServerInfo";
interface SocketInfoData extends IInfoData {
    nSockets: number;
    nSocketsWithLivedataSessions: number;
}
/**
 * Provides the socket-level information.
 */
declare class SocketInfo {
    sockets: any[];
    info: SocketInfoData;
    /**
     * Constructor.
     *
     * @param {Array} sockets
     *   The sockets opened on the active stream server.
     *
     * @constructor
     */
    constructor(sockets: any[]);
    /**
     * Describe the metrics provided by this service.
     *
     * @return {{
     *   nSockets: {type: string, label: string},
     *   nSocketsWithLivedataSessions: {type: string, label: string}
     * }}
     *  The description.
     */
    static getDescription(): {
        nSockets: {
            type: string;
            label: string;
        };
        nSocketsWithLivedataSessions: {
            type: string;
            label: string;
        };
    };
    /**
     * Check out the connections and what we know about them.
     *
     * @returns
     *   - nSockets: the global socket count
     *   - nSocketsWithLivedataSessions: the number of sockets with live data.
     */
    getInfo(): SocketInfoData;
}
export { SocketInfo, SocketInfoData, };
