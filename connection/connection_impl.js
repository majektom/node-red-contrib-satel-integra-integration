const crypto = require("crypto");

function decrypt(frame, cipherKey) {
  let count = frame.length;
  let cv = crypto
    .createCipheriv("aes-192-ecb", cipherKey, null)
    .setAutoPadding(false)
    .update(Buffer.alloc(16, 0));
  while (count >= 16) {
    const index = frame.length - count;
    const subFrame = frame.subarray(index, 16);
    const encryptedSubFrame = Buffer.from(subFrame);
    crypto
      .createDecipheriv("aes-192-ecb", cipherKey, null)
      .setAutoPadding(false)
      .update(subFrame)
      .copy(subFrame);
    for (i = 0; i < 16; ++i) {
      subFrame[i] ^= cv[i];
    }
    cv = encryptedSubFrame;
    count -= 16;
  }
  cv = crypto
    .createCipheriv("aes-192-ecb", cipherKey, null)
    .setAutoPadding(false)
    .update(cv);
  for (i = 0, index = frame.length - count; i < count; ++i, ++index) {
    frame[index] ^= cv[i];
  }
}

function encrypt(frame, cipherKey) {
  let count = frame.length;
  let cv = crypto
    .createCipheriv("aes-192-ecb", cipherKey, null)
    .setAutoPadding(false)
    .update(Buffer.alloc(16, 0));
  while (count >= 16) {
    const index = frame.length - count;
    const subFrame = frame.subarray(index, 16);
    for (i = 0; i < 16; ++i) {
      subFrame[i] ^= cv[i];
    }
    crypto
      .createCipheriv("aes-192-ecb", cipherKey, null)
      .setAutoPadding(false)
      .update(subFrame)
      .copy(subFrame);
    cv = subFrame;
    count -= 16;
  }
  cv = crypto
    .createCipheriv("aes-192-ecb", cipherKey, null)
    .setAutoPadding(false)
    .update(cv);
  for (i = 0, index = frame.length - count; i < count; ++i, ++index) {
    frame[index] ^= cv[i];
  }
}

function getCipherKey(key) {
  if (key.length > 12) {
    throw new Error(
      "Encryption key is too long. Must be <= 12 characters, is " +
        key.length +
        "."
    );
  }
  const paddedKey = key.padEnd(12);
  return paddedKey + paddedKey;
}

module.exports = {
  decrypt,
  encrypt,
  getCipherKey,
};
