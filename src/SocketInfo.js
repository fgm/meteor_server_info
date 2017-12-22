/**
 * Provides the socket-level information.
 */
class SocketInfo {
  /**
   * Constructor.
   *
   * @param {Array} sockets
   *   The sockets opened on the active stream server.
   *
   * @constructor
   */
  constructor(sockets) {
    this.info = {
      nSockets: 0,
      nSocketsWithLivedataSessions: 0
    };
    this.sockets = sockets;
  }
  /**
   * Check out the connections and what we know about them
   *
   * @returns {Object}
   *   - nSockets: the global socket count
   *   - nSocketsWithLivedataSessions: the number of sockets with live data.
   */
  getInfo() {
    for (const socket of this.sockets) {
      this.info.nSockets += 1;

      if (socket.meteor_session) {
        this.info.nSocketsWithLivedataSessions += 1;
      }
    }

    return this.info;
  }
}

export default SocketInfo;
