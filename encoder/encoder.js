const impl = require("./encoder_impl.js");
const protocol = require("satel-integra-integration-protocol");

module.exports = function (RED) {
  function Encoder(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.userNode = RED.nodes.getNode(config.user);
    node.prefixNode = RED.nodes.getNode(config.prefix);
    node.on("input", function (msg, send, done) {
      try {
        if (!msg.topic) {
          throw "message without topic";
        }
        if (msg.topic == "new_data") {
          msg.payload = protocol.encodeNewDataCommand();
        } else if (msg.topic == "outputs_state") {
          msg.payload = protocol.encodeOutputsStateCommand();
        } else if (msg.topic == "zones_tamper") {
          msg.payload = protocol.encodeZonesTamperCommand();
        } else if (msg.topic == "zones_violation") {
          msg.payload = protocol.encodeZonesViolationCommand();
        } else if (msg.topic == "zones_alarm") {
          msg.payload = protocol.encodeZonesAlarmCommand();
        } else if (msg.topic == "zones_tamper_alarm") {
          msg.payload = protocol.encodeZonesTamperAlarmCommand();
        } else if (msg.topic == "zones_alarm_memory") {
          msg.payload = protocol.encodeZonesAlarmMemoryCommand();
        } else if (msg.topic == "zones_tamper_alarm_memory") {
          msg.payload = protocol.encodeZonesTamperAlarmMemoryCommand();
        } else if (msg.topic == "zones_bypass_status") {
          msg.payload = protocol.encodeZonesBypassStatusCommand();
        } else if (msg.topic == "zones_no_violation_trouble") {
          msg.payload = protocol.encodeZonesNoViolationTroubleCommand();
        } else if (msg.topic == "zones_long_violation_trouble") {
          msg.payload = protocol.encodeZonesLongViolationTroubleCommand();
        } else if (msg.topic == "armed_partitions_suppressed") {
          msg.payload = protocol.encodeArmedPartitionsSuppressedCommand();
        } else if (msg.topic == "armed_partitions_really") {
          msg.payload = protocol.encodeArmedPartitionsReallyCommand();
        } else if (msg.topic == "partitions_armed_in_mode_2") {
          msg.payload = protocol.encodePartitionsArmedInMode2Command();
        } else if (msg.topic == "partitions_armed_in_mode_3") {
          msg.payload = protocol.encodePartitionsArmedInMode3Command();
        } else if (msg.topic == "partitions_with_1st_code_entered") {
          msg.payload = protocol.encodePartitionsWith1stCodeEnteredCommand();
        } else if (msg.topic == "partitions_entry_time") {
          msg.payload = protocol.encodePartitionsEntryTimeCommand();
        } else if (msg.topic == "partitions_exit_time_more_then_10s") {
          msg.payload = protocol.encodePartitionsExitTimeMoreThen10sCommand();
        } else if (msg.topic == "partitions_exit_time_less_then_10s") {
          msg.payload = protocol.encodePartitionsExitTimeLessThen10sCommand();
        } else if (msg.topic == "partitions_temporary_blocked") {
          msg.payload = protocol.encodePartitionsTemporaryBlockedCommand();
        } else if (msg.topic == "partitions_blocked_for_guard_round") {
          msg.payload = protocol.encodePartitionsBlockedForGuardRoundCommand();
        } else if (msg.topic == "partitions_alarm") {
          msg.payload = protocol.encodePartitionsAlarmCommand();
        } else if (msg.topic == "partitions_fire_alarm") {
          msg.payload = protocol.encodePartitionsFireAlarmCommand();
        } else if (msg.topic == "partitions_alarm_memory") {
          msg.payload = protocol.encodePartitionsAlarmMemoryCommand();
        } else if (msg.topic == "partitions_fire_alarm_memory") {
          msg.payload = protocol.encodePartitionsFireAlarmMemoryCommand();
        } else if (msg.topic == "zones_isolate_state") {
          msg.payload = protocol.encodeZonesIsolateStateCommand();
        } else if (msg.topic == "zones_masked") {
          msg.payload = protocol.encodeZonesMaskedCommand();
        } else if (msg.topic == "zones_masked_memory") {
          msg.payload = protocol.encodeZonesMaskedMemoryCommand();
        } else if (msg.topic == "outputs_off") {
          impl.encodeOutputsChangeCommand(
            msg,
            protocol.encodeOutputsOffCommand,
            impl.getPrefixAndUserCode(node.userNode, node.prefixNode)
          );
        } else if (msg.topic == "outputs_on") {
          impl.encodeOutputsChangeCommand(
            msg,
            protocol.encodeOutputsOnCommand,
            impl.getPrefixAndUserCode(node.userNode, node.prefixNode)
          );
        } else if (msg.topic == "outputs_switch") {
          impl.encodeOutputsChangeCommand(
            msg,
            protocol.encodeOutputsSwitchCommand,
            impl.getPrefixAndUserCode(node.userNode, node.prefixNode)
          );
        } else if (msg.topic == "zones_bypass") {
          impl.encodeZonesChangeCommand(
            msg,
            protocol.encodeZonesBypassCommand,
            impl.getPrefixAndUserCode(node.userNode, node.prefixNode)
          );
        } else if (msg.topic == "zones_unbypass") {
          impl.encodeZonesChangeCommand(
            msg,
            protocol.encodeZonesUnbypassCommand,
            impl.getPrefixAndUserCode(node.userNode, node.prefixNode)
          );
        } else if (msg.topic == "zones_isolate") {
          impl.encodeZonesChangeCommand(
            msg,
            protocol.encodeZonesIsolateCommand,
            impl.getPrefixAndUserCode(node.userNode, node.prefixNode)
          );
        } else if (msg.topic == "arm_in_mode_0") {
          impl.encodePartitionsChangeCommand(
            msg,
            protocol.encodeArmInMode0Command,
            impl.getPrefixAndUserCode(node.userNode, node.prefixNode)
          );
        } else if (msg.topic == "arm_in_mode_1") {
          impl.encodePartitionsChangeCommand(
            msg,
            protocol.encodeArmInMode1Command,
            impl.getPrefixAndUserCode(node.userNode, node.prefixNode)
          );
        } else if (msg.topic == "arm_in_mode_2") {
          impl.encodePartitionsChangeCommand(
            msg,
            protocol.encodeArmInMode2Command,
            impl.getPrefixAndUserCode(node.userNode, node.prefixNode)
          );
        } else if (msg.topic == "arm_in_mode_3") {
          impl.encodePartitionsChangeCommand(
            msg,
            protocol.encodeArmInMode3Command,
            impl.getPrefixAndUserCode(node.userNode, node.prefixNode)
          );
        } else if (msg.topic == "disarm") {
          impl.encodePartitionsChangeCommand(
            msg,
            protocol.encodeDisarmCommand,
            impl.getPrefixAndUserCode(node.userNode, node.prefixNode)
          );
        } else if (msg.topic == "clear_alarm") {
          impl.encodePartitionsChangeCommand(
            msg,
            protocol.encodeClearAlarmCommand,
            impl.getPrefixAndUserCode(node.userNode, node.prefixNode)
          );
        } else if (msg.topic == "force_arm_in_mode_0") {
          impl.encodePartitionsChangeCommand(
            msg,
            protocol.encodeForceArmInMode0Command,
            impl.getPrefixAndUserCode(node.userNode, node.prefixNode)
          );
        } else if (msg.topic == "force_arm_in_mode_1") {
          impl.encodePartitionsChangeCommand(
            msg,
            protocol.encodeForceArmInMode1Command,
            impl.getPrefixAndUserCode(node.userNode, node.prefixNode)
          );
        } else if (msg.topic == "force_arm_in_mode_2") {
          impl.encodePartitionsChangeCommand(
            msg,
            protocol.encodeForceArmInMode2Command,
            impl.getPrefixAndUserCode(node.userNode, node.prefixNode)
          );
        } else if (msg.topic == "force_arm_in_mode_3") {
          impl.encodePartitionsChangeCommand(
            msg,
            protocol.encodeForceArmInMode3Command,
            impl.getPrefixAndUserCode(node.userNode, node.prefixNode)
          );
        } else {
          throw "unsupported message topic: '" + msg.topic + "'";
        }
        /* istanbul ignore else: the else path can be reached with old node-red versions only */
        if (send) {
          send(msg);
        } else {
          node.send(msg);
        }
        /* istanbul ignore else: the else path can be reached with old node-red versions only */
        if (done) {
          done();
        }
      } catch (error) {
        /* istanbul ignore else: the else path can be reached with old node-red versions only */
        if (done) {
          done(error);
        } else {
          node.error(error, msg);
        }
      }
    });
  }
  RED.nodes.registerType("satel-integra-encoder", Encoder);
};
