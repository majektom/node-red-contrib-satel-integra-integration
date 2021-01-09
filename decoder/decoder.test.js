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
          reject(new Error("message should have been discarded"));
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
          reject(new Error("message should have been discarded"));
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
          reject(new Error("message should have been discarded"));
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

  const decodeFlagsArrayAnswerTest = [
    {
      messageTopic: "new_data",
      answerMessage: protocol.NewDataAnswer,
    },
    {
      messageTopic: "outputs_state",
      answerMessage: protocol.OutputsStateAnswer,
    },
    {
      messageTopic: "zones_tamper",
      answerMessage: protocol.ZonesTamperAnswer,
    },
    {
      messageTopic: "zones_violation",
      answerMessage: protocol.ZonesViolationAnswer,
    },
    {
      messageTopic: "zones_alarm",
      answerMessage: protocol.ZonesAlarmAnswer,
    },
    {
      messageTopic: "zones_tamper_alarm",
      answerMessage: protocol.ZonesTamperAlarmAnswer,
    },
    {
      messageTopic: "zones_alarm_memory",
      answerMessage: protocol.ZonesAlarmMemoryAnswer,
    },
    {
      messageTopic: "zones_tamper_alarm_memory",
      answerMessage: protocol.ZonesTamperAlarmMemoryAnswer,
    },
    {
      messageTopic: "zones_bypass_status",
      answerMessage: protocol.ZonesBypassStatusAnswer,
    },
    {
      messageTopic: "zones_no_violation_trouble",
      answerMessage: protocol.ZonesNoViolationTroubleAnswer,
    },
    {
      messageTopic: "zones_long_violation_trouble",
      answerMessage: protocol.ZonesLongViolationTroubleAnswer,
    },
    {
      messageTopic: "armed_partitions_suppressed",
      answerMessage: protocol.ArmedPartitionsSuppressedAnswer,
    },
    {
      messageTopic: "armed_partitions_really",
      answerMessage: protocol.ArmedPartitionsReallyAnswer,
    },
    {
      messageTopic: "partitions_armed_in_mode_2",
      answerMessage: protocol.PartitionsArmedInMode2Answer,
    },
    {
      messageTopic: "partitions_armed_in_mode_3",
      answerMessage: protocol.PartitionsArmedInMode3Answer,
    },
    {
      messageTopic: "partitions_with_1st_code_entered",
      answerMessage: protocol.PartitionsWith1stCodeEnteredAnswer,
    },
    {
      messageTopic: "partitions_entry_time",
      answerMessage: protocol.PartitionsEntryTimeAnswer,
    },
    {
      messageTopic: "partitions_exit_time_more_then_10s",
      answerMessage: protocol.PartitionsExitTimeMoreThen10sAnswer,
    },
    {
      messageTopic: "partitions_exit_time_less_then_10s",
      answerMessage: protocol.PartitionsExitTimeLessThen10sAnswer,
    },
    {
      messageTopic: "partitions_temporary_blocked",
      answerMessage: protocol.PartitionsTemporaryBlockedAnswer,
    },
    {
      messageTopic: "partitions_blocked_for_guard_round",
      answerMessage: protocol.PartitionsBlockedForGuardRoundAnswer,
    },
    {
      messageTopic: "partitions_alarm",
      answerMessage: protocol.PartitionsAlarmAnswer,
    },
    {
      messageTopic: "partitions_fire_alarm",
      answerMessage: protocol.PartitionsFireAlarmAnswer,
    },
    {
      messageTopic: "partitions_alarm_memory",
      answerMessage: protocol.PartitionsAlarmMemoryAnswer,
    },
    {
      messageTopic: "partitions_fire_alarm_memory",
      answerMessage: protocol.PartitionsFireAlarmMemoryAnswer,
    },
    {
      messageTopic: "zones_isolate_state",
      answerMessage: protocol.ZonesIsolateStateAnswer,
    },
    {
      messageTopic: "zones_masked",
      answerMessage: protocol.ZonesMaskedAnswer,
    },
    {
      messageTopic: "zones_masked_memory",
      answerMessage: protocol.ZonesMaskedMemoryAnswer,
    },
  ];

  decodeFlagsArrayAnswerTest.forEach(function (test) {
    it("should properly parse " + test.messageTopic + " answer", function () {
      return new Promise(function (resolve, reject) {
        const answerMsg = new test.answerMessage();
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
              msg.should.have.property("topic", test.messageTopic);
              msg.should.have.property("payload", answerMsg.flags);
              resolve();
            } catch (error) {
              reject(error);
            }
          });
          decoderNode.receive({ payload: Buffer.from([0x01, 0x02, 0x03]) });
        });
      });
    });
  });

  it("should properly parse command result answer", function () {
    return new Promise(function (resolve, reject) {
      const answerMsg = new protocol.CommandResultAnswer();
      answerMsg.resultCode = 0x42;
      answerMsg.resultMessage = "Result message";
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
            msg.should.have.property("topic", "command_result");
            msg.should.have.property("payload");
            msg.payload.should.have.property("code", answerMsg.resultCode);
            msg.payload.should.have.property(
              "message",
              answerMsg.resultMessage
            );
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        decoderNode.receive({ payload: Buffer.from([0x01, 0x02, 0x03]) });
      });
    });
  });
});
