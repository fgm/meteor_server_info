import { NanoTs } from './types';
import { stdin } from "process";

setInterval(function () {
  console.log('Resetting times');
  let times = [];
  for (let i = 0; i < 100; i++) {
    times.push(NanoTs.forNow());
  }
}, 3000);

console.log('Press any key to exit');
stdin.resume();
stdin.on('data', process.exit.bind(process, 0));
