"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Provides the session-related information: sessions, subscriptions, documents.
 */
var SessionInfo = /** @class */ (function () {
    /**
     * @param sessions
     *   The private structure held by Meteor for its sessions list.
     *
     * @constructor
     */
    function SessionInfo(sessions) {
        this.sessions = sessions;
        this.info = this.defaultInfo();
    }
    /**
     * Describe the metrics provided by this service.
     */
    SessionInfo.prototype.getDescription = function () {
        var description = {
            nDocuments: {
                label: "Total number of documents across subscriptions. Each appearance in a subscription counts.",
                type: "Map",
            },
            nSessions: {
                label: "Number of sessions",
                type: "number",
            },
            nSubs: {
                label: "Total number of Subscriptions  across sessions",
                type: "Map",
            },
            usersWithNSubscriptions: {
                label: "User counts per subscription count",
                type: "Map",
            },
        };
        return description;
    };
    /**
     * Get session information.
     *
     * @return
     *   - nSessions: the overall number of sessions
     *   - usersWithNSubscriptions: a Counter of the users count per number of subs.
     *   - nSubs: a Counter of subscriptions count per subscription name
     *   - nDocuments: a Counter of document counts per subscription
     */
    SessionInfo.prototype.getInfo = function () {
        this.info = this.defaultInfo();
        this.info.nSessions = Object.keys(this.sessions).length;
        for (var _i = 0, _a = Object.values(this.sessions); _i < _a.length; _i++) {
            var session = _a[_i];
            session = {
                _namedSubs: session._namedSubs,
                id: session.id,
            };
            this.addPerSessionInfo(Object.values(session._namedSubs));
        }
        return this.info;
    };
    /**
     * Add the session information to this.info.
     *
     * @param subscriptions
     *   The private structure held by Meteor for the subscriptions of a session.
     */
    SessionInfo.prototype.addPerSessionInfo = function (subscriptions) {
        var subCount = subscriptions.length;
        this.incrementCounter(this.info.usersWithNSubscriptions, subCount);
        this.addPerSessionSubscriptionInfo(subscriptions);
    };
    /**
     * Build the subscription information for a session into this.info.
     *
     * @param subscriptions
     *   The private structure held by Meteor for a subscription within a session.
     */
    SessionInfo.prototype.addPerSessionSubscriptionInfo = function (subscriptions) {
        for (var _i = 0, subscriptions_1 = subscriptions; _i < subscriptions_1.length; _i++) {
            var subscription = subscriptions_1[_i];
            subscription = {
                _documents: subscription._documents,
                _name: subscription._name,
            };
            this.incrementCounter(this.info.nSubs, subscription._name);
            this._buildDocumentCountsPerSubscription(subscription._documents);
        }
    };
    /**
     * Provide info initialization data, to allow recalculating it on an instance.
     */
    SessionInfo.prototype.defaultInfo = function () {
        return {
            nDocuments: new Map(),
            nSessions: 0,
            nSubs: new Map(),
            usersWithNSubscriptions: new Map(),
        };
    };
    /**
     * Increment counter value for a key, initializing if needed.
     *
     * @param counter
     * @param key
     * @param increment
     */
    SessionInfo.prototype.incrementCounter = function (counter, key, increment) {
        if (increment === void 0) { increment = 1; }
        this.initKey(counter, key);
        // get() is guaranteed to be defined because we just did initKey().
        // TODO: inline after Node >= 10.7 when NanoTs is removed.
        var val = counter.get(key);
        counter.set(key, val + increment);
    };
    /**
     * Ensure initialization of a counter. Do not modify it if alreay set.
     *
     * @param part
     *   The container for the counter.
     * @param key
     *   The counter name.
     */
    SessionInfo.prototype.initKey = function (part, key) {
        if (!part.has(key)) {
            part.set(key, 0);
        }
    };
    /**
     * Build the document information for a subscription into this.info.
     *
     * @param documents
     *   The private structure held by Meteor for the documents of a subscription.
     */
    SessionInfo.prototype._buildDocumentCountsPerSubscription = function (documents) {
        var entries = Object.entries(documents);
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entry = entries_1[_i];
            // Inlining the destructuring in for() loses type information, so do it here.
            var type = entry[0], document_1 = entry[1];
            this.incrementCounter(this.info.nDocuments, type, Object.keys(document_1).length);
        }
    };
    return SessionInfo;
}());
exports.SessionInfo = SessionInfo;
