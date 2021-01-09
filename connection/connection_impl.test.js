const impl = require("./connection_impl.js");

describe("satel-integra-connection Node unit test", function () {
  [
    {
      name: "16 bytes aligned frame",
      frame: Buffer.from([
        0x00,
        0x01,
        0x02,
        0x03,
        0x04,
        0x05,
        0x06,
        0x07,
        0x08,
        0x09,
        0x0a,
        0x0b,
        0x0c,
        0x0d,
        0x0e,
        0x0f,
      ]),
    },
    {
      name: "16 bytes unaligned frame",
      frame: Buffer.from([
        0x00,
        0x01,
        0x02,
        0x03,
        0x04,
        0x05,
        0x06,
        0x07,
        0x08,
        0x09,
        0x0a,
        0x0b,
        0x0c,
        0x0d,
        0x0e,
        0x0f,
        0x10,
        0x11,
      ]),
    },
  ].forEach(function (test) {
    it("encode and decode frame, " + test.name, function () {
      const cipherKey = "secret_key  secret_key  ";
      const frame = Buffer.from(test.frame);
      impl.encrypt(frame, cipherKey);
      frame.should.not.deepEqual(test.frame);
      impl.decrypt(frame, cipherKey);
      frame.should.deepEqual(test.frame);
    });
  });

  it("getCipherKey() should return correct cipher key ", function () {
    impl
      .getCipherKey("secret_key")
      .should.deepEqual("secret_key  secret_key  ");
    impl
      .getCipherKey("secret_key12")
      .should.deepEqual("secret_key12secret_key12");
  });

  it("getCipherKey() should throw if key is longer than 12 characters ", function () {
    impl.getCipherKey
      .bind(null, "secret_key123")
      .should.throw(Error, new RegExp("key is too long"));
  });
});
