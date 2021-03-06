const prefixAndUserCodeLength = 16;

function encodeOutputsChangeCommand(msg, encodeFunction, prefixAndUserCode) {
  try {
    if (!prefixAndUserCode) {
      prefixAndUserCode = msg.prefixAndUserCode;
    }
    msg.payload = encodeFunction(prefixAndUserCode, msg.outputs);
  } catch (error) {
    throw new Error(msg.topic + " command encoding error: " + error);
  }
}

function encodeZonesChangeCommand(msg, encodeFunction, prefixAndUserCode) {
  try {
    msg.payload = encodeFunction(prefixAndUserCode, msg.zones);
  } catch (error) {
    throw new Error(msg.topic + " command encoding error: " + error);
  }
}

function encodePartitionsChangeCommand(msg, encodeFunction, prefixAndUserCode) {
  try {
    msg.payload = encodeFunction(prefixAndUserCode, msg.partitions);
  } catch (error) {
    throw new Error(msg.topic + " command encoding error: " + error);
  }
}

function getPrefixAndUserCode(userNode, prefixNode) {
  let prefixAndUserCode;
  if (userNode && userNode.credentials && userNode.credentials.code) {
    if (prefixNode && prefixNode.credentials && prefixNode.credentials.prefix) {
      prefixAndUserCode =
        prefixNode.credentials.prefix + userNode.credentials.code;
    } else {
      prefixAndUserCode = userNode.credentials.code;
    }
    if (prefixAndUserCode.length < prefixAndUserCodeLength) {
      prefixAndUserCode += "f".repeat(
        prefixAndUserCodeLength - prefixAndUserCode.length
      );
    }
  }
  return prefixAndUserCode;
}

module.exports = {
  encodeOutputsChangeCommand,
  encodePartitionsChangeCommand,
  encodeZonesChangeCommand,
  getPrefixAndUserCode,
};
