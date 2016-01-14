// Chai
import { should, expect, assert } from 'chai';
should();

// Module to test
import { Handler } from '../src/index';

describe('Handler', () => {

  // Error messages for missing arguments
  const missing = {
    event: 'event is required and must be an object',
    context: 'context is required and must be an object'
  };

  // A test handler
  class TestClass extends Handler {
    notOperation = true;
    validOperation(payload) {
      this.context.succeed(true);
    }
  }

  // Instance of TestClass
  const h = new TestClass({}, {});

  describe('constructor', () => {

    // Bind to Handler.constructor()
    function constructor(event, context) {
      return () => {
        return new Handler(event, context);
      }
    }

    // TODO: Create shared behaviors
    it('should throw exception for null event', () => {
      constructor(null, null).should.throw(TypeError, missing.event);
    });
    it('should throw exception for undefined event', () => {
      constructor(undefined, null).should.throw(TypeError, missing.event);
    });
    it('should throw exception for non-object event', () => {
      constructor(1, null).should.throw(TypeError, missing.event);
    });
    it('should throw exception for null context', () => {
      constructor({}, null).should.throw(TypeError, missing.context);
    });
    it('should throw exception for undefined context', () => {
      constructor({}, undefined).should.throw(TypeError, missing.context);
    });
    it('should throw exception for non-object event', () => {
      constructor({}, 1).should.throw(TypeError, missing.context);
    });
  });
  describe('.event', () => {
    it('should be read-only', () => {
      expect(() => new Handler({}, {}).event = {}).to.throw(TypeError);
    });
  });
  describe('.context', () => {
    it('should be read-only', () => {
      expect(() => new Handler({}, {}).context = {}).to.throw(TypeError);
    });
  });
  describe('.handle()', () => {

    // Bind to Handler.handle()
    function handle(event, context) {
      return Handler.handle.bind(Handler, event, context);
    }

    // TODO: Create shared behaviors
    it('should throw exception for invalid "this" value', () => {
      Handler.handle.bind(1, {}, {})
      .should.throw(Error, 'handle() called with invalid "this" value');
    });
    it('should throw exception for null event', () => {
      handle(null, null).should.throw(TypeError, missing.event);
    });
    it('should throw exception for undefined event', () => {
      handle(undefined, null).should.throw(TypeError, missing.event);
    });
    it('should throw exception for non-object event', () => {
      handle(1, null).should.throw(TypeError, missing.event);
    });
    it('should throw exception for null context', () => {
      handle({}, null).should.throw(TypeError, missing.context);
    });
    it('should throw exception for undefined context', () => {
      handle({}, undefined).should.throw(TypeError, missing.context);
    });
    it('should throw exception for non-object event', () => {
      handle({}, 1).should.throw(TypeError, missing.context);
    });
  });
  describe('#dispatch()', () => {

    // Bind to Handler.prototype.dispatch()
    function dispatch(payload) {
      return Handler.prototype.dispatch.bind(h, payload);
    }

    it('should throw exception for invalid "this" value', () => {
      Handler.prototype.dispatch.bind(1, 'operation').should.throw(
        Error, 'dispatch() called with invalid "this" value');
    });
    it('should throw exception for null payload', () => {
      dispatch('validOperation', null).should.throw(
        TypeError, 'payload is required and must be an object');
    });
    it('should throw exception for undefined payload', () => {
      dispatch('validOperation', undefined).should.throw(
        TypeError, 'payload is required and must be an object');
    });
    it('should throw exception for non-object this.event value', () => {
      const _this = {
        resolveOperation: h.resolveOperation,
        validOperation: function(payoload) {
          // no-op
        }
      };
      Handler.prototype.dispatch.bind(_this, 'validOperation', {}).should.throw(
        Error, 'this.event is missing or is not an object');
    });
  });
  describe('#resolveOperation()', () => {

    // Bind to Handler.prototype.resolveOperation()
    function resolveOperation(operation) {
      return Handler.prototype.resolveOperation.bind(h, operation);
    }

    it('should throw exception for invalid "this" value', () => {
      Handler.prototype.resolveOperation.bind(null, 'operation').should.throw(
        Error, 'resolveOperation() called with invalid "this" value');
    });
    it('should throw exception for null operation', () => {
      resolveOperation(null).should.throw(
        TypeError, 'operation is required and must be a string');
    });
    it('should throw exception for operation not found', () => {
      resolveOperation('notFound').should.throw(
        Error, 'handler "notFound" not found');
    });
    it('should throw exception for operation not a function', () => {
      resolveOperation('notOperation').should.throw(
        TypeError, 'handler "notOperation" must be a function');
    });
    it('should return a function for a valid operation name', () => {
      expect(h.resolveOperation('validOperation')).to.be.a('function');
    });
  });
});
