declare module 'event-loop-stats' {

  interface IEventStats {
    max: number,
    min: number,
    sum: number,
    num: number,
  }

  function sense(): IEventStats;
}

