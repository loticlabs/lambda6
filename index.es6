// Base class for Lambda handler methods
export class Handler {

  constructor(event, context) {
    // Create read-only properties
    Object.defineProperties(this, {
      'event': {
        __proto__: null,
        value: event
      },
      'context': {
        __proto__: null,
        value: context
      }
    });
  }

  /**
   * Handle the lambda event.
   * @param {Object} event - the AWS Lambda event
   * @param {Object} context - the AWS Lambda context
   */
  static handle(event, context) {

    // Check event payload first
    var operation, fn;
    if (!(operation = event.operation) || (typeof operation !== 'string')) {
      throw new Error(`Operation name argument missing or invalid.`);
    }

    // Check `this` value
    if (!this || typeof this !== 'function') {
      throw new Error(`handle called with invalid "this" value.`);
    }

    // Create implementation and define function reference
    var impl, fn;
    try {
      impl = new this(event, context);
    } catch (e) {
      throw new Error(`Unable to create new instance of "${this.name}: ${e}"`)
    }

    // Check if implementation is defined
    if (!impl) {
      throw new Error(`Implementation not defined`);
    }

    // Event
    if (!impl.event) {
      throw new Error(`this.event is missing`);
    }

    // Context
    if (!impl.context) {
      throw new Error(`this.context is missing`);
    }

    // Get operation handler function
    if (!(fn = impl[operation])) {
      throw new Error(`Handler "${operation}" not found`);
    }

    // Validate operation handler function
    if (typeof fn !== 'function') {
      throw new Error(`Handler "${operation}" not a function`);
    }

    try {
      // Call the function with the payload
      const payload = event.payload || {};
      fn.call(impl, payload);
    } catch (e) {
      throw new Error(`Unable to execute ${this.name}.handle(): ${e}`);
    }
  }
}
