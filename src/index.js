// Base class for Lambda handler methods
export class Handler {

  /**
   * Creates a new instance of the base handler class. Subclasses should
   * override this if they wish to store objects available to the dispatch
   * methods.
   * @param {Object} event - the AWS Lambda event
   * @param {Object} context - the AWS Lambda context
   */
  constructor(event, context) {

    // Validate event
    if (!(event instanceof Object)) {
      throw new TypeError(`event is required and must be an object`);
    }

    // Validate context
    if (!(context instanceof Object)) {
      throw new TypeError(`context is required and must be an object`);
    }

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

    // Check `this` value
    if (!this || typeof this !== 'function') {
      throw new Error(`handle() called with invalid "this" value`);
    }

    // Create implementation and define function reference
    const impl = new this(event, context);

    // Dispatch operation name and payload
    return impl.dispatch(event.operation, event.payload || {});
  }

  /**
   * Performs the dispatch of the operation and the payload to the correct
   * method handler in the subclass.
   * @param {String} operation - the name of the operation to Performs
   * @param {Object} payload - the payload that is passed as an argument to the
   * method being dispatched.
   */
  dispatch(operation, payload) {

    // Check `this` value
    if (!(this instanceof Object)) {
      throw new Error(`dispatch() called with invalid "this" value`);
    }

    // Get operation handler function
    const fn = this.resolveOperation(operation);

    // Validate payload
    if (!(payload instanceof Object)) {
      throw new TypeError(`payload is required and must be an object`);
    }

    // Event
    if (!(this.event instanceof Object)) {
      throw new Error(`this.event is missing or is not an object`);
    }

    // Context
    if (!(this.context instanceof Object)) {
      throw new Error(`this.context is missing or is not an object`);
    }

    try {
      // Call the function with the payload
      return fn.call(this, payload);
    } catch (e) {
      throw new Error(`Unable to execute ${this.name}.dispatch(): ${e.message}`);
    }
  }

  /**
   * Resolves an operation name to an instance method of a derived class.
   * @param {String} operation - the name of the operation to resolve
   * @return {Function} a function that can be called with the event payload.
   */
  resolveOperation(operation) {

    // Check `this` value
    if (!(this instanceof Object)) {
      throw new Error(`resolveOperation() called with invalid "this" value`);
    }

    // Validate operation
    if (typeof operation !== 'string') {
      throw new TypeError(`operation is required and must be a string`);
    }

    // Get function
    const fn = this[operation];

    // Checks operation handler function
    if (fn === undefined) {
      throw new Error(`handler "${operation}" not found`);
    }

    // Validate operation handler function
    if (!(fn instanceof Function)) {
      throw new TypeError(`handler "${operation}" must be a function`);
    }

    return fn;
  }
}
