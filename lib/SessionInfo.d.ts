import { Counter, IInfoData, IInfoDescription, IInfoSection } from "./types";
interface ISessionInfoData extends IInfoData {
    nDocuments: Counter;
    nSessions: number;
    nSubs: Counter;
    usersWithNSubscriptions: Counter;
}
interface INamedSessions {
    [key: string]: ISession;
}
interface INamedSubscriptions {
    [subscriptionName: string]: ISubscription;
}
interface ISession {
    _namedSubs: INamedSubscriptions;
    _universalSubs?: ISubscription[];
    id: string;
}
interface ISubscription {
    _documents: ISubscriptionDocuments;
    _name: string;
}
interface IDocumentIds {
    [_id: string]: boolean;
}
interface ISubscriptionDocuments {
    [collection: string]: IDocumentIds;
}
/**
 * Provides the session-related information: sessions, subscriptions, documents.
 */
declare class SessionInfo implements IInfoSection {
    protected sessions: INamedSessions;
    protected info: ISessionInfoData;
    /**
     * @param sessions
     *   The private structure held by Meteor for its sessions list.
     *
     * @constructor
     */
    constructor(sessions: INamedSessions);
    /**
     * Describe the metrics provided by this service.
     */
    getDescription(): IInfoDescription;
    /**
     * Get session information.
     *
     * @return
     *   - nSessions: the overall number of sessions
     *   - usersWithNSubscriptions: a Counter of the users count per number of subs.
     *   - nSubs: a Counter of subscriptions count per subscription name
     *   - nDocuments: a Counter of document counts per subscription
     */
    getInfo(): ISessionInfoData;
    /**
     * Add the session information to this.info.
     *
     * @param subscriptions
     *   The private structure held by Meteor for the subscriptions of a session.
     */
    protected addPerSessionInfo(subscriptions: ISubscription[]): void;
    /**
     * Build the subscription information for a session into this.info.
     *
     * @param subscriptions
     *   The private structure held by Meteor for a subscription within a session.
     */
    protected addPerSessionSubscriptionInfo(subscriptions: ISubscription[]): void;
    /**
     * Provide info initialization data, to allow recalculating it on an instance.
     */
    protected defaultInfo(): ISessionInfoData;
    /**
     * Increment counter value for a key, initializing if needed.
     *
     * @param counter
     * @param key
     * @param increment
     */
    protected incrementCounter(counter: Counter, key: any, increment?: number): void;
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
    protected _buildDocumentCountsPerSubscription(documents: ISubscriptionDocuments): void;
}
export { ISessionInfoData, SessionInfo, INamedSessions, ISubscription, };
