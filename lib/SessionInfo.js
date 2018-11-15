"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
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
        this.info = {
            nDocuments: new Map(),
            nSessions: 0,
            nSubs: new Map(),
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
        var e_1, _a;
        try {
            for (var _b = __values(Object.entries(documents)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), type = _d[0], document_1 = _d[1];
                this.initKey(this.info.nDocuments, type);
                // get() is guaranteed to be defined because we just did initKey().
                this.info.nDocuments.set(type, this.info.nDocuments.get(type) + Object.keys(document_1).length);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    /**
     * Build the subscription information for a session into this.info.
     *
     * @param {Array} subscriptions
     *   The private structure held by Meteor for a subscription within a session.
     */
    SessionInfo.prototype.buildSubscriptionInfoPerSession = function (subscriptions) {
        var e_2, _a;
        try {
            for (var subscriptions_1 = __values(subscriptions), subscriptions_1_1 = subscriptions_1.next(); !subscriptions_1_1.done; subscriptions_1_1 = subscriptions_1.next()) {
                var subscription = subscriptions_1_1.value;
                this.initKey(this.info.nSubs, subscription._name);
                // get() is guaranteed to be defined because we just did initKey().
                this.info.nSubs.set(subscription._name, this.info.nSubs.get(subscription._name) + 1);
                this._buildDocumentCountsPerSubscription(subscription._documents);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (subscriptions_1_1 && !subscriptions_1_1.done && (_a = subscriptions_1.return)) _a.call(subscriptions_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
    };
    /**
     * Build the session information into this.info.
     *
     * @param {Array} subscriptions
     *   The private structure held by Meteor for the subscriptions of a session.
     */
    SessionInfo.prototype.buildSessionInfo = function (subscriptions) {
        this.info.nSessions += 1;
        var subCount = subscriptions.length;
        this.initKey(this.info.usersWithNSubscriptions, subCount);
        this.info.usersWithNSubscriptions.set(subCount, this.info.usersWithNSubscriptions.get(subCount) + 1);
        this.buildSubscriptionInfoPerSession(subscriptions);
    };
    /**
     * Describe the metrics provided by this service.
     */
    SessionInfo.getDescription = function () {
        var description = {
            nDocuments: { type: "array", label: "Documents per subscription[][]" },
            nSessions: { type: "int", label: "Sessions" },
            nSubs: { type: "array", label: "Subscriptions per session[]" },
            usersWithNSubscriptions: { type: "array", label: "User counts per subscription count[]" },
        };
        return description;
    };
    /**
     * Get session information.
     *
     * @returns
     *   - nSessions: the overall number of sessions
     *   - usersWithNSubscriptions: a Counter of the users count per number of subs.
     *   - nSubs: a Counter of subscriptions count per subscription name
     *   - nDocuments: a Counter of document counts per subscription
     */
    SessionInfo.prototype.getInfo = function () {
        var e_3, _a;
        try {
            for (var _b = __values(Object.values(this.sessions)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var session = _c.value;
                var session2 = session;
                this.buildSessionInfo(Object.values(session2._namedSubs));
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return this.info;
    };
    return SessionInfo;
}());
exports.default = SessionInfo;
//# sourceMappingURL=SessionInfo.js.map