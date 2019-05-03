/* This file is a dev-only CLI tool: allow console.log */

/* tslint:disable:no-console */
import { stdin } from "process";
import { NanoTs } from "./types";

setInterval(() => {
  console.log("Resetting times");
  const times = [];
  for (let i = 0; i < 100; i++) {
    times.push(NanoTs.forNow());
  }
}, 3000);

console.log("Press any key to exit");
stdin.resume();
stdin.on("data", process.exit.bind(process, 0));
