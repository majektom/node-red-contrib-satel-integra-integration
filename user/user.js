module.exports = function (RED) {
  function User(config) {
    RED.nodes.createNode(this, config);
    this.name = config.name;
  }
  RED.nodes.registerType("satel-integra-user", User, {
    credentials: {
      code: { type: "password" },
    },
  });
};
