// Chai
import { should, expect, assert } from 'chai';
should();

// Module to test
import { Handler } from '../index';

describe('Handler', () => {
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
    it('should throw exception for null event', () => {
      expect(() => Handler.handle(null, null))
        .to.throw(TypeError, 'event is required and must be an object');
    });
    it('should throw exception for undefined event', () => {
      expect(() => Handler.handle(undefined, null))
        .to.throw(TypeError, 'event is required and must be an object');
    });
    it('should throw exception for non-object event', () => {
      expect(() => Handler.handle(1, null))
        .to.throw(TypeError, 'event is required and must be an object');
    });
    it('should throw exception for null context', () => {
      expect(() => Handler.handle({}, null))
        .to.throw(TypeError, 'context is required and must be an object');
    });
    it('should throw exception for undefined context', () => {
      expect(() => Handler.handle({}, undefined))
        .to.throw(TypeError, 'context is required and must be an object');
    });
    it('should throw exception for non-object event', () => {
      expect(() => Handler.handle({}, 1))
        .to.throw(TypeError, 'context is required and must be an object');
    });
  });
  describe('#resolveOperation()', () => {
    class TestClass extends Handler {
      notOperation = true;
    }
    const h = new TestClass({}, {});
    it('should throw exception for null operation', () => {
      const f = TestClass.prototype.resolveOperation.bind(h, null);
      expect(f).to.throw(TypeError, 'operation is required and must be a string');
    });
    it('should throw exception for operation not found', () => {
      const f = TestClass.prototype.resolveOperation.bind(h, 'notFound');
      expect(f).to.throw(Error, 'handler "notFound" not found');
    });
    it('should throw exception for operation not a function', () => {
      const f = TestClass.prototype.resolveOperation.bind(h, 'notOperation');
      expect(f).to.throw(TypeError, 'handler "notOperation" must be a function');
    });
  });
});
