/*eslint-disable no-unused-expressions */

// Chai
import { should, expect } from 'chai';
should();

// Sinon
import sinon from 'sinon';

// Module to test
import { Handler, operation } from '../src';

describe('Handler', () => {

  describe('constructor', () => {
    /** @test {Handler.constructor} */
    it('should set default options if no options are given', () => {
      const handler = new Handler();
      expect(handler.options).to.deep.equal({
        operationKey: 'operation',
        payloadKey: 'payload'
      });
    });
    /** @test {Handler.constructor} */
    it('should set new options if an options hash is passed in', () => {
      const handler = new Handler({
        operationKey: 'type',
        otherOption: 'otherOptionValue'
      });
      expect(handler.options).to.deep.equal({
        operationKey: 'type',
        payloadKey: 'payload',
        otherOption: 'otherOptionValue'
      });
    });
  });

  describe('#createInvocationContext()', () => {
    class TestHandler extends Handler {
      @operation
      otherOperation() { return 'success'; }
    }
    /** @test {Handler#createInvocationContext} */
    it('should throw a TypeError exception for a non-object', () => {
      const handler = new TestHandler();
      handler.createInvocationContext.bind(handler).should.not.throw;
      handler.createInvocationContext.bind(handler, null).should.not.throw;
      handler.createInvocationContext.bind(handler, {}).should.not.throw;
      handler.createInvocationContext.bind(handler, 1).should.throw(TypeError, 'thisArgs must be an object');
    });
    describe('options.deepCopy = falsey', () => {
      /** @test {Handler#createInvocationContext} */
      it('should create a new "this" context additional properties', () => {
        const handler = new TestHandler({ operationKey: 'MethodName' });
        const thisArgs = {
          event: { MethodName: 'createUser' },
          context: {
            awsRequestId: 'requestId',
            succeed: function() {
              return 'succeeded';
            }
          },
          operation: 'createUser',
          metadata: { key1: 'val1' }
        };
        const ictx = handler.createInvocationContext(thisArgs);
        // New context should have access to Handler#options
        ictx.options.operationKey.should.equal('MethodName');
        // New context should have access to other handler methods
        ictx.otherOperation.should.be.a.function;
        ictx.otherOperation().should.equal('success');
        // New context should have this.{event,context,operation,metatdata}
        expect(ictx.event).to.deep.equal(thisArgs.event);
        expect(ictx.operation).to.equal(thisArgs.operation);
        expect(ictx.metadata).to.deep.equal(thisArgs.metadata);
        // New context should be able to call this.context.succeed()
        expect(ictx.context.succeed()).to.equal('succeeded');
        // Writing the event should throw a TypeError
        expect(() => ictx.event = 'newValue').to.throw(TypeError);
        // Writing to a property of the event should not throw
        ictx.event.MethodName = 'newValue';
      });
    });
    describe('options.deepCopy = truthy', () => {
      /** @test {Handler#createInvocationContext} */
      it('should create a new "this" context with additional properties that are deeply read-only', () => {
        const handler = new TestHandler({ operationKey: 'MethodName', deepCopy: true });
        const thisArgs = {
          event: { MethodName: 'createUser' },
          context: {
            awsRequestId: 'requestId',
            objValue: {
              email: 'user@example.com'
            },
            nullValue: null,
            numberValue: 3,
            undefinedValue: undefined,
            succeed: function() {
              return 'succeeded';
            }
          },
          operation: 'createUser',
          metadata: { key1: 'val1' }
        };
        const ictx = handler.createInvocationContext(thisArgs);
        // New context should have access to Handler#options
        ictx.options.operationKey.should.equal('MethodName');
        // New context should have access to other handler methods
        ictx.otherOperation.should.be.a.function;
        ictx.otherOperation().should.equal('success');
        // New context should have this.{event,context,operation,metatdata}
        expect(ictx.event).to.deep.equal(thisArgs.event);
        expect(ictx.operation).to.equal(thisArgs.operation);
        expect(ictx.metadata).to.deep.equal(thisArgs.metadata);
        // New context should be able to call this.context.succeed()
        expect(ictx.context.succeed()).to.equal('succeeded');
        // Writing to the event should throw a TypeError
        expect(() => ictx.event.MethodName = 'newValue').to.throw(TypeError);
      });
    });
  });

  describe('#resolveEndpoint()', () => {
    /** @test {Handler#resolveEndpoint} */
    it('should throw an exception for a undefined operation', () => {
      const h = new Handler();
      h.resolveEndpoint.bind(h).should.throw(TypeError, 'invalid type for operation, cannot be undefined');
    });
    /** @test {Handler#resolveEndpoint} */
    it('should throw an exception for a null operation', () => {
      const h = new Handler();
      h.resolveEndpoint.bind(h, null).should.throw(TypeError, 'invalid type for operation, cannot be null');
    });
    /** @test {Handler#resolveEndpoint} */
    it('should throw an exception for a non-string operation', () => {
      const h = new Handler();
      h.resolveEndpoint.bind(h, 1).should.throw(TypeError, 'invalid type for operation, cannot be number');
    });
    /** @test {Handler#resolveEndpoint} */
    it('should throw an exception for an operation that cannot be found', () => {
      const h = new Handler();
      h.resolveEndpoint.bind(h, 'notThere').should.throw(Error, 'endpoint not found for operation "notThere"');
    });
    /** @test {Handler#resolveEndpoint} */
    it('should throw an exception for an operation that cannot be found (missing metadata)', () => {
      class TestHandler extends Handler {
        testOperation() { }
      }
      const h = new TestHandler();
      h.resolveEndpoint.bind(h, 'testOperation').should.throw(Error, 'endpoint not found for operation "testOperation"');
    });
    /** @test {Handler#resolveEndpoint} */
    it('should throw an exception for an operation that cannot be found (invalid metadata)', () => {
      class TestHandler extends Handler {
        testOperation() { }
      }
      // Add invalid metadata
      TestHandler.prototype.testOperation[Handler.metadataKey] = 1;
      const h = new TestHandler();
      h.resolveEndpoint.bind(h, 'testOperation').should.throw(Error, 'endpoint not found for operation "testOperation"');
    });
    /** @test {Handler#resolveEndpoint} */
    it('should return [endpoint, metadata] for valid operation', () => {
      class TestHandler extends Handler {
        @operation
        testOperation() { }
      }
      const [endpoint, metadata] = new TestHandler().resolveEndpoint('testOperation');
      expect(endpoint).to.be.an.instanceof(Function);
      expect(endpoint).to.have.property('name', 'testOperation');
      expect(metadata).to.be.an.instanceof(Object);
    });
  });

  describe('#handle()', () => {
    function checkEventRequired(e) {
      expect(e).to.be.an.instanceof(TypeError);
      expect(e.message).to.equal('event is required');
    }
    /** @test {Handler#handle} */
    it('should reject the promise for a null event', () => {
      return new Handler().handle(null).catch(checkEventRequired);
    });
    /** @test {Handler#handle} */
    it('should reject the promise for an undefined event', () => {
      return new Handler().handle().catch(checkEventRequired);
    });
    /** @test {Handler#handle} */
    it('should not invoke an endpoint without the @operation decorator', () => {
      class TestHandler extends Handler {
        greet(greeting) { return greeting; }
      }
      const _event = { operation: 'greet', payload: 'Hello' };
      return new TestHandler().handle(_event).catch(e => {
        expect(e).to.be.an.instanceof(Error);
        expect(e.message).to.equal('endpoint not found for operation "greet"');
      });
    });
    /** @test {Handler#handle} */
    it('should invoke the endpoint with correct "this" value', () => {
      class TestHandler extends Handler {
        @operation
        greet(greeting, arg1) {
          return `${this.operation}: ${greeting}, ${arg1}`;
        }
      }
      const _event = { operation: 'greet', payload: 'Hello' };
      return new TestHandler().handle(_event, null, 'Matt').then(res => {
        expect(res).to.equal('greet: Hello, Matt');
      });
    });
    /** @test {Handler#handle} */
    it('should invoke the endpoint, succeed and call context#succeed() if present', () => {
      const context = { succeed: function() { } };
      class TestHandler extends Handler {
        @operation
        test() { return true; }
      }
      const spy = sinon.spy(context, 'succeed');
      const _event = { operation: 'test' };
      return new TestHandler().handle(_event, context).then(r => {
        expect(r).to.be.true;
        expect(spy.calledOnce).to.be.true;
        expect(spy.calledWithExactly(true)).to.be.true;
      });
    });
    /** @test {Handler#handle} */
    it('should invoke the endpoint, fail and call context#fail() if present', () => {
      const context = { fail: function() { } };
      class TestHandler extends Handler {
        @operation
        test() { throw new Error('test error'); }
      }
      const spy = sinon.spy(context, 'fail');
      const _event = { operation: 'test' };
      return new TestHandler().handle(_event, context).catch(e => {
        expect(e).to.be.an.instanceof(Error);
        expect(e.message).to.equal('test error');
        expect(spy.calledWithExactly(e)).to.be.true;
      });
    });
  });

  describe('.getEndpointMetadata', () => {
    function getEndpointMetadata(...args) {
      return Handler.getEndpointMetadata.bind(Handler, ...args);
    }
    /** @test {Handler.getEndpointMetadata} */
    it('should throw an exception for a null endpoint', () => {
      getEndpointMetadata(null).should.throw(TypeError, 'invalid type for endpoint, cannot be null');
    });
    /** @test {Handler.getEndpointMetadata} */
    it('should throw an exception for an undefined endpoint', () => {
      getEndpointMetadata().should.throw(TypeError, 'invalid type for endpoint, cannot be undefined');
    });
    /** @test {Handler.getEndpointMetadata} */
    it('should throw an exception for a non-object endpoint', () => {
      getEndpointMetadata(false).should.throw(TypeError, 'invalid type for endpoint, cannot be boolean');
    });
    /** @test {Handler.getEndpointMetadata} */
    it('should return undefined for an endpoint with no metadata', () => {
      expect(getEndpointMetadata(function(){})()).to.be.undefined;
    });
    /** @test {Handler.getEndpointMetadata} */
    it('should throw an exception for an endpoint with non-object metadata', () => {
      const endpoint = Object.assign(function() {}, { '_λ6_metadata': 1 });
      getEndpointMetadata(endpoint).should.throw(Error, 'invalid type for endpoint metadata, cannot be number');
    });
    /** @test {Handler.getEndpointMetadata} */
    it('should return the metadata for an endpoint without error', () => {
      const endpoint = Object.assign(function() {}, { '_λ6_metadata': { a: 'b' } });
      getEndpointMetadata(endpoint)().should.deep.equal({ a: 'b' });
    });
  });
});
