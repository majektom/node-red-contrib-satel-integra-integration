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
    callback.calledOnce.should.be.equal(true);
    const call = callback.getCall(0);
    call.args.length.should.be.equal(2);
    call.args[0].should.be.equal(prefixAndUserCode);
    call.args[1].should.be.equal(msg.outputs);
  });

  it("encodeOutputsChangeCommand() should use message's prefixAndUserCode field if prefixAndUserCode param is missing", function () {
    let callback = sinon.fake();
    const msg = {
      outputs: [true, false],
      prefixAndUserCode: "code_in_message",
    };
    impl.encodeOutputsChangeCommand(msg, callback);
    callback.calledOnce.should.be.equal(true);
    const call = callback.getCall(0);
    call.args.length.should.be.equal(2);
    call.args[0].should.be.equal(msg.prefixAndUserCode);
    call.args[1].should.be.equal(msg.outputs);
  });

  it("encodeZonesChangeCommand() should encode valid message", function () {
    let callback = sinon.fake();
    const msg = {
      zones: [true, false],
    };
    const prefixAndUserCode = "code";
    impl.encodeZonesChangeCommand(msg, callback, prefixAndUserCode);
    callback.calledOnce.should.be.equal(true);
    const call = callback.getCall(0);
    call.args.length.should.be.equal(2);
    call.args[0].should.be.equal(prefixAndUserCode);
    call.args[1].should.be.equal(msg.zones);
  });

  const encodeChangeCommandRethrowTests = [
    impl.encodeOutputsChangeCommand,
    impl.encodeZonesChangeCommand,
  ];
  encodeChangeCommandRethrowTests.forEach(function (func) {
    it(func.name + "() should re-throw encode function exception", function () {
      const errorMessage = "error message";
      let callback = sinon.fake.throws(errorMessage);
      const msg = { topic: "my_command" };
      (function () {
        func(msg, callback);
      }.should.throw(Error, function (error) {
        error.message.should.match(new RegExp(errorMessage));
        error.message.should.match(new RegExp(msg.topic));
      }));
      callback.calledOnce.should.be.equal(true);
      const call = callback.getCall(0);
      call.args.length.should.be.equal(2);
      (typeof call.args[0]).should.be.equal("undefined");
      (typeof call.args[1]).should.be.equal("undefined");
    });
  });

  it("getPrefixAndUserCode()", function () {
    (typeof impl.getPrefixAndUserCode(null, null)).should.be.equal("undefined");
    (typeof impl.getPrefixAndUserCode(
      { no_credentials: { code: "4321" } },
      null
    )).should.be.equal("undefined");
    (typeof impl.getPrefixAndUserCode(
      { credentials: { no_code: "4321" } },
      null
    )).should.be.equal("undefined");
    impl
      .getPrefixAndUserCode({ credentials: { code: "4321" } }, null)
      .should.be.equal("4321ffffffffffff");
    impl
      .getPrefixAndUserCode(
        { credentials: { code: "4321" } },
        { no_credentials: { prefix: "1234" } }
      )
      .should.be.equal("4321ffffffffffff");
    impl
      .getPrefixAndUserCode(
        { credentials: { code: "4321" } },
        { credentials: { no_prefix: "1234" } }
      )
      .should.be.equal("4321ffffffffffff");
    impl
      .getPrefixAndUserCode(
        { credentials: { code: "4321" } },
        { credentials: { prefix: "1234" } }
      )
      .should.be.equal("12344321ffffffff");
    impl
      .getPrefixAndUserCode(
        { credentials: { code: "87654321" } },
        { credentials: { prefix: "12345678" } }
      )
      .should.be.equal("1234567887654321");
    (typeof impl.getPrefixAndUserCode(null, {
      credentials: { prefix: "12345678" },
    })).should.be.equal("undefined");
  });
});
