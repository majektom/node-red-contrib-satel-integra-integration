module.exports = function (RED) {
  function Prefix(config) {
    RED.nodes.createNode(this, config);
    this.name = config.name;
  }
  RED.nodes.registerType("satel-integra-security_prefix", Prefix, {
    credentials: {
      prefix: { type: "password" },
    },
  });
};
