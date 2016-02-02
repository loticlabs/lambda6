/* eslint-disable no-unused-expressions */
/* edit .eslintrc if you want to change the linting rules */

// Test utils
import { expect } from 'chai';
import sinon from 'sinon';

// Import handler function to test
import { handler } from '../src/index';

// Create unit tests for your handler to respond to different events
describe('handler', () => {
  it('should succeed and return the given payload', () => {
    // Create a payload
    const payload = {
      key1: 'val1',
      key2: 'val2'
    };
    // Mock a context function that checks the `succeed` value.
    class TestContext {
      succeed() { /* no-op */ }
    }
    const context = new TestContext();
    const spy = sinon.spy(context, 'succeed');
    // Mock an event with the payload
    const event = {
      operation: 'test',
      payload: payload
    };
    // Call handler
    return handler(event, context).then(value => {
      const expected = {
        operationName: 'test',
        value: payload
      };
      expect(spy.calledOnce).to.be.true;
      expect(spy.calledWithExactly(expected)).to.be.true;
      expect(value).to.deep.equal(expected);
    });
  });
});
