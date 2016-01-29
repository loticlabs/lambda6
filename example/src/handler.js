import { Handler, operation } from 'lambda6';

/**
 * This is your lambda6 handler class that you should implement. Add operations
 * as methods within the class and be sure to add unit tests and to update this
 * documentation.
 */
export default class TestHandler extends Handler {
  /**
   * Sample operation handler for the "test" operation, it simply causes the
   * handler to succeed with the the operation name and payload it's given.
   * @param {Object} payload - the `payload` field extracted from `event`
   */
  @operation
  test(payload) {
    // No need to call `this.context.succeed()`, just return the value
    return { operationName: this.operation, value: payload };
  }
}
