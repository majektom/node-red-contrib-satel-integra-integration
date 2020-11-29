const assert = require("assert");
const catchNode = require("@node-red/nodes/core/common/25-catch");
const encoder = require("./encoder.js");
const user = require("../user/user.js");
const security_prefix = require("../security_prefix/security_prefix.js");
const helper = require("node-red-node-test-helper");
const protocol = require("satel-integra-integration-protocol");

helper.init(require.resolve("node-red"));

describe("satel-integra-encoder Node", function () {
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
      const prefixValue = "09876";
      const flow = [
        { id: "user1", type: "satel-integra-user", name: "User Name" },
        {
          id: "prefix1",
          type: "satel-integra-security_prefix",
          name: "Prefix Name",
        },
        {
          id: "encoder1",
          type: "satel-integra-encoder",
          name: "Encoder",
          user: "user1",
          prefix: "prefix1",
        },
      ];
      helper
        .load([encoder, user, security_prefix], flow, function () {
          const encoderNode = helper.getNode("encoder1");
          const userNode = helper.getNode("user1");
          const prefixNode = helper.getNode("prefix1");
          encoderNode.should.have.property("name", "Encoder");
          encoderNode.should.have.property("userNode").equal(userNode);
          encoderNode.should.have.property("prefixNode").equal(prefixNode);
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

  it("should issue error on message without topic", function () {
    return new Promise(function (resolve, reject) {
      const flow = [
        { id: "user1", type: "satel-integra-user", name: "User Name" },
        {
          id: "prefix1",
          type: "satel-integra-security_prefix",
          name: "Prefix Name",
        },
        { id: "flow1", type: "tab", label: "Test flow" },
        {
          id: "encoder1",
          z: "flow1",
          type: "satel-integra-encoder",
          name: "Encoder",
          user: "user1",
          prefix: "prefix1",
          wires: [["helper1"]],
        },
        { id: "helper1", z: "flow1", type: "helper" },
        { id: "helper2", z: "flow1", type: "helper" },
        { id: "catch1", z: "flow1", type: "catch", wires: [["helper2"]] },
      ];
      helper
        .load([encoder, user, security_prefix, catchNode], flow, function () {
          const encoderNode = helper.getNode("encoder1");
          const helper1Node = helper.getNode("helper1");
          const helper2Node = helper.getNode("helper2");
          helper1Node.on("input", function (msg) {
            try {
              assert.fail("message should have been discarded");
            } catch (error) {
              reject(error);
            }
          });
          helper2Node.on("input", function (msg) {
            try {
              msg.should.not.have.property("topic");
              msg.should.have.property("error");
              msg.error.should.have.property("source", {
                id: "encoder1",
                type: "satel-integra-encoder",
                name: "Encoder",
                count: 1,
              });
              resolve();
            } catch (error) {
              reject(error);
            }
          });
          encoderNode.receive({});
        })
        .catch(function (error) {
          reject(error);
        });
    });
  });

  it("should issue error on message with unrecognized topic", function () {
    return new Promise(function (resolve, reject) {
      const flow = [
        { id: "flow1", type: "tab", label: "Test flow" },
        { id: "user1", type: "satel-integra-user", name: "User Name" },
        {
          id: "prefix1",
          type: "satel-integra-security_prefix",
          name: "Prefix Name",
        },
        {
          id: "encoder1",
          z: "flow1",
          type: "satel-integra-encoder",
          name: "Encoder",
          user: "user1",
          prefix: "prefix1",
          wires: [["helper1"]],
        },
        { id: "helper1", z: "flow1", type: "helper" },
        { id: "helper2", z: "flow1", type: "helper" },
        { id: "catch1", z: "flow1", type: "catch", wires: [["helper2"]] },
      ];
      helper
        .load([encoder, user, security_prefix, catchNode], flow, function () {
          const encoderNode = helper.getNode("encoder1");
          const helper1Node = helper.getNode("helper1");
          const helper2Node = helper.getNode("helper2");
          helper1Node.on("input", function (msg) {
            try {
              assert.fail("message should have been discarded");
            } catch (error) {
              reject(error);
            }
          });
          helper2Node.on("input", function (msg) {
            try {
              msg.should.have.property("topic", "invalid_topic");
              msg.should.have.property("error");
              msg.error.should.have.property("source", {
                id: "encoder1",
                type: "satel-integra-encoder",
                name: "Encoder",
                count: 1,
              });
              resolve();
            } catch (error) {
              reject(error);
            }
          });
          encoderNode.receive({ topic: "invalid_topic" });
        })
        .catch(function (reason) {
          reject(reason);
        });
    });
  });

  let encodeNoDataCommandTests = [
    {
      commandName: "new_data",
      expectedPayload: protocol.encodeNewDataCommand(),
    },
    {
      commandName: "outputs_state",
      expectedPayload: protocol.encodeOutputsStateCommand(),
    },
    {
      commandName: "zones_tamper",
      expectedPayload: protocol.encodeZonesTamperCommand(),
    },
    {
      commandName: "zones_violation",
      expectedPayload: protocol.encodeZonesViolationCommand(),
    },
  ];

  encodeNoDataCommandTests.forEach(function (test) {
    it("should properly encode " + test.commandName + " command", function () {
      return new Promise(function (resolve, reject) {
        const flow = [
          { id: "user1", type: "satel-integra-user", name: "User Name" },
          {
            id: "prefix1",
            type: "satel-integra-security_prefix",
            name: "Prefix Name",
          },
          { id: "flow1", type: "tab", label: "Test flow" },
          {
            id: "encoder1",
            z: "flow1",
            type: "satel-integra-encoder",
            name: "Encoder",
            user: "user1",
            prefix: "prefix1",
            wires: [["helper1"]],
          },
          { id: "helper1", z: "flow1", type: "helper" },
          { id: "helper2", z: "flow1", type: "helper" },
          { id: "catch1", z: "flow1", type: "catch", wires: [["helper2"]] },
        ];
        helper
          .load([encoder, user, security_prefix, catchNode], flow, function () {
            const encoderNode = helper.getNode("encoder1");
            const helper1Node = helper.getNode("helper1");
            const helper2Node = helper.getNode("helper2");
            helper1Node.on("input", function (msg) {
              try {
                msg.should.have.property("topic", test.commandName);
                msg.should.have.property("payload", test.expectedPayload);
                resolve();
              } catch (error) {
                reject(error);
              }
            });
            helper2Node.on("input", function (msg) {
              reject(msg.error);
            });
            encoderNode.receive({ topic: test.commandName });
          })
          .catch(function (reason) {
            reject(reason);
          });
      });
    });
  });

  let encodeOutputsChangeCommandTests = [
    {
      commandName: "outputs_off",
      encodeFunction: protocol.encodeOutputsOffCommand,
    },
    {
      commandName: "outputs_on",
      encodeFunction: protocol.encodeOutputsOnCommand,
    },
    {
      commandName: "outputs_switch",
      encodeFunction: protocol.encodeOutputsSwitchCommand,
    },
  ];
  encodeOutputsChangeCommandTests.forEach(function (test) {
    it("should properly encode " + test.commandName + " command", function () {
      return new Promise(function (resolve, reject) {
        const outputs = new Array(128)
          .fill(false)
          .fill(true, 3, 4)
          .fill(true, 42, 44);
        const flow = [
          { id: "user1", type: "satel-integra-user", name: "User Name" },
          {
            id: "prefix1",
            type: "satel-integra-security_prefix",
            name: "Prefix Name",
          },
          { id: "flow1", type: "tab", label: "Test flow" },
          {
            id: "encoder1",
            z: "flow1",
            type: "satel-integra-encoder",
            name: "Encoder",
            user: "user1",
            prefix: "prefix1",
            wires: [["helper1"]],
          },
          { id: "helper1", z: "flow1", type: "helper" },
          { id: "helper2", z: "flow1", type: "helper" },
          { id: "catch1", z: "flow1", type: "catch", wires: [["helper2"]] },
        ];
        const credentials = {
          user1: { code: "654321" },
          prefix1: { prefix: "09876" },
        };
        helper
          .load(
            [encoder, user, security_prefix, catchNode],
            flow,
            credentials,
            function () {
              const encoderNode = helper.getNode("encoder1");
              const helper1Node = helper.getNode("helper1");
              const helper2Node = helper.getNode("helper2");
              helper1Node.on("input", function (msg) {
                try {
                  msg.should.have.property("topic", test.commandName);
                  msg.should.have.property(
                    "payload",
                    test.encodeFunction("09876654321fffff", outputs)
                  );
                  resolve();
                } catch (error) {
                  reject(error);
                }
              });
              helper2Node.on("input", function (msg) {
                reject(msg.error);
              });
              encoderNode.receive({
                topic: test.commandName,
                // This deprecated field should be ignored and superseded by code and prefix parameters
                prefixAndUserCode: "87654321ffffffff",
                outputs: outputs,
              });
            }
          )
          .catch(function (reason) {
            reject(reason);
          });
      });
    });
  });

  encodeOutputsChangeCommandTests.forEach(function (test) {
    it(
      "should properly encode " +
        test.commandName +
        " command with deprecated prefixAndUserCode field",
      function () {
        return new Promise(function (resolve, reject) {
          const outputs = new Array(128)
            .fill(false)
            .fill(true, 3, 4)
            .fill(true, 42, 44);
          const flow = [
            { id: "flow1", type: "tab", label: "Test flow" },
            {
              id: "encoder1",
              z: "flow1",
              type: "satel-integra-encoder",
              name: "Encoder",
              user: "",
              prefix: "",
              wires: [["helper1"]],
            },
            { id: "helper1", z: "flow1", type: "helper" },
            { id: "helper2", z: "flow1", type: "helper" },
            { id: "catch1", z: "flow1", type: "catch", wires: [["helper2"]] },
          ];
          helper
            .load([encoder, catchNode], flow, function () {
              const encoderNode = helper.getNode("encoder1");
              const helper1Node = helper.getNode("helper1");
              const helper2Node = helper.getNode("helper2");
              helper1Node.on("input", function (msg) {
                try {
                  msg.should.have.property("topic", test.commandName);
                  msg.should.have.property(
                    "payload",
                    test.encodeFunction("87654321ffffffff", outputs)
                  );
                  resolve();
                } catch (error) {
                  reject(error);
                }
              });
              helper2Node.on("input", function (msg) {
                reject(msg.error);
              });
              encoderNode.receive({
                topic: test.commandName,
                prefixAndUserCode: "87654321ffffffff",
                outputs: outputs,
              });
            })
            .catch(function (reason) {
              reject(reason);
            });
        });
      }
    );
  });

  let encodeWrongOutputsChangeCommandTests = [
    {
      commandName: "outputs_off",
      encodeFunction: protocol.encodeOutputsOffCommand,
    },
    {
      commandName: "outputs_on",
      encodeFunction: protocol.encodeOutputsOnCommand,
    },
    {
      commandName: "outputs_switch",
      encodeFunction: protocol.encodeOutputsSwitchCommand,
    },
  ];
  encodeWrongOutputsChangeCommandTests.forEach(function (test) {
    it(
      "should issue error on wrong " + test.commandName + " message",
      function () {
        return new Promise(function (resolve, reject) {
          const flow = [
            { id: "user1", type: "satel-integra-user", name: "User Name" },
            {
              id: "prefix1",
              type: "satel-integra-security_prefix",
              name: "Prefix Name",
            },
            { id: "flow1", type: "tab", label: "Test flow" },
            {
              id: "encoder1",
              z: "flow1",
              type: "satel-integra-encoder",
              name: "Encoder",
              wires: [["helper1"]],
            },
            { id: "helper1", z: "flow1", type: "helper" },
            { id: "helper2", z: "flow1", type: "helper" },
            { id: "catch1", z: "flow1", type: "catch", wires: [["helper2"]] },
          ];
          const credentials = {
            user1: { code: "654321" },
            prefix1: { prefix: "09876" },
          };
          helper
            .load(
              [encoder, user, security_prefix, catchNode],
              flow,
              function () {
                const encoderNode = helper.getNode("encoder1");
                const helper1Node = helper.getNode("helper1");
                const helper2Node = helper.getNode("helper2");
                helper1Node.on("input", function (msg) {
                  try {
                    assert.fail("message should have been discarded");
                  } catch (error) {
                    reject(error);
                  }
                });
                helper2Node.on("input", function (msg) {
                  try {
                    msg.should.have.property("topic", test.commandName);
                    assert(
                      msg.error.message.startsWith(
                        test.commandName + " command encoding error"
                      )
                    );
                    msg.error.should.have.property("source", {
                      id: "encoder1",
                      type: "satel-integra-encoder",
                      name: "Encoder",
                      count: 1,
                    });
                    resolve();
                  } catch (error) {
                    reject(error);
                  }
                });
                encoderNode.receive({
                  topic: test.commandName,
                });
              }
            )
            .catch(function (reason) {
              reject(reason);
            });
        });
      }
    );
  });
});
