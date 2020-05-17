const protocol = require("satel-integra-integration-protocol");

module.exports = function(RED) {
  function Decoder(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.on('input', function(msg) {
      if (!msg.payload instanceof ArrayBuffer) {
        return;    
      }
      const decoded_msg = protocol.decodeMessage(msg.payload);
      msg = new Object();
      if (decoded_msg instanceof protocol.NewDataAnswer) {
        msg.topic = "new_data"
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.OutputsStateAnswer) {
        msg.topic = "outputs_state"
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.ZonesTamperAnswer) {
        msg.topic = "zones_tamper"
        msg.payload = decoded_msg.flags;
      } else if (decoded_msg instanceof protocol.ZonesViolationAnswer) {
        msg.topic = "zones_violation"
        msg.payload = decoded_msg.flags;
      } else {
        return;
      }
      node.send(msg);
    });
  }
  RED.nodes.registerType("satel-integra-decoder", Decoder);
}
