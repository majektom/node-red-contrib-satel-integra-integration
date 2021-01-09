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
            reject(new Error("message should have been discarded"));
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
            reject(new Error("message should have been discarded"));
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

  const encodeNoDataCommandTests = [
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
    {
      commandName: "zones_alarm",
      expectedPayload: protocol.encodeZonesAlarmCommand(),
    },
    {
      commandName: "zones_tamper_alarm",
      expectedPayload: protocol.encodeZonesTamperAlarmCommand(),
    },
    {
      commandName: "zones_alarm_memory",
      expectedPayload: protocol.encodeZonesAlarmMemoryCommand(),
    },
    {
      commandName: "zones_tamper_alarm_memory",
      expectedPayload: protocol.encodeZonesTamperAlarmMemoryCommand(),
    },
    {
      commandName: "zones_bypass_status",
      expectedPayload: protocol.encodeZonesBypassStatusCommand(),
    },
    {
      commandName: "zones_no_violation_trouble",
      expectedPayload: protocol.encodeZonesNoViolationTroubleCommand(),
    },
    {
      commandName: "zones_long_violation_trouble",
      expectedPayload: protocol.encodeZonesLongViolationTroubleCommand(),
    },
    {
      commandName: "armed_partitions_suppressed",
      expectedPayload: protocol.encodeArmedPartitionsSuppressedCommand(),
    },
    {
      commandName: "armed_partitions_really",
      expectedPayload: protocol.encodeArmedPartitionsReallyCommand(),
    },
    {
      commandName: "partitions_armed_in_mode_2",
      expectedPayload: protocol.encodePartitionsArmedInMode2Command(),
    },
    {
      commandName: "partitions_armed_in_mode_3",
      expectedPayload: protocol.encodePartitionsArmedInMode3Command(),
    },
    {
      commandName: "partitions_with_1st_code_entered",
      expectedPayload: protocol.encodePartitionsWith1stCodeEnteredCommand(),
    },
    {
      commandName: "partitions_entry_time",
      expectedPayload: protocol.encodePartitionsEntryTimeCommand(),
    },
    {
      commandName: "partitions_exit_time_more_then_10s",
      expectedPayload: protocol.encodePartitionsExitTimeMoreThen10sCommand(),
    },
    {
      commandName: "partitions_exit_time_less_then_10s",
      expectedPayload: protocol.encodePartitionsExitTimeLessThen10sCommand(),
    },
    {
      commandName: "partitions_temporary_blocked",
      expectedPayload: protocol.encodePartitionsTemporaryBlockedCommand(),
    },
    {
      commandName: "partitions_blocked_for_guard_round",
      expectedPayload: protocol.encodePartitionsBlockedForGuardRoundCommand(),
    },
    {
      commandName: "partitions_alarm",
      expectedPayload: protocol.encodePartitionsAlarmCommand(),
    },
    {
      commandName: "partitions_fire_alarm",
      expectedPayload: protocol.encodePartitionsFireAlarmCommand(),
    },
    {
      commandName: "partitions_alarm_memory",
      expectedPayload: protocol.encodePartitionsAlarmMemoryCommand(),
    },
    {
      commandName: "partitions_fire_alarm_memory",
      expectedPayload: protocol.encodePartitionsFireAlarmMemoryCommand(),
    },
    {
      commandName: "zones_isolate_state",
      expectedPayload: protocol.encodeZonesIsolateStateCommand(),
    },
    {
      commandName: "zones_masked",
      expectedPayload: protocol.encodeZonesMaskedCommand(),
    },
    {
      commandName: "zones_masked_memory",
      expectedPayload: protocol.encodeZonesMaskedMemoryCommand(),
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

  const encodeOutputsChangeCommandTests = [
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
  const encodeOutputsAndZonesChangeCommandTests = [
    {
      commandName: "zones_bypass",
      encodeFunction: protocol.encodeZonesBypassCommand,
      flagFieldName: "zones",
    },
    {
      commandName: "zones_unbypass",
      encodeFunction: protocol.encodeZonesUnbypassCommand,
      flagFieldName: "zones",
    },
    {
      commandName: "zones_isolate",
      encodeFunction: protocol.encodeZonesIsolateCommand,
      flagFieldName: "zones",
    },
  ].concat(
    encodeOutputsChangeCommandTests.map(function (test) {
      let result = Object.assign({}, test);
      result.flagFieldName = "outputs";
      return result;
    })
  );
  encodeOutputsAndZonesChangeCommandTests.forEach(function (test) {
    it("should properly encode " + test.commandName + " command", function () {
      return new Promise(function (resolve, reject) {
        const flagsArray = new Array(128)
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
                    test.encodeFunction("09876654321fffff", flagsArray)
                  );
                  resolve();
                } catch (error) {
                  reject(error);
                }
              });
              helper2Node.on("input", function (msg) {
                reject(msg.error);
              });
              const msg = {
                topic: test.commandName,
                // This deprecated field should be ignored and superseded by code and prefix parameters
                prefixAndUserCode: "87654321ffffffff",
              };
              msg[test.flagFieldName] = flagsArray;
              encoderNode.receive(msg);
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

  const encodePartitionsChangeCommandTests = [
    {
      commandName: "arm_in_mode_0",
      encodeFunction: protocol.encodeArmInMode0Command,
    },
    {
      commandName: "arm_in_mode_1",
      encodeFunction: protocol.encodeArmInMode1Command,
    },
    {
      commandName: "arm_in_mode_2",
      encodeFunction: protocol.encodeArmInMode2Command,
    },
    {
      commandName: "arm_in_mode_3",
      encodeFunction: protocol.encodeArmInMode3Command,
    },
    {
      commandName: "disarm",
      encodeFunction: protocol.encodeDisarmCommand,
    },
    {
      commandName: "clear_alarm",
      encodeFunction: protocol.encodeClearAlarmCommand,
    },
    {
      commandName: "force_arm_in_mode_0",
      encodeFunction: protocol.encodeForceArmInMode0Command,
    },
    {
      commandName: "force_arm_in_mode_1",
      encodeFunction: protocol.encodeForceArmInMode1Command,
    },
    {
      commandName: "force_arm_in_mode_2",
      encodeFunction: protocol.encodeForceArmInMode2Command,
    },
    {
      commandName: "force_arm_in_mode_3",
      encodeFunction: protocol.encodeForceArmInMode3Command,
    },
  ];

  encodePartitionsChangeCommandTests.forEach(function (test) {
    it("should properly encode " + test.commandName + " command", function () {
      return new Promise(function (resolve, reject) {
        const flagsArray = new Array(32)
          .fill(false)
          .fill(true, 3, 4)
          .fill(true, 29, 30);
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
                    test.encodeFunction("09876654321fffff", flagsArray)
                  );
                  resolve();
                } catch (error) {
                  reject(error);
                }
              });
              helper2Node.on("input", function (msg) {
                reject(msg.error);
              });
              const msg = {
                topic: test.commandName,
                // This deprecated field should be ignored and superseded by code and prefix parameters
                prefixAndUserCode: "87654321ffffffff",
              };
              msg.partitions = flagsArray;
              encoderNode.receive(msg);
            }
          )
          .catch(function (reason) {
            reject(reason);
          });
      });
    });
  });

  encodeOutputsAndZonesChangeCommandTests
    .concat(encodePartitionsChangeCommandTests)
    .forEach(function (test) {
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
                    reject(new Error("message should have been discarded"));
                  });
                  helper2Node.on("input", function (msg) {
                    try {
                      msg.should.have.property("topic", test.commandName);
                      msg.should.have.property("error");
                      msg.error.should.have.property("message");
                      msg.error.message.should.match(
                        new RegExp(test.commandName + " command encoding error")
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
