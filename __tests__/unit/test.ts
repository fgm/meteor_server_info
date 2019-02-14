import {testNodeInfo} from "./NodeInfoTest";
import {testNrCounter} from "./NrCounterTest";
import {testSessionInfo} from "./SessionInfoTest";

describe("Unit", () => {
  describe("NodeInfo", testNodeInfo);
  describe("NrCounter", testNrCounter);
  describe("SessionInfo", testSessionInfo);
});
