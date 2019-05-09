"use strict";
/* This file is a dev-only CLI tool: allow console.log */
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:no-console */
var process_1 = require("process");
var types_1 = require("./types");
setInterval(function () {
    console.log("Resetting times");
    var times = [];
    for (var i = 0; i < 100; i++) {
        times.push(types_1.NanoTs.forNow());
    }
}, 3000);
console.log("Press any key to exit");
process_1.stdin.resume();
process_1.stdin.on("data", process.exit.bind(process, 0));
//# sourceMappingURL=ram.js.map