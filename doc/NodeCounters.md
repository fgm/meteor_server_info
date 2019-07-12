# NodeCounter
## Per-counter
### Cheap (v1.2.1-v1.2.5)

1. loopDelay: approximate duration of average EL duration during the last 1000 msec
  -> use ELS loopDelayMsec, better accuracy, not more expensive

### Costly (v1.2.1-v1.2.5)

1. clockMsec: Milliseconds since last polling
2. diffMsec: Difference between actual and expected milliseconds since last polling
3. expectedLapMsec: Expected milliseconds since last polling
4. individualLapMsec: Average milliseconds per tick since last polling
5. lag: Difference between expected and actual tick duration since last polling (3. - 4.)
6. tickCount: Ticks since last polling
  -> same as NR tickerPerSec: use it
7. ticksPerSec:Ticks per second
  -> same as NR tickerPerSec: use it

### NR (since v1.2.1, deprecated)

1. cpuPerSecond: CPU milliseconds used by process during last quasi-second.
2. cpuPerTickAvg: Average CPU milliseconds used by process per tick during last quasi-second (= 1./4.)
3. cpuPerTickMax: Maximum of CPU milliseconds used by process since last fetch, not last quasi-second.
4. loopLagMaxMsecSinceLastFetch:Maximum tick duration deviation from 1 msec (in msec) 
   since last fetch, not last quasi-second. -> use ELS, same accuracy, way cheaper
5. tickCount: Exact tick count during last quasi-second.
6. tickLagAvg:Average tick duration deviation from 1 msec (in msec) during last quasi-second.
7. ticksPerSec: Average ticks per second during last quasi-second.

### ELS (since v1.2.5)

1. cpuUsageMaxSinceLastFetch: Maximum user+system CPU usage percentage per sensing, since last fetch, from ELS.
2. loopCount: Number of main loop iterations during last sensing, from ELS.
3. loopCountPerSecSinceLastFetch: Number of main loop iterations per second since last fetch, averaged from ELS.
4. loopDelayMaxMsec: Maximum main loop duration, in msec during last sensing, from ELS.
5. loopDelayMinMsec: Minimum main loop duration, in msec during last sensing, from ELS.
6. loopDelayMsec: Estimated current average event main loop duration, in msec.
7. loopDelayTotalMsec: Total main loop delay, in msec during last sensing, from ELS.
8. loopLagMaxMsecSinceLastFetch (tickLagMax in 1.2.5): Maximum tick duration deviation 
   from 1 msec (in msec) since last fetch, not last sensing.

## Summary of most useful metrics
### Stable metrics

1. loopDelay (loopDelayMsec): average of EL duration
  - Cheap (over last 1 sec), **ELS** (over last 100 msec)
1. tickCount: Ticks since last polling: Costly, **NR**
1. ticksPerSec: Average ticks per second during last quasi-second: Costly, **NR**

### Reset-on-read metrics

1. cpuUsageMaxSinceLastFetch: Maximum user+system CPU usage percentage per sensing, since last fetch: **ELS**
2. cpuPerTickMax: Maximum of CPU milliseconds used by process since last fetch: **NR**
3. loopCountPerSecSinceLastFetch: Number of main loop iterations per second since last fetch, averaged: **ELS**.
4. loopLagMaxMsecSinceLastFetch: NR, **ELS**


### Conclusions for 1.2.6

- Cheap and Costly are never better than NR or ELS, so remove them.
- NR is the only one providing cpuPerTickMax, but ELS has cpuUsageMaxSinceLastFetch,
  which is is comparable although not identical, so deprecate NR for removal in 1.3.0.
