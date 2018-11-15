import axios from "axios";

import endPoint from "./harness";

interface IJsonTestObject {
  integer: (...args: number[]) => number;
  domainZone: () => string;
}

function testValidJson() {
  test("should accept valid JSON posts", () => {
  });
}

function testNonJson() {
  test("should reject non-JSON posts", () => {
    // Ensure fail if the promise resolves.
    expect.assertions(2);

    return axios({
      baseURL: endPoint,
      data: "42",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      method: "post",
      url: "/logger",
    }).catch((err) => {
      const response = err.response;
      expect(response).toBeDefined();
      // Invalid JSON is rejected.
      expect(response.status).toBe(422);
    });
  });
}

export {
  testNonJson,
  testValidJson,
};
