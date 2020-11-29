const assert = require("assert");
const user = require("./user.js");
const helper = require("node-red-node-test-helper");

helper.init(require.resolve("node-red"));

describe("satel-integra-user Node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload();
    helper.stopServer(done);
  });

  it("should be loaded", function () {
    return new Promise(function (resolve, reject) {
      const userCodeValue = "654321";
      const userNameValue = "User Name";
      const flow = [
        { id: "user1", type: "satel-integra-user", name: userNameValue },
      ];
      const credentials = {
        user1: { code: userCodeValue },
      };
      helper
        .load([user], flow, credentials, function () {
          const userNode = helper.getNode("user1");
          userNode.should.have.property("name", userNameValue);
          userNode.should.have.property("credentials");
          userNode.credentials.should.have.property("code", userCodeValue);
        })
        .then(
          function () {
            resolve();
          },
          function (reason) {
            reject(reason);
          }
        );
    });
  });
});
