import {hrtime} from "process";

/**
 * The basic metric set type used by IInfoData.
 *
 * @see IInfoData
 */
import {sprintf} from "sprintf-js";

const logT0 = Date.now();

/**
 * The type for a Jest "done" test argument.
 */
type IDone = () => void;

/**
 * The type for functions compatible with "console.log(sprintf("
 */
type LogFunction = (format: string, ...args: any[]) => void;

/**
 * nullLogger is a silent logger usable by Counter classes.
 *
 * @param {string}_format
 * @param {any[]} _args
 */
const nullLogger: LogFunction = (_format: string, ..._args: any[]): void => { return; };

/**
 * timingLog wraps a sprintf() call by prepending the time since command start.
 *
 * @param {string} format
 * @param {any[]} args
 */
const timingLog: LogFunction = (format: string, ...args: any[]): void => {
  const logFormat = "%7s: " + format;
  const logTime = new Date(Date.now() - logT0).getTime();
  const formattedLogTime = (logTime / 1000).toFixed(3);
  args.unshift(formattedLogTime);
  // tslint:disable-next-line:no-console
  console.log(sprintf(logFormat, ...args));
};

type Counter = Map<number | string, number | NanoTs>;

/**
 * IInfoData represents metrics, as a string-keyed associative array.
 *
 * Values are either:
 * - numbers: 1-level metrics
 * - string- or number- keyed associative arrays: 2-level metrics.
 */
interface IInfoData {
  [key: string]: number | Counter | NanoTs,
}

/**
 * IInfoDescription represents the user-level metrics type information.
 *
 * A string-keys associative array of label and type strings.
 */
interface IInfoDescription {
  [key: string]: {
    label: string,
    type: string,
  }
}

/**
 * IInfoSection is the interface implemented by meteor_server_info collectors.
 */
interface IInfoSection {
  /**
   * Return the metrics gathered by the collector.
   */
  getInfo: () => IInfoData,

  /**
   * Return the description of the metrics gathered by the collector.
   */
  getDescription: () => IInfoDescription,
}

interface IAnyByString {
  [key: string]: any,
}

/**
 * The result of a poll() iteration: a previous/current pair of nanotimestamps.
 *
 * It can only represent positive durations.
 *
 * TODO Remove this workaround workaround after Node >= 10.7 with bigint.
 */
class NanoTs {
  /**
   * Construct a NanoTS for the current high-resolution time.
   */
  public static forNow(): NanoTs {
    const hrt = hrtime();
    return new NanoTs(hrt[0], hrt[1]);
  }

  /**
   * Ensures normalize values: only positive integers, nanosec < 1E9.
   *
   * Converts extra nsec to extra seconds if needed.
   *
   * @param seconds
   * @param nanosec
   */
  constructor(public seconds: number = 0, public nanosec: number = 0) {
    // Ensure integer values to avoid float rounding issues.
    this.seconds = Math.trunc(Math.abs(seconds));
    this.nanosec = Math.trunc(Math.abs(nanosec));
    if (this.nanosec > 1E9) {
      const remainder = this.nanosec % 1E9;
      this.seconds += (this.nanosec - remainder / 1E9);
      this.nanosec = remainder;
    }
  }

  /**
   * Subtract a *smaller* NanoTs from a larger one.
   *
   * @param other
   *
   * @throws Error
   *   In case of data corruption, or if the other value is larger than the instance.
   */
  public sub(other: NanoTs): NanoTs {
    let ndiff = this.nanosec - other.nanosec;
    if (Math.abs(ndiff) >= 1E9) {
      throw new Error("Data corruption detected: 0 <= nsec <= 1E9, so nsec diff cannot be >= 1E9");
    }
    let sdiff = this.seconds - other.seconds;
    if (Math.abs(sdiff) > 1E21) {
      throw new Error("ECMA-262 only guarantees 21 digits of accuracy, cannot subtract accurately");
    }

    if (sdiff < 0) {
      throw new Error("Subtracted value is larger than base value: result would be negative.");
    }

    if (ndiff < 0) {
      // -1E9 <= ndiff < 0 by construction, so just add 1 sec:
      // sdiff > 0 and sdiff integer => sdiff - 1 >= 0.
      sdiff -= 1;
      ndiff += 1E9;
    }

    return new NanoTs(sdiff, ndiff);
  }

  /**
   * Convert the value to a number of milliseconds.
   */
  public toMsec(): number {
    return this.seconds * 1E3 + this.nanosec / 1E6;
  }
}

export {
  Counter,
  IDone,
  IAnyByString,
  IInfoData,
  IInfoSection,
  IInfoDescription,
  NanoTs,
  nullLogger,
  timingLog,
};
export {LogFunction};
