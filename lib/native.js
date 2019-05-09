"use strict";
/* This file is a dev-only CLI tool: allow console.log */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:no-console */
var native_metrics_1 = __importDefault(require("@newrelic/native-metrics"));
var sprintf_js_1 = require("sprintf-js");
var INTERVAL_USER = 5000;
var INTERVAL_NATIVE = 20000;
var emitter = native_metrics_1.default(INTERVAL_NATIVE);
var current = "";
if (emitter.gcEnabled) {
    setInterval(function () {
        var gcMetrics = emitter.getGCMetrics();
        if (Object.keys(gcMetrics).length === 0) {
            return;
        }
        if (current !== "gc" && current !== "loop") {
            console.log("----------------- Type ----------------- --Total- -Min- --Max- --Sum(x^2)-- Cnt");
            current = "gc";
        }
        for (var type in gcMetrics) {
            if (!gcMetrics.hasOwnProperty(type)) {
                continue;
            }
            var m = gcMetrics[type].metrics;
            console.log(sprintf_js_1.sprintf("%-40s %8d %5d %6d %12d %3d", type, gcMetrics[type].typeId, m.total, m.min, m.max, m.sumOfSquares, m.count));
        }
    }, INTERVAL_USER);
}
if (emitter.usageEnabled) {
    emitter.on("usage", function (usage) {
        if (current !== "usage") {
            console.log("Utime Stime MaxRSS MinFlt NvCSw NivCsw");
            current = "usage";
        }
        console.log(sprintf_js_1.sprintf("%5d %5d %6d %6d %5d %6d", usage.current.ru_utime - usage.diff.ru_utime, usage.current.ru_stime - usage.diff.ru_stime, usage.current.ru_maxrss - usage.diff.ru_maxrss, usage.current.ru_minflt - usage.diff.ru_minflt, usage.current.ru_nvcsw - usage.diff.ru_nvcsw, usage.current.ru_nivcsw - usage.current.ru_nivcsw));
    });
}
if (emitter.loopEnabled) {
    setInterval(function () {
        var loopMetrics = emitter.getLoopMetrics();
        if (current !== "loop") {
            // console.log("----------------- Type ----------------- --Total- -Min- --Max- --Sum(x^2)-- Cnt");
            current = "loop";
        }
        console.log(sprintf_js_1.sprintf("%-40s %8d %5d %6d %12d %3d", "Loop", loopMetrics.usage.total, loopMetrics.usage.min, loopMetrics.usage.max, loopMetrics.usage.sumOfSquares, loopMetrics.usage.count));
    }, INTERVAL_USER);
}
setInterval(function () {
    var t0 = +new Date();
    var t1;
    do {
        t1 = +new Date();
    } while (t1 - t0 < 200);
}, 250);
//# sourceMappingURL=native.js.map