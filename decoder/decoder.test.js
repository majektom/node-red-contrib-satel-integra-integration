const assert = require("assert");
const catchNode = require("@node-red/nodes/core/common/25-catch");
const decoder = require("./decoder.js");
const helper = require("node-red-node-test-helper");
const protocol = require("satel-integra-integration-protocol");
const sinon = require("sinon");

helper.init(require.resolve("node-red"));

describe("satel-integra-decoder Node", function () {
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
        { id: "n1", type: "satel-integra-decoder", name: "Decoder" },
      ];
      helper.load(decoder, flow, function () {
        const decoderNode = helper.getNode("n1");
        try {
          decoderNode.should.have.property("name", "Decoder");
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });

  it("should issue error on message without payload", function () {
    return new Promise(function (resolve, reject) {
      sinon.replace(protocol, "decodeMessage", sinon.fake.returns(null));
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "n1",
          z: "f1",
          type: "satel-integra-decoder",
          name: "Decoder",
          wires: [["n2"]],
        },
        { id: "n2", z: "f1", type: "helper" },
        { id: "n3", z: "f1", type: "helper" },
        { id: "n4", z: "f1", type: "catch", wires: [["n3"]] },
      ];
      helper.load([decoder, catchNode], flow, function () {
        const decoderNode = helper.getNode("n1");
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
            protocol.decodeMessage.should.have.property("called", false);
            msg.should.have.property("error");
            msg.error.should.have.property("source", {
              id: "n1",
              type: "satel-integra-decoder",
              name: "Decoder",
              count: 1,
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        decoderNode.receive({});
      });
    }).catch(function (error) {
      assert.fail(error);
    });
  });

  it("should issue error on message with payload which is not a buffer", function () {
    return new Promise(function (resolve, reject) {
      sinon.replace(protocol, "decodeMessage", sinon.fake.returns(null));
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "n1",
          z: "f1",
          type: "satel-integra-decoder",
          name: "Decoder",
          wires: [["n2"]],
        },
        { id: "n2", z: "f1", type: "helper" },
        { id: "n3", z: "f1", type: "helper" },
        { id: "n4", z: "f1", type: "catch", wires: [["n3"]] },
      ];
      helper.load([decoder, catchNode], flow, function () {
        const decoderNode = helper.getNode("n1");
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
            protocol.decodeMessage.should.have.property("called", false);
            msg.should.have.property("error");
            msg.error.should.have.property("source", {
              id: "n1",
              type: "satel-integra-decoder",
              name: "Decoder",
              count: 1,
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        decoderNode.receive({ payload: "payload" });
      });
    }).catch(function (error) {
      assert.fail(error);
    });
  });

  it("should issue error on decoding failure", function () {
    return new Promise(function (resolve, reject) {
      sinon.replace(protocol, "decodeMessage", sinon.fake.returns(null));
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "n1",
          z: "f1",
          type: "satel-integra-decoder",
          name: "Decoder",
          wires: [["n2"]],
        },
        { id: "n2", z: "f1", type: "helper" },
        { id: "n3", z: "f1", type: "helper" },
        { id: "n4", z: "f1", type: "catch", wires: [["n3"]] },
      ];
      helper.load([decoder, catchNode], flow, function () {
        const decoderNode = helper.getNode("n1");
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
            protocol.decodeMessage.should.have.property("calledOnce", true);
            msg.should.have.property("error");
            msg.error.should.have.property("source", {
              id: "n1",
              type: "satel-integra-decoder",
              name: "Decoder",
              count: 1,
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        decoderNode.receive({ payload: Buffer.from([0x01, 0x02, 0x03]) });
      });
    }).catch(function (error) {
      assert.fail(error);
    });
  });

  it("should pass frame to decodeMessage function", function () {
    const frame = Buffer.from([0x01, 0x02, 0x03]);
    return new Promise(function (resolve) {
      sinon.replace(
        protocol,
        "decodeMessage",
        sinon.fake.returns(new protocol.NewDataAnswer())
      );
      const flow = [
        {
          id: "n1",
          type: "satel-integra-decoder",
          name: "Decoder",
          wires: [["n2"]],
        },
        { id: "n2", type: "helper" },
      ];
      helper.load(decoder, flow, function () {
        const decoderNode = helper.getNode("n1");
        const helperNode = helper.getNode("n2");
        helperNode.on("input", function (msg) {
          resolve();
        });
        decoderNode.receive({ payload: frame });
      });
    }).then(function () {
      protocol.decodeMessage.should.have.property("calledOnce", true);
      protocol.decodeMessage.getCall(0).args.should.be.deepEqual([frame]);
    });
  });

  it("should properly parse new data answer", function () {
    return new Promise(function (resolve, reject) {
      const answerMsg = new protocol.NewDataAnswer();
      answerMsg._flags = [false, true, true, false];
      sinon.replace(protocol, "decodeMessage", sinon.fake.returns(answerMsg));
      const flow = [
        {
          id: "n1",
          type: "satel-integra-decoder",
          name: "Decoder",
          wires: [["n2"]],
        },
        { id: "n2", type: "helper" },
      ];
      helper.load(decoder, flow, function () {
        const decoderNode = helper.getNode("n1");
        const helperNode = helper.getNode("n2");
        helperNode.on("input", function (msg) {
          try {
            msg.should.have.property("topic", "new_data");
            msg.should.have.property("payload", answerMsg.flags);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        decoderNode.receive({ payload: Buffer.from([0x01, 0x02, 0x03]) });
      });
    }).catch(function (error) {
      assert.fail(error);
    });
  });

  it("should properly parse outputs state answer", function () {
    return new Promise(function (resolve, reject) {
      const answerMsg = new protocol.OutputsStateAnswer();
      answerMsg._flags = [false, true, true, false];
      sinon.replace(protocol, "decodeMessage", sinon.fake.returns(answerMsg));
      const flow = [
        {
          id: "n1",
          type: "satel-integra-decoder",
          name: "Decoder",
          wires: [["n2"]],
        },
        { id: "n2", type: "helper" },
      ];
      helper.load(decoder, flow, function () {
        const decoderNode = helper.getNode("n1");
        const helperNode = helper.getNode("n2");
        helperNode.on("input", function (msg) {
          try {
            msg.should.have.property("topic", "outputs_state");
            msg.should.have.property("payload", answerMsg.flags);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        decoderNode.receive({ payload: Buffer.from([0x01, 0x02, 0x03]) });
      });
    }).catch(function (error) {
      assert.fail(error);
    });
  });

  it("should properly parse zones tamper answer", function () {
    return new Promise(function (resolve, reject) {
      const answerMsg = new protocol.ZonesTamperAnswer();
      answerMsg._flags = [false, true, true, false];
      sinon.replace(protocol, "decodeMessage", sinon.fake.returns(answerMsg));
      const flow = [
        {
          id: "n1",
          type: "satel-integra-decoder",
          name: "Decoder",
          wires: [["n2"]],
        },
        { id: "n2", type: "helper" },
      ];
      helper.load(decoder, flow, function () {
        const decoderNode = helper.getNode("n1");
        const helperNode = helper.getNode("n2");
        helperNode.on("input", function (msg) {
          try {
            msg.should.have.property("topic", "zones_tamper");
            msg.should.have.property("payload", answerMsg.flags);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        decoderNode.receive({ payload: Buffer.from([0x01, 0x02, 0x03]) });
      });
    }).catch(function (error) {
      assert.fail(error);
    });
  });

  it("should properly parse zones violation answer", function () {
    return new Promise(function (resolve, reject) {
      const answerMsg = new protocol.ZonesViolationAnswer();
      answerMsg._flags = [false, true, true, false];
      sinon.replace(protocol, "decodeMessage", sinon.fake.returns(answerMsg));
      const flow = [
        {
          id: "n1",
          type: "satel-integra-decoder",
          name: "Decoder",
          wires: [["n2"]],
        },
        { id: "n2", type: "helper" },
      ];
      helper.load(decoder, flow, function () {
        const decoderNode = helper.getNode("n1");
        const helperNode = helper.getNode("n2");
        helperNode.on("input", function (msg) {
          try {
            msg.should.have.property("topic", "zones_violation");
            msg.should.have.property("payload", answerMsg.flags);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        decoderNode.receive({ payload: Buffer.from([0x01, 0x02, 0x03]) });
      });
    }).catch(function (error) {
      assert.fail(error);
    });
  });
});
