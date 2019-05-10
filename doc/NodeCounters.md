# NodeCounter
## Per-counter
### Cheap

1. loopDelay: approximate duration of average EL duration during the last 1000 msec
  -> use ELS, better accuracy, not more expensive

### Costly

1. clockMsec: Milliseconds since last polling
2. diffMsec: Difference between actual and expected milliseconds since last polling
3. expectedLapMsec: Expected milliseconds since last polling
4. individualLapMsec: Average milliseconds per tick since last polling
5. lag: Difference between expected and actual tick duration since last polling (3. - 4.)
6. tickCount: Ticks since last polling
  -> same as NR tickerPerSec: use it
7. ticksPerSec:Ticks per second
  -> same as NR tickerPerSec: use it

### NR

1. cpuPerSecond: CPU milliseconds used by process during last quasi-second.
2. cpuPerTickAvg: Average CPU milliseconds used by process per tick during last quasi-second (= 1./4.)
3. cpuPerTickMax: Maximum of CPU milliseconds used by process since last fetch, not last quasi-second.
4. tickCount: Exact tick count during last quasi-second.
5. tickLagAvg:Average tick duration deviation from 1 msec (in msec) during last quasi-second.
6. tickLagMax:Maximum tick duration deviation from 1 msec (in msec) since last fetch, not last quasi-second.
  -> use ELS, same accuracy, way cheaper
7. ticksPerSec:Average ticks per second during last quasi-second.

### ELS

1. loopCount: Number of main loop iterations during last sensing, from ELS.
2. loopDelay: Estimated current average event main loop duration, in msec.
3. loopDelayMaxMsec: Maximum main loop duration, in msec during last sensing, from ELS.
4. loopDelayMinMsec: Minimum main loop duration, in msec during last sensing, from ELS.
5. loopDelayTotalMsec: Total main loop delay, in msec during last sensing, from ELS.
6. tickLagMax: Maximum tick duration deviation from 1 msec (in msec) since last fetch, not last sensing.

## Summary
### Stable metrics

1. loopDelay: average of EL duration
  - Cheap (over last 1 sec), **ELS** (over last 100 msec)
1. tickCount: Ticks since last polling: Costly, **NR**
1. ticksPerSec: Average ticks per second during last quasi-second: Costly, **NR**

### Reset-on-read metrics

1. cpuPerTickMax: Maximum of CPU milliseconds used by process since last fetch: NR
2. tickLagMax: NR, ELS
