"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CounterFactory = void 0;
var ElsCounter_1 = require("./ElsCounter");
var NrCounter_1 = require("./NrCounter");
var CounterFactory = /** @class */ (function () {
    function CounterFactory() {
    }
    CounterFactory.create = function (variant, log) {
        switch (variant) {
            case "cheap":
                throw new Meteor.Error("CheapCounter has been removed in release 1.2.6");
            case "costly":
                throw new Meteor.Error("CostlyCounter has been removed in release 1.2.6");
            case "nr":
                if (log != null) {
                    log("The NrCounter collector is deprecated");
                }
                return log ? new NrCounter_1.NrCounter(log) : new NrCounter_1.NrCounter();
            case "els":
                return log ? new ElsCounter_1.ElsCounter(false, log) : new ElsCounter_1.ElsCounter(false);
            default:
                throw new Error("Invalid NodeJS counter type " + variant + ".");
        }
    };
    return CounterFactory;
}());
exports.CounterFactory = CounterFactory;
//# sourceMappingURL=CounterFactory.js.map