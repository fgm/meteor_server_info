import {IInfoData, IInfoDescription, IInfoSection } from "./types";

interface ISocketInfoData extends IInfoData {
  nSockets: number,
  nSocketsWithLivedataSessions: number,
}

/**
 * Provides the socket-level information.
 */
class SocketInfo implements IInfoSection {
  protected info: ISocketInfoData;

  /**
   * Constructor.
   *
   * @param {Array} sockets
   *   The sockets opened on the active stream server.
   *
   * @constructor
   */
  constructor(protected sockets: any[]) {
    this.info = this.defaultInfo();
  }

  /**
   * Describe the metrics provided by this service.
   *
   * @return {{
   *   nSockets: {type: string, label: string},
   *   nSocketsWithLivedataSessions: {type: string, label: string}
   * }}
   *  The description.
   */
  public getDescription(): IInfoDescription {
    const description = {
      nSockets:                     { type: "integer", label: "Open sockets" },
      nSocketsWithLivedataSessions: { type: "integer", label: "Sockets with session" },
    };

    return description;
  }

  /**
   * Check out the connections and what we know about them.
   *
   * @return
   *   - nSockets: the global socket count
   *   - nSocketsWithLivedataSessions: the number of sockets with live data.
   */
  public getInfo(): ISocketInfoData {
    this.info = this.defaultInfo();
    for (const socket of this.sockets) {
      this.info.nSockets += 1;

      // Name apparently changed across Meteor versions.
      if (socket._meteorSession || socket.meteor_session) {
        this.info.nSocketsWithLivedataSessions += 1;
      }
    }

    return this.info;
  }

  private defaultInfo(): ISocketInfoData {
    return {
      nSockets: 0,
      nSocketsWithLivedataSessions: 0,
    };
  }
}

export {
  SocketInfo,
  ISocketInfoData,
};
