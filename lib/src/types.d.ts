/**
 * The type for a Jest "done" test argument.
 */
declare type IDone = () => void;
/**
 * The type for functions compatible with "console.log(sprintf("
 */
declare type LogFunction = (format: string, ...args: any[]) => void;
/**
 * nullLogger is a silent logger usable by Counter classes.
 *
 * @param {string}_format
 * @param {any[]} _args
 */
declare const nullLogger: LogFunction;
/**
 * timingLog wraps a sprintf() call by prepending the time since command start.
 *
 * @param {string} format
 * @param {any[]} args
 */
declare const timingLog: LogFunction;
declare type Counter = Map<number | string, number | NanoTs>;
/**
 * IInfoData represents metrics, as a string-keyed associative array.
 *
 * Values are either:
 * - numbers: 1-level metrics
 * - string- or number- keyed associative arrays: 2-level metrics.
 */
interface IInfoData {
    [key: string]: number | Counter | NanoTs;
}
/**
 * IInfoDescription represents the user-level metrics type information.
 *
 * A string-keys associative array of label and type strings.
 */
interface IInfoDescription {
    [key: string]: {
        label: string;
        type: string;
    };
}
/**
 * IInfoSection is the interface implemented by meteor_server_info collectors.
 */
interface IInfoSection {
    /**
     * Return the metrics gathered by the collector.
     */
    getInfo: () => IInfoData;
    /**
     * Return the description of the metrics gathered by the collector.
     */
    getDescription: () => IInfoDescription;
}
interface IAnyByString {
    [key: string]: any;
}
/**
 * The result of a poll() iteration: a previous/current pair of nanotimestamps.
 *
 * It can only represent positive durations.
 *
 * TODO Remove this workaround workaround after Node >= 10.7 with bigint.
 */
declare class NanoTs {
    seconds: number;
    nanosec: number;
    /**
     * Construct a NanoTS for the current high-resolution time.
     */
    static forNow(): NanoTs;
    /**
     * Ensures normalize values: only positive integers, nanosec < 1E9.
     *
     * Converts extra nsec to extra seconds if needed.
     *
     * @param seconds
     * @param nanosec
     */
    constructor(seconds?: number, nanosec?: number);
    /**
     * Subtract a *smaller* NanoTs from a larger one.
     *
     * @param other
     *
     * @throws Error
     *   In case of data corruption, or if the other value is larger than the instance.
     */
    sub(other: NanoTs): NanoTs;
    /**
     * Convert the value to a number of milliseconds.
     */
    toMsec(): number;
}
export { Counter, IDone, IAnyByString, IInfoData, IInfoSection, IInfoDescription, NanoTs, nullLogger, timingLog, };
export { LogFunction };
