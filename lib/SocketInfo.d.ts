import { IInfoData, IInfoDescription, IInfoSection } from "./types";
interface ISocketInfoData extends IInfoData {
    nSockets: number;
    nSocketsWithLivedataSessions: number;
}
/**
 * Provides the socket-level information.
 */
declare class SocketInfo implements IInfoSection {
    protected sockets: any[];
    protected info: ISocketInfoData;
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
    getDescription(): IInfoDescription;
    /**
     * Check out the connections and what we know about them.
     *
     * @returns
     *   - nSockets: the global socket count
     *   - nSocketsWithLivedataSessions: the number of sockets with live data.
     */
    getInfo(): ISocketInfoData;
}
export { SocketInfo, ISocketInfoData, };
