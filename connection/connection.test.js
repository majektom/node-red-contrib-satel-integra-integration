const catchNode = require("@node-red/nodes/core/common/25-catch");
const completeNode = require("@node-red/nodes/core/common/24-complete");
const connection = require("./connection.js");
const helper = require("node-red-node-test-helper");
const impl = require("./connection_impl.js");
const net = require("net");
const sinon = require("sinon");
const { server } = require("node-red");
const { timeStamp } = require("console");

helper.init(require.resolve("node-red"));

function createMockSocket(writeCallback) {
  const mockSocket = {
    sentBuffers: [],
    on: function (event, callback) {
      const callbackName = event + "_callback";
      (typeof mockSocket[callbackName]).should.be.equal("undefined");
      mockSocket[callbackName] = callback;
      if (event == "ready") {
        setImmediate(callback);
      }
    },
    write: function (buffer) {
      mockSocket.sentBuffers.push(buffer);
      mockSocket.should.have.property("data_callback");
      writeCallback(buffer);
    },
    destroy: function () {
      mockSocket.should.have.property("close_callback");
      setImmediate(mockSocket.close_callback.bind(null));
    },
  };
  return mockSocket;
}

describe("satel-integra-connection Node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload();
    helper.stopServer(done);
    sinon.restore();
  });

  it("should be loaded", function () {
    return new Promise(function (resolve, reject) {
      const nameValue = "Connection";
      const serverAddressValue = "192.168.0.1";
      const serverPortValue = "1234";
      const encryptionKeyValue = "09876";
      const maxMessageQueueSizeValue = "64";
      const flow = [
        {
          id: "connection1",
          type: "satel-integra-connection",
          name: nameValue,
          server_address: serverAddressValue,
          server_port: serverPortValue,
          encryption: true,
          max_message_queue_size: maxMessageQueueSizeValue,
        },
      ];
      const credentials = {
        connection1: { encryption_key: encryptionKeyValue },
      };
      helper
        .load([connection], flow, credentials, function () {
          const connectionNode = helper.getNode("connection1");
          connectionNode.should.have.property("name", nameValue);
          connectionNode.should.have.property(
            "server_address",
            serverAddressValue
          );
          connectionNode.should.have.property("server_port", serverPortValue);
          connectionNode.should.have.property("encryption", true);
          connectionNode.credentials.should.have.property(
            "encryption_key",
            encryptionKeyValue
          );
          connectionNode.should.have.property(
            "max_message_queue_size",
            maxMessageQueueSizeValue
          );
        })
        .then(
          function () {
            resolve();
          },
          function (reason) {
            reject(reason);
          }
        );
    });
  });

  it("should issue error on message without payload", function () {
    return new Promise(function (resolve, reject) {
      const nameValue = "Connection";
      const serverAddressValue = "192.168.0.1";
      const serverPortValue = "1234";
      const encryptionKeyValue = "09876";
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "connection1",
          z: "f1",
          type: "satel-integra-connection",
          name: nameValue,
          server_address: serverAddressValue,
          server_port: serverPortValue,
          encryption: false,
          wires: [["n2"]],
        },
        { id: "n2", z: "f1", type: "helper" },
        { id: "n3", z: "f1", type: "helper" },
        { id: "n4", z: "f1", type: "catch", wires: [["n3"]] },
      ];
      const credentials = {
        connection1: { encryption_key: encryptionKeyValue },
      };
      helper.load([connection, catchNode], flow, credentials, function () {
        const connectionNode = helper.getNode("connection1");
        const helperNode1 = helper.getNode("n2");
        const helperNode2 = helper.getNode("n3");
        helperNode1.on("input", function (msg) {
          reject(new Error("message should have been discarded"));
        });
        helperNode2.on("input", function (msg) {
          try {
            msg.should.have.property("error");
            msg.error.should.have.property("source", {
              id: "connection1",
              type: "satel-integra-connection",
              name: nameValue,
              count: 1,
            });
            msg.error.should.have.property("message");
            msg.error.message.should.match(/No 'payload' property/);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        connectionNode.receive({});
      });
    });
  });

  it("should issue error on message with non-Buffer payload", function () {
    return new Promise(function (resolve, reject) {
      const nameValue = "Connection";
      const serverAddressValue = "192.168.0.1";
      const serverPortValue = "1234";
      const encryptionKeyValue = "09876";
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "connection1",
          z: "f1",
          type: "satel-integra-connection",
          name: nameValue,
          server_address: serverAddressValue,
          server_port: serverPortValue,
          encryption: false,
          wires: [["n2"]],
        },
        { id: "n2", z: "f1", type: "helper" },
        { id: "n3", z: "f1", type: "helper" },
        { id: "n4", z: "f1", type: "catch", wires: [["n3"]] },
      ];
      const credentials = {
        connection1: { encryption_key: encryptionKeyValue },
      };
      helper.load([connection, catchNode], flow, credentials, function () {
        const connectionNode = helper.getNode("connection1");
        const helperNode1 = helper.getNode("n2");
        const helperNode2 = helper.getNode("n3");
        helperNode1.on("input", function (msg) {
          reject(new Error("message should have been discarded"));
        });
        helperNode2.on("input", function (msg) {
          try {
            msg.should.have.property("error");
            msg.error.should.have.property("source", {
              id: "connection1",
              type: "satel-integra-connection",
              name: nameValue,
              count: 1,
            });
            msg.error.should.have.property("message");
            msg.error.message.should.match(
              /'payload' property is not a Buffer/
            );
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        connectionNode.receive({ payload: "payload" });
      });
    });
  });

  it("should transmit 'payload' Buffer", function () {
    return new Promise(function (resolve, reject) {
      const nameValue = "Connection";
      const serverAddressValue = "192.168.0.1";
      const serverPortValue = "1234";
      const encryptionKeyValue = "09876";
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "connection1",
          z: "f1",
          type: "satel-integra-connection",
          name: nameValue,
          server_address: serverAddressValue,
          server_port: serverPortValue,
          encryption: false,
          wires: [["n2"]],
        },
        { id: "n2", z: "f1", type: "helper" },
        { id: "n3", z: "f1", type: "helper" },
        { id: "n4", z: "f1", type: "catch", wires: [["n3"]] },
      ];
      const credentials = {
        connection1: { encryption_key: encryptionKeyValue },
      };
      const frame = Buffer.from([0x01, 0x02, 0x03, 0x04]);
      const mockSocket = createMockSocket(function (buffer) {
        setImmediate(mockSocket.data_callback.bind(null, buffer));
      });
      sinon.replace(
        net,
        "createConnection",
        sinon.fake(function (port, address) {
          port.should.be.equal(parseInt(serverPortValue, 10));
          address.should.be.equal(serverAddressValue);
          return mockSocket;
        })
      );
      helper.load([connection, catchNode], flow, credentials, function () {
        const connectionNode = helper.getNode("connection1");
        const helperNode1 = helper.getNode("n2");
        const helperNode2 = helper.getNode("n3");
        helperNode1.on("input", function (msg) {
          try {
            mockSocket.should.have.property("ready_callback");
            mockSocket.should.have.property("data_callback");
            mockSocket.should.have.property("close_callback");
            mockSocket.sentBuffers.length.should.be.equal(1);
            mockSocket.sentBuffers[0].should.be.equal(frame);
            msg.should.have.property("payload", frame);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        helperNode2.on("input", function (msg) {
          reject(
            new Error("error has been issued in the flow: " + msg.error.message)
          );
        });
        connectionNode.receive({ payload: frame });
      });
    });
  });

  it("should delay subsequent message until previous message is answered", function () {
    return new Promise(function (resolve, reject) {
      const nameValue = "Connection";
      const serverAddressValue = "192.168.0.1";
      const serverPortValue = "1234";
      const encryptionKeyValue = "09876";
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "connection1",
          z: "f1",
          type: "satel-integra-connection",
          name: nameValue,
          server_address: serverAddressValue,
          server_port: serverPortValue,
          encryption: false,
          wires: [["n2"]],
        },
        { id: "n2", z: "f1", type: "helper" },
        { id: "n3", z: "f1", type: "helper" },
        { id: "n4", z: "f1", type: "catch", wires: [["n3"]] },
      ];
      const credentials = {
        connection1: { encryption_key: encryptionKeyValue },
      };
      const buffer = Buffer.from([0x01, 0x02, 0x03]);
      const messages = [buffer.subarray(0), buffer.subarray(1)];
      let receivedAnswers = 0;
      const mockSocket = createMockSocket(function (buffer) {
        setTimeout(function () {
          mockSocket.sentBuffers.length.should.be.equal(receivedAnswers + 1);
          mockSocket.sentBuffers[receivedAnswers].should.be.equal(
            messages[receivedAnswers]
          );
          mockSocket.data_callback(buffer);
        }, 300);
      });
      sinon.replace(
        net,
        "createConnection",
        sinon.fake(function (port, address) {
          port.should.be.equal(parseInt(serverPortValue, 10));
          address.should.be.equal(serverAddressValue);
          return mockSocket;
        })
      );
      helper.load([connection, catchNode], flow, credentials, function () {
        const connectionNode = helper.getNode("connection1");
        const helperNode1 = helper.getNode("n2");
        const helperNode2 = helper.getNode("n3");
        helperNode1.on("input", function (msg) {
          try {
            msg.should.have.property("payload", messages[receivedAnswers]);
            if (++receivedAnswers == 2) {
              resolve();
            }
          } catch (error) {
            reject(error);
          }
        });
        helperNode2.on("input", function (msg) {
          reject(
            new Error("error has been issued in the flow: " + msg.error.message)
          );
        });
        connectionNode.receive({ payload: messages[0] });
        connectionNode.receive({ payload: messages[1] });
      });
    });
  });

  it("should delay subsequent message until previous message is timed out", function () {
    this.timeout(3000);
    return new Promise(function (resolve, reject) {
      const nameValue = "Connection";
      const serverAddressValue = "192.168.0.1";
      const serverPortValue = "1234";
      const encryptionKeyValue = "09876";
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "connection1",
          z: "f1",
          type: "satel-integra-connection",
          name: nameValue,
          server_address: serverAddressValue,
          server_port: serverPortValue,
          encryption: false,
          wires: [["n2"]],
        },
        { id: "n2", z: "f1", type: "helper" },
        { id: "n3", z: "f1", type: "helper" },
        { id: "n4", z: "f1", type: "catch", wires: [["n3"]] },
      ];
      const credentials = {
        connection1: { encryption_key: encryptionKeyValue },
      };
      const buffer = Buffer.from([0x01, 0x02, 0x03]);
      const messages = [buffer.subarray(0), buffer.subarray(1)];
      let receivedAnswers = 0;
      let firstMessageSentTime = null;
      const mockSocket = createMockSocket(function (buffer) {
        if (mockSocket.sentBuffers.length == 1) {
          firstMessageSentTime = Date.now();
          // don't answer first message
        } else {
          (Date.now() - firstMessageSentTime).should.be.greaterThan(1900);
          setImmediate(mockSocket.data_callback.bind(null, buffer));
        }
      });
      sinon.replace(
        net,
        "createConnection",
        sinon.fake(function (port, address) {
          port.should.be.equal(parseInt(serverPortValue, 10));
          address.should.be.equal(serverAddressValue);
          return mockSocket;
        })
      );
      helper.load([connection, catchNode], flow, credentials, function () {
        const connectionNode = helper.getNode("connection1");
        const helperNode1 = helper.getNode("n2");
        const helperNode2 = helper.getNode("n3");
        helperNode1.on("input", function (msg) {
          try {
            msg.should.have.property("payload", messages[1]);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        helperNode2.on("input", function (msg) {
          reject(
            new Error("error has been issued in the flow: " + msg.error.message)
          );
        });
        connectionNode.receive({ payload: messages[0] });
        connectionNode.receive({ payload: messages[1] });
      });
    });
  });

  it("should finalize sent message after timeout", function () {
    this.timeout(3000);
    return new Promise(function (resolve, reject) {
      const nameValue = "Connection";
      const serverAddressValue = "192.168.0.1";
      const serverPortValue = "1234";
      const encryptionKeyValue = "09876";
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "connection1",
          z: "f1",
          type: "satel-integra-connection",
          name: nameValue,
          server_address: serverAddressValue,
          server_port: serverPortValue,
          encryption: false,
          wires: [["helper1"]],
        },
        { id: "helper1", z: "f1", type: "helper" },
        { id: "helper2", z: "f1", type: "helper" },
        { id: "helper3", z: "f1", type: "helper" },
        { id: "catch1", z: "f1", type: "catch", wires: [["helper2"]] },
        {
          id: "complete1",
          z: "f1",
          type: "complete",
          scope: ["connection1"],
          wires: [["helper3"]],
        },
      ];
      const credentials = {
        connection1: { encryption_key: encryptionKeyValue },
      };
      const message = Buffer.from([0x01, 0x02, 0x03]);
      const mockSocket = createMockSocket(function (buffer) {
        mockSocket.sentBuffers.length.should.be.equal(1);
      });
      sinon.replace(
        net,
        "createConnection",
        sinon.fake(function (port, address) {
          port.should.be.equal(parseInt(serverPortValue, 10));
          address.should.be.equal(serverAddressValue);
          return mockSocket;
        })
      );
      helper.load(
        [connection, catchNode, completeNode],
        flow,
        credentials,
        function () {
          const connectionNode = helper.getNode("connection1");
          const helperNode1 = helper.getNode("helper1");
          const helperNode2 = helper.getNode("helper2");
          const helperNode3 = helper.getNode("helper3");
          helperNode1.on("input", function (msg) {
            reject(
              new Error(
                "no message should have been emitted by the connection node"
              )
            );
          });
          helperNode2.on("input", function (msg) {
            reject(
              new Error(
                "error has been issued in the flow: " + msg.error.message
              )
            );
          });
          helperNode3.on("input", function (msg) {
            try {
              msg.should.have.property("payload", message);
              resolve();
            } catch (error) {
              reject(error);
            }
          });
          connectionNode.receive({ payload: message });
        }
      );
    });
  });

  it("should drop oldest message when queue size limit exceeded", function () {
    return new Promise(function (resolve, reject) {
      const nameValue = "Connection";
      const serverAddressValue = "192.168.0.1";
      const serverPortValue = "1234";
      const encryptionKeyValue = "09876";
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "connection1",
          z: "f1",
          type: "satel-integra-connection",
          name: nameValue,
          server_address: serverAddressValue,
          server_port: serverPortValue,
          encryption: false,
          max_message_queue_size: "1",
          wires: [["helper1"]],
        },
        { id: "helper1", z: "f1", type: "helper" },
        { id: "helper2", z: "f1", type: "helper" },
        { id: "helper3", z: "f1", type: "helper" },
        { id: "catch1", z: "f1", type: "catch", wires: [["helper2"]] },
        {
          id: "complete1",
          z: "f1",
          type: "complete",
          scope: ["connection1"],
          wires: [["helper3"]],
        },
      ];
      const credentials = {
        connection1: { encryption_key: encryptionKeyValue },
      };
      const buffer = Buffer.from([0x01, 0x02, 0x03]);
      const messages = [
        buffer.subarray(0),
        buffer.subarray(1),
        buffer.subarray(2),
      ];
      let connectionNode = null;
      let receivedMessages = 0;
      let completedMessages = 0;
      const mockSocket = createMockSocket(function (buffer) {
        setTimeout(mockSocket.data_callback.bind(null, buffer), 100);
      });
      sinon.replace(
        net,
        "createConnection",
        sinon.fake(function (port, address) {
          port.should.be.equal(parseInt(serverPortValue, 10));
          address.should.be.equal(serverAddressValue);
          return mockSocket;
        })
      );
      helper.load(
        [connection, catchNode, completeNode],
        flow,
        credentials,
        function () {
          connectionNode = helper.getNode("connection1");
          const helperNode1 = helper.getNode("helper1");
          const helperNode2 = helper.getNode("helper2");
          const helperNode3 = helper.getNode("helper3");
          helperNode1.on("input", function (msg) {
            try {
              switch (++receivedMessages) {
                case 1:
                  msg.should.have.property("payload", messages[0]);
                  break;
                case 2:
                  msg.should.have.property("payload", messages[2]);
                  break;
                default:
                  throw new Error("received unexpected message: " + msg);
              }
              if (receivedMessages === 2 && completedMessages === 3) {
                resolve();
              }
            } catch (error) {
              reject(error);
            }
          });
          helperNode2.on("input", function (msg) {
            reject(
              new Error(
                "error has been issued in the flow: " + msg.error.message
              )
            );
          });
          helperNode3.on("input", function (msg) {
            try {
              switch (++completedMessages) {
                case 1:
                  // First, the middle message should have been dropped.
                  msg.should.have.property("payload", messages[1]);
                  break;
                case 2:
                  // Then the first message should have been answered.
                  msg.should.have.property("payload", messages[0]);
                  break;
                case 3:
                  // Then the last message should have been answered.
                  msg.should.have.property("payload", messages[2]);
                  break;
                default:
                  throw new Error("received unexpected message: " + msg);
              }
              if (receivedMessages === 2 && completedMessages === 3) {
                resolve();
              }
            } catch (error) {
              reject(error);
            }
          });
          connectionNode.receive({ payload: messages[0] });
          setImmediate(
            connectionNode.receive.bind(connectionNode, {
              payload: messages[1],
            })
          );
          setImmediate(
            connectionNode.receive.bind(connectionNode, {
              payload: messages[2],
            })
          );
        }
      );
    });
  });

  it("should send message in connected-idle state", function () {
    return new Promise(function (resolve, reject) {
      const nameValue = "Connection";
      const serverAddressValue = "192.168.0.1";
      const serverPortValue = "1234";
      const encryptionKeyValue = "09876";
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "connection1",
          z: "f1",
          type: "satel-integra-connection",
          name: nameValue,
          server_address: serverAddressValue,
          server_port: serverPortValue,
          encryption: false,
          max_message_queue_size: "1",
          wires: [["helper1"]],
        },
        { id: "helper1", z: "f1", type: "helper" },
        { id: "helper2", z: "f1", type: "helper" },
        { id: "helper3", z: "f1", type: "helper" },
        { id: "catch1", z: "f1", type: "catch", wires: [["helper2"]] },
        {
          id: "complete1",
          z: "f1",
          type: "complete",
          scope: ["connection1"],
          wires: [["helper3"]],
        },
      ];
      const credentials = {
        connection1: { encryption_key: encryptionKeyValue },
      };
      const buffer = Buffer.from([0x01, 0x02, 0x03]);
      const messages = [buffer.subarray(0), buffer.subarray(1)];
      let receivedFirstMessageMessages = false;
      const mockSocket = createMockSocket(function (buffer) {
        setImmediate(mockSocket.data_callback.bind(null, buffer));
      });
      sinon.replace(
        net,
        "createConnection",
        sinon.fake(function (port, address) {
          port.should.be.equal(parseInt(serverPortValue, 10));
          address.should.be.equal(serverAddressValue);
          return mockSocket;
        })
      );
      helper.load(
        [connection, catchNode, completeNode],
        flow,
        credentials,
        function () {
          const connectionNode = helper.getNode("connection1");
          const helperNode1 = helper.getNode("helper1");
          const helperNode2 = helper.getNode("helper2");
          const helperNode3 = helper.getNode("helper3");
          helperNode1.on("input", function (msg) {
            if (!receivedFirstMessageMessages) {
              receivedFirstMessageMessages = true;
              msg.should.have.property("payload", messages[0]);
              connectionNode.receive({ payload: messages[1] });
            } else {
              msg.should.have.property("payload", messages[1]);
              resolve();
            }
          });
          helperNode2.on("input", function (msg) {
            reject(
              new Error(
                "error has been issued in the flow: " + msg.error.message
              )
            );
          });
          connectionNode.receive({ payload: messages[0] });
        }
      );
    });
  });

  it("should create new answer message if response arrived after timeout", function () {
    this.timeout(3000);
    return new Promise(function (resolve, reject) {
      const nameValue = "Connection";
      const serverAddressValue = "192.168.0.1";
      const serverPortValue = "1234";
      const encryptionKeyValue = "09876";
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "connection1",
          z: "f1",
          type: "satel-integra-connection",
          name: nameValue,
          server_address: serverAddressValue,
          server_port: serverPortValue,
          encryption: false,
          max_message_queue_size: "1",
          wires: [["helper1"]],
        },
        { id: "helper1", z: "f1", type: "helper" },
        { id: "helper2", z: "f1", type: "helper" },
        { id: "helper3", z: "f1", type: "helper" },
        { id: "catch1", z: "f1", type: "catch", wires: [["helper2"]] },
        {
          id: "complete1",
          z: "f1",
          type: "complete",
          scope: ["connection1"],
          wires: [["helper3"]],
        },
      ];
      const credentials = {
        connection1: { encryption_key: encryptionKeyValue },
      };
      const message = Buffer.from([0x01, 0x02, 0x03]);
      let originalMessageId = null;
      const mockSocket = createMockSocket(function (buffer) {
        setTimeout(mockSocket.data_callback.bind(null, buffer), 2200);
      });
      sinon.replace(
        net,
        "createConnection",
        sinon.fake(function (port, address) {
          port.should.be.equal(parseInt(serverPortValue, 10));
          address.should.be.equal(serverAddressValue);
          return mockSocket;
        })
      );
      helper.load(
        [connection, catchNode, completeNode],
        flow,
        credentials,
        function () {
          const connectionNode = helper.getNode("connection1");
          const helperNode1 = helper.getNode("helper1");
          const helperNode2 = helper.getNode("helper2");
          const helperNode3 = helper.getNode("helper3");
          helperNode1.on("input", function (msg) {
            originalMessageId.should.be.not.equal(null);
            msg.should.have.property("_msgid");
            msg._msgid.should.be.not.equal(originalMessageId);
            msg.should.have.property("payload", message);
            resolve();
          });
          helperNode2.on("input", function (msg) {
            reject(
              new Error(
                "error has been issued in the flow: " + msg.error.message
              )
            );
          });
          helperNode3.on("input", function (msg) {
            msg.should.have.property("_msgid");
            msg._msgid.should.be.not.equal(originalMessageId);
            msg.should.have.property("payload", message);
            originalMessageId = msg._msgid;
          });
          connectionNode.receive({ payload: message });
        }
      );
    });
  });

  it("should finalize pending message on socket's close event", function () {
    return new Promise(function (resolve, reject) {
      const nameValue = "Connection";
      const serverAddressValue = "192.168.0.1";
      const serverPortValue = "1234";
      const encryptionKeyValue = "09876";
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "connection1",
          z: "f1",
          type: "satel-integra-connection",
          name: nameValue,
          server_address: serverAddressValue,
          server_port: serverPortValue,
          encryption: false,
          max_message_queue_size: "1",
          wires: [["helper1"]],
        },
        { id: "helper1", z: "f1", type: "helper" },
        { id: "helper2", z: "f1", type: "helper" },
        { id: "helper3", z: "f1", type: "helper" },
        { id: "catch1", z: "f1", type: "catch", wires: [["helper2"]] },
        {
          id: "complete1",
          z: "f1",
          type: "complete",
          scope: ["connection1"],
          wires: [["helper3"]],
        },
      ];
      const credentials = {
        connection1: { encryption_key: encryptionKeyValue },
      };
      const message = Buffer.from([0x01, 0x02, 0x03]);
      const mockSocket = createMockSocket(function (buffer) {
        mockSocket.should.have.property("close_callback");
        setImmediate(mockSocket.close_callback.bind(null));
      });
      sinon.replace(
        net,
        "createConnection",
        sinon.fake(function (port, address) {
          port.should.be.equal(parseInt(serverPortValue, 10));
          address.should.be.equal(serverAddressValue);
          return mockSocket;
        })
      );
      helper.load(
        [connection, catchNode, completeNode],
        flow,
        credentials,
        function () {
          const connectionNode = helper.getNode("connection1");
          const helperNode1 = helper.getNode("helper1");
          const helperNode2 = helper.getNode("helper2");
          const helperNode3 = helper.getNode("helper3");
          helperNode1.on("input", function (msg) {
            reject(new Error("no message should have been received"));
          });
          helperNode2.on("input", function (msg) {
            reject(
              new Error(
                "error has been issued in the flow: " + msg.error.message
              )
            );
          });
          helperNode3.on("input", function (msg) {
            msg.should.have.property("payload", message);
            resolve();
          });
          connectionNode.receive({ payload: message });
        }
      );
    });
  });

  it("should discard old pending 'new_data' command on receiving a new one", function () {
    return new Promise(function (resolve, reject) {
      const nameValue = "Connection";
      const serverAddressValue = "192.168.0.1";
      const serverPortValue = "1234";
      const encryptionKeyValue = "09876";
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "connection1",
          z: "f1",
          type: "satel-integra-connection",
          name: nameValue,
          server_address: serverAddressValue,
          server_port: serverPortValue,
          encryption: false,
          max_message_queue_size: "1",
          wires: [["helper1"]],
        },
        { id: "helper1", z: "f1", type: "helper" },
        { id: "helper2", z: "f1", type: "helper" },
        { id: "helper3", z: "f1", type: "helper" },
        { id: "catch1", z: "f1", type: "catch", wires: [["helper2"]] },
        {
          id: "complete1",
          z: "f1",
          type: "complete",
          scope: ["connection1"],
          wires: [["helper3"]],
        },
      ];
      const credentials = {
        connection1: { encryption_key: encryptionKeyValue },
      };
      const message1 = Buffer.from([0x01, 0x02, 0x03]);
      const message2 = message1.map(function (value) {
        return value + 1;
      });
      let doneMessages = 0;
      const mockSocket = createMockSocket(function (buffer) {
        mockSocket.data_callback(buffer);
      });
      sinon.replace(
        net,
        "createConnection",
        sinon.fake(function (port, address) {
          port.should.be.equal(parseInt(serverPortValue, 10));
          address.should.be.equal(serverAddressValue);
          return mockSocket;
        })
      );
      helper.load(
        [connection, catchNode, completeNode],
        flow,
        credentials,
        function () {
          const connectionNode = helper.getNode("connection1");
          const helperNode1 = helper.getNode("helper1");
          const helperNode2 = helper.getNode("helper2");
          const helperNode3 = helper.getNode("helper3");
          helperNode1.on("input", function (msg) {
            msg.should.have.property("topic", "new_data");
            msg.should.have.property("payload", message2);
            resolve();
          });
          helperNode2.on("input", function (msg) {
            reject(
              new Error(
                "error has been issued in the flow: " + msg.error.message
              )
            );
          });
          helperNode3.on("input", function (msg) {
            ++doneMessages;
            msg.should.have.property("topic", "new_data");
            if (doneMessages == 1) {
              msg.should.have.property("payload", message1);
            } else {
              msg.should.have.property("payload", message2);
            }
          });
          connectionNode.receive({ topic: "new_data", payload: message1 });
          connectionNode.receive({ topic: "new_data", payload: message2 });
        }
      );
    });
  });

  it("should encrypt and decrypt message in encrypted mode", function () {
    return new Promise(function (resolve, reject) {
      const nameValue = "Connection";
      const serverAddressValue = "192.168.0.1";
      const serverPortValue = "1234";
      const encryptionKeyValue = "09876";
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "connection1",
          z: "f1",
          type: "satel-integra-connection",
          name: nameValue,
          server_address: serverAddressValue,
          server_port: serverPortValue,
          encryption: true,
          wires: [["helper1"]],
        },
        { id: "helper1", z: "f1", type: "helper" },
        { id: "helper2", z: "f1", type: "helper" },
        { id: "helper3", z: "f1", type: "helper" },
        { id: "catch1", z: "f1", type: "catch", wires: [["helper2"]] },
        {
          id: "complete1",
          z: "f1",
          type: "complete",
          scope: ["connection1"],
          wires: [["helper3"]],
        },
      ];
      const credentials = {
        connection1: { encryption_key: encryptionKeyValue },
      };
      const message = Buffer.alloc(20, 0x42);
      const answerIdSValue = 0xaa;
      sinon.replace(
        net,
        "createConnection",
        sinon.fake(function (port, address) {
          port.should.be.equal(parseInt(serverPortValue, 10));
          address.should.be.equal(serverAddressValue);
          return mockSocket;
        })
      );
      const encrypt_spy = sinon.replace(
        impl,
        "encrypt",
        sinon.fake(function (frame, cipherKey) {
          cipherKey.should.deepEqual("09876       09876       ");
          return frame;
        })
      );
      const decrypt_spy = sinon.replace(
        impl,
        "decrypt",
        sinon.fake(function (frame, cipherKey) {
          cipherKey.should.deepEqual("09876       09876       ");
          return frame;
        })
      );
      let connectionNode = null;
      const mockSocket = createMockSocket(function (buffer) {
        try {
          encrypt_spy.calledOnce.should.be.equal(true);
          buffer.length.should.be.equal(message.length + 7);
          buffer[0].should.be.equal(message.length + 6);
          buffer[3].should.be.equal(((connectionNode.counter - 1) >> 8) & 0xff);
          buffer[4].should.be.equal((connectionNode.counter - 1) & 0xff);
          buffer[5].should.be.equal(connectionNode.idS);
          buffer[6].should.be.equal(connectionNode.idR);
          buffer.subarray(7).should.be.deepEqual(message);
          buffer[6] = buffer[5];
          buffer[5] = answerIdSValue;
          setImmediate(mockSocket.data_callback.bind(null, buffer));
        } catch (error) {
          reject(error);
        }
      });
      helper.load(
        [connection, catchNode, completeNode],
        flow,
        credentials,
        function () {
          connectionNode = helper.getNode("connection1");
          const helperNode1 = helper.getNode("helper1");
          const helperNode2 = helper.getNode("helper2");
          helperNode1.on("input", function (msg) {
            try {
              decrypt_spy.calledOnce.should.be.equal(true);
              msg.should.have.property("payload", message);
              connectionNode.idR.should.be.equal(answerIdSValue);
              resolve();
            } catch (error) {
              reject(error);
            }
          });
          helperNode2.on("input", function (msg) {
            reject(
              new Error(
                "error has been issued in the flow: " + msg.error.message
              )
            );
          });
          connectionNode.receive({ payload: message });
        }
      );
    });
  });

  it("should add footer to short message in encrypted mode", function () {
    return new Promise(function (resolve, reject) {
      const nameValue = "Connection";
      const serverAddressValue = "192.168.0.1";
      const serverPortValue = "1234";
      const encryptionKeyValue = "09876";
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "connection1",
          z: "f1",
          type: "satel-integra-connection",
          name: nameValue,
          server_address: serverAddressValue,
          server_port: serverPortValue,
          encryption: true,
          wires: [["helper1"]],
        },
        { id: "helper1", z: "f1", type: "helper" },
        { id: "helper2", z: "f1", type: "helper" },
        { id: "helper3", z: "f1", type: "helper" },
        { id: "catch1", z: "f1", type: "catch", wires: [["helper2"]] },
        {
          id: "complete1",
          z: "f1",
          type: "complete",
          scope: ["connection1"],
          wires: [["helper3"]],
        },
      ];
      const credentials = {
        connection1: { encryption_key: encryptionKeyValue },
      };
      const message = Buffer.alloc(4, 0x42);
      sinon.replace(
        net,
        "createConnection",
        sinon.fake(function (port, address) {
          port.should.be.equal(parseInt(serverPortValue, 10));
          address.should.be.equal(serverAddressValue);
          return mockSocket;
        })
      );
      sinon.replace(
        impl,
        "encrypt",
        sinon.fake(function (frame, cipherKey) {
          cipherKey.should.deepEqual("09876       09876       ");
          return frame;
        })
      );
      sinon.replace(
        impl,
        "decrypt",
        sinon.fake(function (frame, cipherKey) {
          cipherKey.should.deepEqual("09876       09876       ");
          return frame;
        })
      );
      const mockSocket = createMockSocket(function (buffer) {
        try {
          buffer.length.should.be.equal(17);
          buffer[0].should.be.equal(16);
          buffer
            .subarray(7)
            .should.be.deepEqual(
              Buffer.concat([message, Buffer.alloc(16 - message.length - 6, 0)])
            );
          buffer[6] = buffer[5];
          setImmediate(mockSocket.data_callback.bind(null, buffer));
        } catch (error) {
          reject(error);
        }
      });
      helper.load(
        [connection, catchNode, completeNode],
        flow,
        credentials,
        function () {
          connectionNode = helper.getNode("connection1");
          const helperNode1 = helper.getNode("helper1");
          const helperNode2 = helper.getNode("helper2");
          helperNode1.on("input", function (msg) {
            try {
              msg.should.have.property(
                "payload",
                Buffer.concat([
                  message,
                  Buffer.alloc(16 - message.length - 6, 0),
                ])
              );
              resolve();
            } catch (error) {
              reject(error);
            }
          });
          helperNode2.on("input", function (msg) {
            reject(
              new Error(
                "error has been issued in the flow: " + msg.error.message
              )
            );
          });
          connectionNode.receive({ payload: message });
        }
      );
    });
  });

  it("should disconnect on frame with invalid idS", function () {
    this.timeout(3000);
    return new Promise(function (resolve, reject) {
      const nameValue = "Connection";
      const serverAddressValue = "192.168.0.1";
      const serverPortValue = "1234";
      const encryptionKeyValue = "09876";
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "connection1",
          z: "f1",
          type: "satel-integra-connection",
          name: nameValue,
          server_address: serverAddressValue,
          server_port: serverPortValue,
          encryption: true,
          wires: [["helper1"]],
        },
        { id: "helper1", z: "f1", type: "helper" },
        { id: "helper2", z: "f1", type: "helper" },
        { id: "helper3", z: "f1", type: "helper" },
        { id: "catch1", z: "f1", type: "catch", wires: [["helper2"]] },
        {
          id: "complete1",
          z: "f1",
          type: "complete",
          scope: ["connection1"],
          wires: [["helper3"]],
        },
      ];
      const credentials = {
        connection1: { encryption_key: encryptionKeyValue },
      };
      const message = Buffer.alloc(4, 0x42);
      sinon.replace(
        net,
        "createConnection",
        sinon.fake(function (port, address) {
          port.should.be.equal(parseInt(serverPortValue, 10));
          address.should.be.equal(serverAddressValue);
          return mockSocket;
        })
      );
      sinon.replace(
        impl,
        "encrypt",
        sinon.fake(function (frame, cipherKey) {
          cipherKey.should.deepEqual("09876       09876       ");
          return frame;
        })
      );
      sinon.replace(
        impl,
        "decrypt",
        sinon.fake(function (frame, cipherKey) {
          cipherKey.should.deepEqual("09876       09876       ");
          return frame;
        })
      );
      const mockSocket = createMockSocket(function (buffer) {
        try {
          buffer[6] = buffer[5] + 1;
          setImmediate(mockSocket.data_callback.bind(null, buffer));
        } catch (error) {
          reject(error);
        }
      });
      helper.load(
        [connection, catchNode, completeNode],
        flow,
        credentials,
        function () {
          connectionNode = helper.getNode("connection1");
          const helperNode1 = helper.getNode("helper1");
          const helperNode2 = helper.getNode("helper2");
          const helperNode3 = helper.getNode("helper3");
          helperNode1.on("input", function (msg) {
            reject(new Error("no message should have been received"));
          });
          helperNode2.on("input", function (msg) {
            reject(
              new Error(
                "error has been issued in the flow: " + msg.error.message
              )
            );
          });
          helperNode3.on("input", function (msg) {
            try {
              connectionNode.should.have.property("connected", false);
              resolve();
            } catch (error) {
              reject(error);
            }
          });
          connectionNode.receive({ payload: message });
        }
      );
    });
  });

  it("should discard frame with malformed length", function () {
    this.timeout(3000);
    return new Promise(function (resolve, reject) {
      const nameValue = "Connection";
      const serverAddressValue = "192.168.0.1";
      const serverPortValue = "1234";
      const encryptionKeyValue = "09876";
      const flow = [
        { id: "f1", type: "tab", label: "Test flow" },
        {
          id: "connection1",
          z: "f1",
          type: "satel-integra-connection",
          name: nameValue,
          server_address: serverAddressValue,
          server_port: serverPortValue,
          encryption: true,
          wires: [["helper1"]],
        },
        { id: "helper1", z: "f1", type: "helper" },
        { id: "helper2", z: "f1", type: "helper" },
        { id: "helper3", z: "f1", type: "helper" },
        { id: "catch1", z: "f1", type: "catch", wires: [["helper2"]] },
        {
          id: "complete1",
          z: "f1",
          type: "complete",
          scope: ["connection1"],
          wires: [["helper3"]],
        },
      ];
      const credentials = {
        connection1: { encryption_key: encryptionKeyValue },
      };
      const message = Buffer.alloc(4, 0x42);
      sinon.replace(
        net,
        "createConnection",
        sinon.fake(function (port, address) {
          port.should.be.equal(parseInt(serverPortValue, 10));
          address.should.be.equal(serverAddressValue);
          return mockSocket;
        })
      );
      sinon.replace(
        impl,
        "encrypt",
        sinon.fake(function (frame, cipherKey) {
          cipherKey.should.deepEqual("09876       09876       ");
          return frame;
        })
      );
      sinon.replace(
        impl,
        "decrypt",
        sinon.fake(function (frame, cipherKey) {
          cipherKey.should.deepEqual("09876       09876       ");
          return frame;
        })
      );
      const mockSocket = createMockSocket(function (buffer) {
        try {
          buffer[0] = buffer[0] + 1;
          buffer[6] = buffer[5];
          setImmediate(mockSocket.data_callback.bind(null, buffer));
        } catch (error) {
          reject(error);
        }
      });
      helper.load(
        [connection, catchNode, completeNode],
        flow,
        credentials,
        function () {
          connectionNode = helper.getNode("connection1");
          const helperNode1 = helper.getNode("helper1");
          const helperNode2 = helper.getNode("helper2");
          const helperNode3 = helper.getNode("helper3");
          helperNode1.on("input", function (msg) {
            reject(new Error("no message should have been received"));
          });
          helperNode2.on("input", function (msg) {
            reject(
              new Error(
                "error has been issued in the flow: " + msg.error.message
              )
            );
          });
          helperNode3.on("input", function (msg) {
            resolve();
          });
          connectionNode.receive({ payload: message });
        }
      );
    });
  });
});
