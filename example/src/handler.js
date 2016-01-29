import { Handler, operation } from 'lambda6';

/**
 * This is your lambda6 handler class that you should implement. Add operations
 * as methods within the class and be sure to add unit tests and to update this
 * documentation.
 */
export default class TestHandler extends Handler {
  /**
   * Sample operation handler for the "test" operation, it simply causes the
   * handler to succeed with the payload it's given.
   * @param {Object} payload - the `payload` field extracted from `event`
   */
  test({ name, title }) {
    // Create an object to test things out
    const result = {
      operation_name: this.operation,
      payload_name: name,
      payload_title: title
    }
    return result;
  }
}
