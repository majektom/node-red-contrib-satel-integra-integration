const protocol = require("satel-integra-integration-protocol");

module.exports = function (RED) {
  function Encoder(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.on("input", function (msg, send, done) {
      if (!msg.topic) {
        const err = "message without topic";
        if (done) {
          done(err);
        } else {
          node.error(err, msg);
        }
        return;
      }
      let cmd;
      if (msg.topic == "new_data") {
        cmd = new protocol.NewDataCommand();
      } else if (msg.topic == "outputs_state") {
        cmd = new protocol.OutputsStateCommand();
      } else if (msg.topic == "zones_tamper") {
        cmd = new protocol.ZonesTamperCommand();
      } else if (msg.topic == "zones_violation") {
        cmd = new protocol.ZonesViolationCommand();
      } else {
        const err = "unsupported message topic: '" + msg.topic + "'";
        if (done) {
          done(err);
        } else {
          node.error(err, msg);
        }
        return;
      }
      msg.payload = cmd.encode();
      if (send) {
        send(msg);
      } else {
        node.send(msg);
      }
      if (done) {
        done();
      }
    });
  }
  RED.nodes.registerType("satel-integra-encoder", Encoder);
};
