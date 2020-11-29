const assert = require("assert");
const impl = require("./encoder_impl.js");
const sinon = require("sinon");

describe("satel-integra-encoder Node unit test", function () {
  it("encodeOutputsChangeCommand() should prioritize prefixAndUserCode param over message's prefixAndUserCode field", function () {
    let callback = sinon.fake();
    const msg = {
      outputs: [true, false],
      prefixAndUserCode: "code_in_message",
    };
    const prefixAndUserCode = "code";
    impl.encodeOutputsChangeCommand(msg, callback, prefixAndUserCode);
    assert(callback.calledOnce);
    const call = callback.getCall(0);
    assert.strictEqual(call.args.length, 2);
    assert.strictEqual(call.args[0], prefixAndUserCode);
    assert.strictEqual(call.args[1], msg.outputs);
  });

  it("encodeOutputsChangeCommand() should use message's prefixAndUserCode field if prefixAndUserCode param is missing", function () {
    let callback = sinon.fake();
    const msg = {
      outputs: [true, false],
      prefixAndUserCode: "code_in_message",
    };
    impl.encodeOutputsChangeCommand(msg, callback);
    assert(callback.calledOnce);
    const call = callback.getCall(0);
    assert.strictEqual(call.args.length, 2);
    assert.strictEqual(call.args[0], msg.prefixAndUserCode);
    assert.strictEqual(call.args[1], msg.outputs);
  });

  it("encodeOutputsChangeCommand() should re-throw encode function exception", function () {
    const errorMessage = "error message";
    let callback = sinon.fake.throws(errorMessage);
    const msg = { topic: "my_command" };
    assert.throws(
      function () {
        impl.encodeOutputsChangeCommand(msg, callback);
      },
      function (error) {
        return (
          error.search(new RegExp(errorMessage)) != -1 &&
          error.search(new RegExp(msg.topic)) != -1
        );
      }
    );
    assert(callback.calledOnce);
    const call = callback.getCall(0);
    assert.strictEqual(call.args.length, 2);
    assert.strictEqual(call.args[0], undefined);
    assert.strictEqual(call.args[1], undefined);
  });

  it("getPrefixAndUserCode()", function () {
    assert.strictEqual(impl.getPrefixAndUserCode(null, null), undefined);
    assert.strictEqual(
      impl.getPrefixAndUserCode({ no_credentials: { code: "4321" } }, null),
      undefined
    );
    assert.strictEqual(
      impl.getPrefixAndUserCode({ credentials: { no_code: "4321" } }, null),
      undefined
    );
    assert.strictEqual(
      impl.getPrefixAndUserCode({ credentials: { code: "4321" } }, null),
      "4321ffffffffffff"
    );
    assert.strictEqual(
      impl.getPrefixAndUserCode(
        { credentials: { code: "4321" } },
        { no_credentials: { prefix: "1234" } }
      ),
      "4321ffffffffffff"
    );
    assert.strictEqual(
      impl.getPrefixAndUserCode(
        { credentials: { code: "4321" } },
        { credentials: { no_prefix: "1234" } }
      ),
      "4321ffffffffffff"
    );
    assert.strictEqual(
      impl.getPrefixAndUserCode(
        { credentials: { code: "4321" } },
        { credentials: { prefix: "1234" } }
      ),
      "12344321ffffffff"
    );
    assert.strictEqual(
      impl.getPrefixAndUserCode(
        { credentials: { code: "87654321" } },
        { credentials: { prefix: "12345678" } }
      ),
      "1234567887654321"
    );
    assert.strictEqual(
      impl.getPrefixAndUserCode(null, { credentials: { prefix: "12345678" } }),
      undefined
    );
  });
});
