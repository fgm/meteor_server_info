import {Counter, IInfoData} from "./ServerInfo";
import {Session} from "meteor/session";

interface SessionInfoData extends IInfoData {
  nDocuments: Counter,
  nSessions: number,
  nSubs: Counter,
  usersWithNSubscriptions: Counter,
}

/**
 * Provides the session-related information: sessions, subscriptions, documents.
 */
class SessionInfo {
  public info: SessionInfoData;

  /**
   * @param sessions
   *   The private structure held by Meteor for its sessions list.
   *
   * @constructor
   */
  constructor(public sessions: (typeof Session)[]) {
    this.info = {
      nDocuments:              new Map(),
      nSessions:               0,
      nSubs:                   new Map(),
      usersWithNSubscriptions: new Map(),
    };
    this.sessions = sessions;
  }

  /**
   * Ensure initialization of a counter. Do not modify it if alreay set.
   *
   * @param part
   *   The container for the counter.
   * @param key
   *   The counter name.
   */
  protected initKey(part: Counter, key: number|string): void {
    if (!part.has(key)) {
      part.set(key, 0);
    }
  }

  /**
   * Build the document information for a subscription into this.info.
   *
   * @param documents
   *   The private structure held by Meteor for the documents of a subscription.
   */
  protected _buildDocumentCountsPerSubscription(documents: any[]): void {
    for (const [type, document] of Object.entries(documents)) {
      this.initKey(this.info.nDocuments, type);
      // get() is guaranteed to be defined because we just did initKey().
      this.info.nDocuments.set(type, this.info.nDocuments.get(type)! + Object.keys(document).length);
    }
  }

  /**
   * Build the subscription information for a session into this.info.
   *
   * @param {Array} subscriptions
   *   The private structure held by Meteor for a subscription within a session.
   */
  protected buildSubscriptionInfoPerSession(subscriptions: any[]): void {
    for (const subscription of subscriptions) {
      this.initKey(this.info.nSubs, subscription._name);
      // get() is guaranteed to be defined because we just did initKey().
      this.info.nSubs.set(subscription._name, this.info.nSubs.get(subscription._name)! + 1);
      this._buildDocumentCountsPerSubscription(subscription._documents);
    }
  }

  /**
   * Build the session information into this.info.
   *
   * @param {Array} subscriptions
   *   The private structure held by Meteor for the subscriptions of a session.
   */
  protected buildSessionInfo(subscriptions: any[]): void {
    this.info.nSessions += 1;
    const subCount = subscriptions.length;
    this.initKey(this.info.usersWithNSubscriptions, subCount);
    this.info.usersWithNSubscriptions.set(subCount, this.info.usersWithNSubscriptions.get(subCount)! + 1);
    this.buildSubscriptionInfoPerSession(subscriptions);
  }

  /**
   * Describe the metrics provided by this service.
   */
  public static getDescription() {
    const description = {
      nDocuments:              { type: "array", label: "Documents per subscription[][]" },
      nSessions:               { type: "int", label: "Sessions" },
      nSubs:                   { type: "array", label: "Subscriptions per session[]" },
      usersWithNSubscriptions: { type: "array", label: "User counts per subscription count[]" },
    };

    return description;
  }

  /**
   * Get session information.
   *
   * @returns
   *   - nSessions: the overall number of sessions
   *   - usersWithNSubscriptions: a Counter of the users count per number of subs.
   *   - nSubs: a Counter of subscriptions count per subscription name
   *   - nDocuments: a Counter of document counts per subscription
   */
  getInfo(): SessionInfoData {
    for (const session of Object.values(this.sessions)) {
      const session2 = session as unknown as { _namedSubs: any };
      this.buildSessionInfo(Object.values(session2._namedSubs));
    }

    return this.info;
  }
}

export default SessionInfo;
