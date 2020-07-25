const assert = require("assert");
const catchNode = require("@node-red/nodes/core/common/25-catch");
const encoder = require("./encoder.js");
const helper = require("node-red-node-test-helper");
const protocol = require("satel-integra-integration-protocol");
const sinon = require("sinon");

helper.init(require.resolve("node-red"));

describe("satel-integra-encoder Node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload();
    helper.stopServer(done);
    sinon.restore();
  });

  it("should be loaded", function () {
    return new Promise(function (resolve, reject) {
      const flow = [
        { id: "n1", type: "satel-integra-encoder", name: "Encoder" },
      ];
      helper.load(encoder, flow, function () {
        const encoderNode = helper.getNode("n1");
        try {
          encoderNode.should.have.property("name", "Encoder");
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });

  it("should issue error on message without topic", function () {
    return new Promise(function (resolve, reject) {
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "n1",
          z: "f1",
          type: "satel-integra-encoder",
          name: "Encoder",
          wires: [["n2"]],
        },
        { id: "n2", z: "f1", type: "helper" },
        { id: "n3", z: "f1", type: "helper" },
        { id: "n4", z: "f1", type: "catch", wires: [["n3"]] },
      ];
      helper.load([encoder, catchNode], flow, function () {
        const encoderNode = helper.getNode("n1");
        const helperNode1 = helper.getNode("n2");
        const helperNode2 = helper.getNode("n3");
        helperNode1.on("input", function (msg) {
          try {
            assert.fail("message should have been discarded");
          } catch (error) {
            reject(error);
          }
        });
        helperNode2.on("input", function (msg) {
          try {
            msg.should.not.have.property("topic");
            msg.should.have.property("error");
            msg.error.should.have.property("source", {
              id: "n1",
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
      });
    }).catch(function (error) {
      assert.fail(error);
    });
  });

  it("should issue error on message with unrecognized topic", function () {
    return new Promise(function (resolve, reject) {
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "n1",
          z: "f1",
          type: "satel-integra-encoder",
          name: "Encoder",
          wires: [["n2"]],
        },
        { id: "n2", z: "f1", type: "helper" },
        { id: "n3", z: "f1", type: "helper" },
        { id: "n4", z: "f1", type: "catch", wires: [["n3"]] },
      ];
      helper.load([encoder, catchNode], flow, function () {
        const encoderNode = helper.getNode("n1");
        const helperNode1 = helper.getNode("n2");
        const helperNode2 = helper.getNode("n3");
        helperNode1.on("input", function (msg) {
          try {
            assert.fail("message should have been discarded");
          } catch (error) {
            reject(error);
          }
        });
        helperNode2.on("input", function (msg) {
          try {
            msg.should.have.property("topic", "invalid_topic");
            msg.should.have.property("error");
            msg.error.should.have.property("source", {
              id: "n1",
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
      });
    }).catch(function (error) {
      assert.fail(error);
    });
  });

  let encodeCommandTests = [
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

  encodeCommandTests.forEach(function (test) {
    it("should properly encode " + test.commandName + " command", function () {
      return new Promise(function (resolve, reject) {
        const flow = [
          {
            id: "n1",
            type: "satel-integra-encoder",
            name: "Encoder",
            wires: [["n2"]],
          },
          { id: "n2", type: "helper" },
        ];
        helper.load([encoder, catchNode], flow, function () {
          const encoderNode = helper.getNode("n1");
          const helperNode = helper.getNode("n2");
          helperNode.on("input", function (msg) {
            try {
              msg.should.have.property("topic", test.commandName);
              msg.should.have.property("payload", test.expectedPayload);
              resolve();
            } catch (error) {
              reject(error);
            }
          });
          encoderNode.receive({ topic: test.commandName });
        });
      }).catch(function (error) {
        assert.fail(error);
      });
    });
  });
});
