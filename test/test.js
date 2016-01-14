// Chai
import { should, expect, assert } from 'chai';
should();

// Module to test
import { Handler } from '../src/index';

describe('Handler', () => {

  // Simple proxy for error messages
  const missing = new Proxy({}, {
    get: function(proxy, name) {
      return `${name} is required and must be an object`
    }
  });

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
  describe('#resolveOperation()', () => {
    class TestClass extends Handler {
      name = 'TestClass';
      notOperation = true;
    }
    const h = new TestClass({}, {});

    // Bind to Handler.resolveOperation()
    function resolveOperation(operation) {
      return Handler.resolveOperation.bind(Handler, operation);
    }

    it('should throw exception for null operation', () => {
      const f = TestClass.prototype.resolveOperation.bind(h, null);
      expect(f).to.throw(TypeError, 'operation is required and must be a string');
    });
    it('should throw exception for operation not found', () => {
      const f = h.resolveOperation.bind(h, 'notFound');
      expect(f).to.throw(Error, 'handler "notFound" not found');
    });
    it('should throw exception for operation not a function', () => {
      const f = h.resolveOperation.bind(h, 'notOperation');
      expect(f).to.throw(TypeError, 'handler "notOperation" must be a function');
    });
  });
});
