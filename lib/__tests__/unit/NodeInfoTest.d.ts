import "process";
/**
 * These tests run on node 8.4, to process.hrtime.bigint() is not available yet.
 */
declare function testNodeInfo(): void;
export { testNodeInfo, };
