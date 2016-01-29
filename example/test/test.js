// Chai
import { should } from 'chai';
should();

// Optionally import other test utils
// import sinon from 'sinon';

// Import handler function to test
import { handler } from '../src';

// Create unit tests for your handler to respond to different events
describe('handler', () => {
  it('should succeed and return the given payload', done => {
    // Create a payload
    const payload = {
      key1: 'val1',
      key2: 'val2'
    };
    // Mock a context function that checks the `succeed` value.
    const context = {
      succeed: value => {
        value.should.equal(payload);
        done();
      }
    };
    // Mock an event with the payload
    const event = {
      operation: 'test',
      payload: payload
    };
    // Call handler
    handler(event, context);
  });
});
