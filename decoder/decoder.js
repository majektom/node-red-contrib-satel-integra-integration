const protocol = require("satel-integra-integration-protocol");

module.exports = function (RED) {
  function Decoder(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.on("input", function (msg, send, done) {
      if (!(msg.payload instanceof Buffer)) {
        const err = "message doesn't have a buffer in the 'payload' field";
        /* istanbul ignore else: the else path can be reached with old node-red versions only */
        if (done) {
          done(err);
        } else {
          node.error(err, msg);
        }
        return;
      }
      const decoded_msg = protocol.decodeMessage(msg.payload);
      if (decoded_msg instanceof protocol.NewDataAnswer) {
        msg.topic = "new_data";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.OutputsStateAnswer) {
        msg.topic = "outputs_state";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.ZonesTamperAnswer) {
        msg.topic = "zones_tamper";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.ZonesViolationAnswer) {
        msg.topic = "zones_violation";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.ZonesAlarmAnswer) {
        msg.topic = "zones_alarm";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.ZonesTamperAlarmAnswer) {
        msg.topic = "zones_tamper_alarm";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.ZonesAlarmMemoryAnswer) {
        msg.topic = "zones_alarm_memory";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.ZonesTamperAlarmMemoryAnswer) {
        msg.topic = "zones_tamper_alarm_memory";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.ZonesBypassStatusAnswer) {
        msg.topic = "zones_bypass_status";
        msg.payload = decoded_msg.flags;
      } else if (
        decoded_msg instanceof protocol.ZonesNoViolationTroubleAnswer
      ) {
        msg.topic = "zones_no_violation_trouble";
        msg.payload = decoded_msg.flags;
      } else if (
        decoded_msg instanceof protocol.ZonesLongViolationTroubleAnswer
      ) {
        msg.topic = "zones_long_violation_trouble";
        msg.payload = decoded_msg.flags;
      } else if (
        decoded_msg instanceof protocol.ArmedPartitionsSuppressedAnswer
      ) {
        msg.topic = "armed_partitions_suppressed";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.ArmedPartitionsReallyAnswer) {
        msg.topic = "armed_partitions_really";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.PartitionsArmedInMode2Answer) {
        msg.topic = "partitions_armed_in_mode_2";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.PartitionsArmedInMode3Answer) {
        msg.topic = "partitions_armed_in_mode_3";
        msg.payload = decoded_msg.flags;
      } else if (
        decoded_msg instanceof protocol.PartitionsWith1stCodeEnteredAnswer
      ) {
        msg.topic = "partitions_with_1st_code_entered";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.PartitionsEntryTimeAnswer) {
        msg.topic = "partitions_entry_time";
        msg.payload = decoded_msg.flags;
      } else if (
        decoded_msg instanceof protocol.PartitionsExitTimeMoreThen10sAnswer
      ) {
        msg.topic = "partitions_exit_time_more_then_10s";
        msg.payload = decoded_msg.flags;
      } else if (
        decoded_msg instanceof protocol.PartitionsExitTimeLessThen10sAnswer
      ) {
        msg.topic = "partitions_exit_time_less_then_10s";
        msg.payload = decoded_msg.flags;
      } else if (
        decoded_msg instanceof protocol.PartitionsTemporaryBlockedAnswer
      ) {
        msg.topic = "partitions_temporary_blocked";
        msg.payload = decoded_msg.flags;
      } else if (
        decoded_msg instanceof protocol.PartitionsBlockedForGuardRoundAnswer
      ) {
        msg.topic = "partitions_blocked_for_guard_round";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.PartitionsAlarmAnswer) {
        msg.topic = "partitions_alarm";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.PartitionsFireAlarmAnswer) {
        msg.topic = "partitions_fire_alarm";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.PartitionsAlarmMemoryAnswer) {
        msg.topic = "partitions_alarm_memory";
        msg.payload = decoded_msg.flags;
      } else if (
        decoded_msg instanceof protocol.PartitionsFireAlarmMemoryAnswer
      ) {
        msg.topic = "partitions_fire_alarm_memory";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.ZonesIsolateStateAnswer) {
        msg.topic = "zones_isolate_state";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.ZonesMaskedAnswer) {
        msg.topic = "zones_masked";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.ZonesMaskedMemoryAnswer) {
        msg.topic = "zones_masked_memory";
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.CommandResultAnswer) {
        msg.topic = "command_result";
        msg.payload = {
          code: decoded_msg.resultCode,
          message: decoded_msg.resultMessage,
        };
      } else {
        const err =
          "message decoding failed, payload: " + msg.payload.toString("hex");
        /* istanbul ignore else: the else path can be reached with old node-red versions only */
        if (done) {
          done(err);
        } else {
          node.error(err, msg);
        }
        return;
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
    });
  }
  RED.nodes.registerType("satel-integra-decoder", Decoder);
};
