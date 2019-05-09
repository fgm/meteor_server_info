"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CheapCounter_1 = require("./CheapCounter");
var CostlyCounter_1 = require("./CostlyCounter");
var ElsCounter_1 = require("./ElsCounter");
var NrCounter_1 = require("./NrCounter");
var CounterFactory = /** @class */ (function () {
    function CounterFactory() {
    }
    CounterFactory.create = function (variant, log) {
        switch (variant) {
            case "cheap":
                return log ? new CheapCounter_1.CheapCounter(false, log) : new CheapCounter_1.CheapCounter(false);
            case "costly":
                return log ? new CostlyCounter_1.CostlyCounter(log) : new CostlyCounter_1.CostlyCounter();
            case "nr":
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