const assert = require("assert");
const security_prefix = require("./security_prefix.js");
const helper = require("node-red-node-test-helper");

helper.init(require.resolve("node-red"));

describe("satel-integra-security_prefix Node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload();
    helper.stopServer(done);
  });

  it("should be loaded", function () {
    return new Promise(function (resolve, reject) {
      const prefixValue = "09876";
      const prefixNameValue = "Prefix Name";
      const flow = [
        {
          id: "prefix1",
          type: "satel-integra-security_prefix",
          name: prefixNameValue,
        },
      ];
      const credentials = {
        prefix1: { prefix: prefixValue },
      };
      helper
        .load([security_prefix], flow, credentials, function () {
          const prefixNodde = helper.getNode("prefix1");
          prefixNodde.should.have.property("name", prefixNameValue);
          prefixNodde.should.have.property("credentials");
          prefixNodde.credentials.should.have.property("prefix", prefixValue);
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
