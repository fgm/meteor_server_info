/**
 * Provides the session-related information: sessions, subscriptions, documents.
 */
class SessionInfo {
  /**
   * @param {Object} sessions
   *   The private structure held by Meteor for its sessions list.
   *
   * @constructor
   */
  constructor(sessions) {
    this.info = {
      nDocuments: {},
      nSessions: 0,
      nSubs: {},
      usersWithNSubscriptions: {}
    };
    this.sessions = sessions;
  }

  /**
   * Ensure initialization of a counter. Do not modify it if alreay set.
   *
   * @param {Object} part
   *   The container for the counter.
   * @param {Number|String} key
   *   The counter name.
   *
   * @returns {void}
   *
   * @private
   */
  initKey(part, key) {
    part[key] = part[key] || 0;
  }

  /**
   * Build the document information for a subscription into this.info.
   *
   * @param {Object} documents
   *   The private structure held by Meteor for the documents of a subscription.
   *
   * @returns {void}
   *
   * @private
   */
  _buildDocumentCountsPerSubscription(documents) {
    for (const [type, document] of Object.entries(documents)) {
      this.initKey(this.info.nDocuments, type);
      this.info.nDocuments[type] += Object.keys(document).length;
    }
  }

  /**
   * Build the subscription information for a session into this.info.
   *
   * @param {Array} subscriptions
   *   The private structure held by Meteor for a subscription within a session.
   *
   * @returns {void}
   *
   * @private
   */
  buildSubscriptionInfoPerSession(subscriptions) {
    for (const subscription of subscriptions) {
      this.initKey(this.info.nSubs, subscription._name);
      this.info.nSubs[subscription._name] += 1;
      this._buildDocumentCountsPerSubscription(subscription._documents);
    }
  }

  /**
   * Build the session information into this.info.
   *
   * @param {Array} subscriptions
   *   The private structure held by Meteor for the subscriptions of a session.
   *
   * @returns {void}
   *
   * @private
   */
  buildSessionInfo(subscriptions) {
    this.info.nSessions += 1;
    const subCount = subscriptions.length;
    this.initKey(this.info.usersWithNSubscriptions, subCount);
    this.info.usersWithNSubscriptions[subCount] += 1;
    this.buildSubscriptionInfoPerSession(subscriptions);
  }

  /**
   * Get session information.
   *
   * @returns {Object}
   *   - nSessions: the overall number of sessions
   *   - usersWithNSubscriptions: a hash of the users count per number of subs.
   *   - nSubs: a hash of subscriptions count per subscription name
   *   - nDocuments: a hash of document counts per subscription
   */
  getInfo() {
    for (const session of Object.values(this.sessions)) {
      this.buildSessionInfo(Object.values(session._namedSubs));
    }

    return this.info;
  }
}

export default SessionInfo;
