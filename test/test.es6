// Chai
import { should, expect, assert } from 'chai';
should();

// Module to test
import { Handler } from '../index';

describe('Handler', () => {
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
});
