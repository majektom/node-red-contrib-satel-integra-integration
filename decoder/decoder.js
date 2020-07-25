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
