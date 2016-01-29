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
    it('should set default options if no options are given', () => {
      const handler = new Handler();
      expect(handler.options).to.deep.equal({
        operationKey: 'operation',
        payloadKey: 'payload'
      });
    });
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

  describe('#resolveEndpoint()', () => {
    function checkOperationRequired(e) {
      e.should.be.instanceof(TypeError);
      e.message.should.equal('operation is required');
    }
    it('should reject the promise for a undefined operation', () => {
      return new Handler().resolveEndpoint().catch(checkOperationRequired);
    });
    it('should reject the promise for a null operation', () => {
      return new Handler().resolveEndpoint(null).catch(checkOperationRequired);
    });
    it('should resolve the promise with [endpoint, metadata] for valid operation', () => {
      class TestHandler extends Handler {
        @operation
        testOperation() { }
      }
      return new TestHandler().resolveEndpoint('testOperation')
        .then(([endpoint, metadata]) => {
          expect(endpoint).to.be.an.instanceof(Function);
          expect(endpoint).to.have.property('name', 'testOperation');
          expect(metadata).to.be.an.instanceof(Object);
        });
    });
  });

  describe('#handle()', () => {
    function checkEventRequired(e) {
      expect(e).to.be.an.instanceof(TypeError);
      expect(e.message).to.equal('event is required');
    }
    it('should reject the promise for a null event', () => {
      return new Handler().handle(null).catch(checkEventRequired);
    });
    it('should reject the promise for an undefined event', () => {
      return new Handler().handle().catch(checkEventRequired);
    });
    it('should not invoke an endpoint without the @operation decorator', () => {
      class TestHandler extends Handler {
        greet(greeting) { return greeting; }
      }
      const _event = { operation: 'greet', payload: 'Hello' };
      return new TestHandler().handle(_event).catch(e => {
        expect(e).to.be.an.instanceof(Error);
        expect(e.message).to.equal('endpoint metadata not found');
      });
    });
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
    it('should reject the promise for a null endpoint', () => {
      return Handler.getEndpointMetadata(null).catch(e => {
        expect(e).to.be.an.instanceof(TypeError);
        expect(e.message).to.equal('endpoint cannot be null or undefined');
      });
    });
    it('should reject the promise for an undefined endpoint', () => {
      return Handler.getEndpointMetadata(undefined).catch(e => {
        expect(e).to.be.an.instanceof(TypeError);
        expect(e.message).to.equal('endpoint cannot be null or undefined');
      });
    });
    it('should reject the promise for an boolean endpoint', () => {
      return Handler.getEndpointMetadata(false).catch(e => {
        expect(e).to.be.an.instanceof(TypeError);
        expect(e.message).to.equal('invalid endpoint type, cannot be boolean');
      });
    });
    it('should reject the promise for an endpoint with no metadata', () => {
      return Handler.getEndpointMetadata(function() {}).catch(e => {
        expect(e).to.be.an.instanceof(Error);
        expect(e.message).to.equal('endpoint metadata not found');
      });
    });
    it('should reject the promise for an endpoint with non-object metadata', () => {
      const endpoint = Object.assign(function() {}, { '_λ6_metadata': 1 });
      return Handler.getEndpointMetadata(endpoint).catch(e => {
        expect(e).to.be.an.instanceof(Error);
        expect(e.message).to.equal('endpoint metadata not found');
      });
    });
    it('should reject the promise for an endpoint with non-object metadata', () => {
      const endpoint = Object.assign(function() {}, { '_λ6_metadata': { a: 'b' } });
      return Handler.getEndpointMetadata(endpoint).then(e => {
        return expect(e).to.be.an('object').with.property('a', 'b');
      });
    });
  });
});
