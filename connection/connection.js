const impl = require("./connection_impl.js");
const net = require("net");

function sendNextMessage(node) {
  if (node.pendingMessage) {
    node.pendingMessage.done();
  }
  node.timeout = null;
  if (node.messageQueue.length == 0) {
    node.status({ fill: "green", shape: "dot", text: "connected" });
    node.pendingMessage = null;
    return;
  }
  node.pendingMessage = node.messageQueue.shift();
  if (node.encryption) {
    node.pendingMessage.message.payload = node.encrypt(
      node.pendingMessage.message.payload
    );
  }
  node.socket.write(node.pendingMessage.message.payload);
  node.status({
    fill: "green",
    shape: "ring",
    text: `${node.messageQueue.length} in queue`,
  });
  node.timeout = setTimeout(function () {
    try {
      sendNextMessage(node);
    } catch (error) {
      node.error(error);
    }
  }, 2000);
}

function addMessageToQueue(node, message, send, done) {
  if (message.topic == "new_data") {
    const new_data_message = node.messageQueue.find(function (item) {
      return item.message.topic == "new_data";
    });
    if (new_data_message) {
      new_data_message.done();
      node.messageQueue = node.messageQueue.filter(function (item) {
        return item.message.topic != "new_data";
      });
    }
  }
  if (node.messageQueue.length >= node.maxMessageQueueSize) {
    const message = node.messageQueue.shift();
    node.warn(
      "Too many messages in the message queue. Dropping the oldest message: " +
        message.message.toString()
    );
    message.done();
  }
  node.messageQueue.push({ message: message, send: send, done: done });
}

module.exports = function (RED) {
  function Connection(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.name = config.name;
    this.server_address = config.server_address;
    this.server_port = config.server_port;
    this.encryption = config.encryption;
    this.max_message_queue_size = config.max_message_queue_size;
    this.maxMessageQueueSize = parseInt(this.max_message_queue_size, 10);
    if (this.encryption) {
      this.cipherKey = impl.getCipherKey(this.credentials.encryption_key);
    }
    this.counter = 0;
    this.idS = 0;
    this.idR = 0;
    this.socket = null;
    this.connected = false;
    this.messageQueue = [];
    this.pendingMessage = null;
    this.timeout = null;
    this.on("input", function (msg, send, done) {
      const payloadType = typeof msg.payload;
      if (typeof msg.payload === "undefined") {
        throw new Error("No 'payload' property in the message.");
      }
      if (!Buffer.isBuffer(msg.payload)) {
        throw new Error("'payload' property is not a Buffer");
      }
      addMessageToQueue(
        node,
        msg,
        function () {
          /* istanbul ignore else: the else path can be reached with old node-red versions only */
          if (send) {
            send.apply(null, arguments);
          } else {
            node.send.apply(node, arguments);
          }
        },
        function () {
          /* istanbul ignore else: the else path can be reached with old node-red versions only */
          if (done) {
            done();
          }
        }
      );
      if (!node.socket) {
        node.socket = net.createConnection(
          parseInt(node.server_port, 10),
          node.server_address
        );
        node.status({ fill: "yellow", shape: "dot", text: "connecting" });
        node.socket.on("ready", function () {
          try {
            node.status({ fill: "green", shape: "dot", text: "connected" });
            node.connected = true;
            node.counter = 0;
            node.idS = 0;
            node.idR = 0;
            sendNextMessage(node);
          } catch (error) {
            node.error(error);
          }
        });
        node.socket.on("data", function (data) {
          try {
            if (node.encryption) {
              data = node.decrypt(data);
            }
            if (node.pendingMessage) {
              node.pendingMessage.message.payload = data;
              node.pendingMessage.send(node.pendingMessage.message);
              node.pendingMessage.done();
              node.pendingMessage = null;
            } else {
              node.send({ payload: data });
            }
            if (node.timeout) {
              clearTimeout(node.timeout);
            }
            if (node.connected) {
              sendNextMessage(node);
            }
          } catch (error) {
            node.error(error);
          }
        });
        node.socket.on("close", function () {
          try {
            node.status({ fill: "grey", shape: "dot", text: "disconnected" });
            node.connected = false;
            node.socket = null;
            clearTimeout(node.timeout);
            if (node.pendingMessage) {
              node.pendingMessage.done();
              node.pendingMessage = null;
            }
            node.timeout = null;
          } catch (error) {
            node.error(error);
          }
        });
        node.socket.on("error", function (error) {
          node.error(new Error("Socket error: " + error.message));
        });
      } else if (node.connected && !node.timeout) {
        sendNextMessage(node);
      }
    });
    this.on("close", function () {
      clearTimeout(node.timeout);
      if (node.pendingMessage) {
        node.pendingMessage.done();
        node.pendingMessage = null;
      }
      if (node.socket) {
        node.socket.destroy();
        node.socket = null;
      }
    });
    this.encrypt = function (frame) {
      const buffer = Buffer.alloc(
        frame.length + 6 < 16 ? 17 : frame.length + 7,
        0
      );
      const encryptedFrame = buffer.subarray(1);
      buffer[0] = encryptedFrame.length;
      const rand = Math.floor(Math.random() * 0x10000);
      this.idS = Math.floor(Math.random() * 0x100);
      encryptedFrame[0] = rand >> 8;
      encryptedFrame[1] = rand;
      encryptedFrame[2] = this.counter >> 8;
      encryptedFrame[3] = this.counter;
      encryptedFrame[4] = this.idS;
      encryptedFrame[5] = this.idR;
      ++this.counter;
      frame.copy(encryptedFrame, 6);
      impl.encrypt(encryptedFrame, this.cipherKey);
      return buffer;
    }.bind(this);
    this.decrypt = function (frame) {
      const length = frame[0];
      if (frame.length - 1 != length) {
        throw new Error(
          "Frame decryption failed. Incorrect encrypted data length, expected: " +
            length.toString() +
            ", actual: " +
            (frame.length - 1).toString()
        );
      }
      const decryptedFrame = Buffer.from(frame.subarray(1));
      impl.decrypt(decryptedFrame, this.cipherKey);
      if (decryptedFrame[5] != node.idS) {
        node.socket.destroy();
        throw Error(
          "Received message with incorrect header (idS). Disconnecting."
        );
      }
      this.idR = decryptedFrame[4];
      return decryptedFrame.subarray(6);
    }.bind(this);
  }
  RED.nodes.registerType("satel-integra-connection", Connection, {
    credentials: {
      encryption_key: { type: "password" },
    },
  });
};
