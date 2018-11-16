import { Session } from "meteor/session";
import { Counter, IInfoData, IInfoDescription, IInfoSection } from "./types";
interface ISessionInfoData extends IInfoData {
    nDocuments: Counter;
    nSessions: number;
    nSubs: Counter;
    usersWithNSubscriptions: Counter;
}
/**
 * Provides the session-related information: sessions, subscriptions, documents.
 */
declare class SessionInfo implements IInfoSection {
    protected sessions: Array<typeof Session>;
    protected info: ISessionInfoData;
    /**
     * @param sessions
     *   The private structure held by Meteor for its sessions list.
     *
     * @constructor
     */
    constructor(sessions: Array<typeof Session>);
    /**
     * Describe the metrics provided by this service.
     */
    getDescription(): IInfoDescription;
    /**
     * Get session information.
     *
     * @returns
     *   - nSessions: the overall number of sessions
     *   - usersWithNSubscriptions: a Counter of the users count per number of subs.
     *   - nSubs: a Counter of subscriptions count per subscription name
     *   - nDocuments: a Counter of document counts per subscription
     */
    getInfo(): ISessionInfoData;
    /**
     * Build the session information into this.info.
     *
     * @param {Array} subscriptions
     *   The private structure held by Meteor for the subscriptions of a session.
     */
    protected buildSessionInfo(subscriptions: any[]): void;
    /**
     * Build the subscription information for a session into this.info.
     *
     * @param {Array} subscriptions
     *   The private structure held by Meteor for a subscription within a session.
     */
    protected buildSubscriptionInfoPerSession(subscriptions: any[]): void;
    /**
     * Ensure initialization of a counter. Do not modify it if alreay set.
     *
     * @param part
     *   The container for the counter.
     * @param key
     *   The counter name.
     */
    protected initKey(part: Counter, key: number | string): void;
    /**
     * Build the document information for a subscription into this.info.
     *
     * @param documents
     *   The private structure held by Meteor for the documents of a subscription.
     */
    protected _buildDocumentCountsPerSubscription(documents: any[]): void;
}
export { SessionInfo, };
