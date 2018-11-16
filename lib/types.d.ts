/**
 * The basic metric set type used by IInfoData.
 *
 * @see IInfoData
 */
declare type Counter = Map<number | string, number>;
/**
 * IInfoData represents metrics, as a string-keyed associative array.
 *
 * Values are either:
 * - numbers: 1-level metrics
 * - string- or number- keyed associative arrays: 2-level metrics.
 */
interface IInfoData {
    [key: string]: number | Counter;
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
export { Counter, IInfoData, IInfoSection, IInfoDescription, };
