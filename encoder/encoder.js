const protocol = require("satel-integra-integration-protocol");

module.exports = function (RED) {
  function Encoder(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.on("input", function (msg) {
      if (!msg.topic) {
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
        return;
      }
      msg.payload = cmd.encode();
      node.send(msg);
    });
  }
  RED.nodes.registerType("satel-integra-encoder", Encoder);
};
