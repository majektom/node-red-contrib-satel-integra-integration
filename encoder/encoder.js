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
