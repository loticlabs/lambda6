import Promise from 'bluebird';

function isUndefinedOrNull(val) {
  return val == null; //eslint-disable-line no-eq-null, eqeqeq
}

/**
 * Performs a deep copy on an object's own properties and makes the returned
 * copy immutable (read-only and non-configurable).
 * @param {Object} root - the object to copy
 * @returns {Object} an immutable deep copy of the object
 */
function deepCopyImmutable(root) {
  function _createDescriptors(obj) {
    const propDesc = {};
    Object.keys(obj).forEach(key => {
      const val = obj[key];
      propDesc[key] = {
        writable: false,
        configurable: false,
        enumerable: true,
        value: deepCopyImmutable(val)
      }
    });
    return propDesc;
  }
  if (root instanceof Object) {
    return Object.freeze(Object.create(null, _createDescriptors(root)));
  }
  return root;
}

/**
 * An endpoint is a prototype method in a {@link Handler} subclass. It's so-called
 * because it is the end destination to which an event is dispatched. In the
 * current version, an endpoint is simply a function with attached {@link EndpointMetadata}.
 * In future versions, this may not be the case.
 * @typedef {Function} Endpoint
 * @property {EndpointMetadata} _λ6_metadata - attached handler metadata
 * @example
 *  @operation
 *  testEndpoint() { return 'testEndpoint is an endpoint'; }
 */

/**
 * Endpoint metadata is what {@link Handler} uses to inspect an an {@link Endpoint}
 * to determine if it's eligible to handle a given operation. Operations are
 * "whitelisted" so that properties (own or inherited) of the handler don't get
 * exposed as operation endpoints where they aren't meant to.
 * @typedef {Object} EndpointMetadata
 */
const _defaultMetadata = {};

/**
 * @external {Promise} http://bluebirdjs.com/docs/api-reference.html
 * @external {AWSLambdaContext} http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 */

/**
 * Base class for AWS Lambda handlers. This class should be extended and new
 * operations should be added to the class as prototype/instance methods. A method
 * added to the subclass needs to be registered with the {@link operator} decorator
 * in order to be registered as operation {@link Endpoint}. {@link Handler}
 * will handle an event in the following way:
 * <ol>
 * <li>Extract `operation` and `payload` from event using keys defined in {@link HandlerOptions}</li>
 * <li>Lookup property `this[operation]` in handler and validate it as an {@link Endpoint}</li>
 * <li>Create a new {@link InvocationContext} mirroring the current handler</li>
 * <li>Invoke the {@link Endpoint}, setting `this` equal to the {@link InvocationContext}</li>
 * <li>Call `context.succeed()` or `context.fail()` if an {@link AWSLambdaContext} is present</li>
 * <li>Resolve or reject the results (or error) in the promise returned to the caller<li>
 * </ol>
 * @see http://docs.aws.amazon.com/lambda/latest/dg/programming-model.html
 * @version 1.1.0
 * @since 1.0.0
 * @example
 *
 * import { Handler, operation } from 'lambda6';
 *
 * class MyHandler extends Handler {
 *
 *   @operation
 *   echoOperationName() {
 *     return { operationName: this.operation };
 *   }
 *
 *   @operation
 *   echoValuesFromPayload({ value1, value2 }) {
 *     return { oldValue1: value1, oldValue2: value2 };
 *   }
 *
 * }
 */
export class Handler {

  /**
   * Gets the key used to access the {@link EndpointMetadata} for an {@link Endpoint}.
   * @type {string}
   * @since 1.1.0
   */
  static get metadataKey() {
    // String for now, will be a Symbol later
    return '_λ6_metadata';
  }

  /**
   * Gets the default options for a new {@link Handler} instance.
   * @type {HandlerOptions}
   * @since 1.1.0
   */
  static get defaultOptions() {
    return {
      operationKey: 'operation',
      payloadKey: 'payload'
    };
  }

  /**
   * Creates a new instance of the base handler class. Subclasses don't need to
   * override this if they wish to store custom data. Simply pass in an `options`
   * value and the data will be available as `this.options[key]` during method
   * invocation.
   * @param {HandlerOptions} [options] - hash of options to adjust the behavior
   * of the handler
   */
  constructor(options) {
    /**
    * @typedef {Object} HandlerOptions
    * @property {string|number} [operationKey] - the key used to lookup the `operation`
    * from the `event` object.
    * @property {string|number} [payloadKey] - the key used to lookup the `payload`
    * from the `event` object.
    */
    this.options = Object.assign({}, Handler.defaultOptions, options);
  }

  /**
   * Validates whether an endpoint object is valid and can be decorated with the
   * "@operation" decorator. If it is invalid, it will throw a `TypeError`.
   * @param {Endpoint} endpoint - the endpoint to validate
   * @throws {TypeError} if the endpoint is not valid.
   * @private
   * @since 1.1.0
   */
  static validateEndpoint(endpoint) {
    if (isUndefinedOrNull(endpoint)) {
      throw new TypeError(`endpoint cannot be null or undefined`);
    }
    let theType = typeof endpoint;
    // Currently only functions are allowed as endpoints
    if (['function'].indexOf(theType) < 0) { //eslint-disable-line no-magic-numbers
      throw new TypeError(`invalid endpoint type, cannot be ${theType}`);
    }
  }

  /**
   * Gets the {@link EndpointMetadata} from an {@link Endpoint}.
   * @param {Endpoint} endpoint - the endpoint to check, can be any value
   * @return {Promise} - a promise that resolves to metadata or rejects with error
   * @throws {TypeError} if endpoint is null, undefined or not an {@link Endpoint}
   * @throws {Error} if endpoint is valid but doesn't contain metadata
   * @since 1.1.0
   */
  static getEndpointMetadata(endpoint) {
    return Promise.try(function() {
      Handler.validateEndpoint(endpoint);
      let metadata;
      if (!endpoint.hasOwnProperty(Handler.metadataKey) ||
          !(metadata = endpoint[Handler.metadataKey]) instanceof Object) {
        throw new Error(`endpoint metadata not found`);
      }
      return metadata;
    });
  }

  /**
   * Handler method that is exported to AWS Lambda.
   * @param {Object} event - the AWS Lambda event to be processed
   * @param {AWSLambdaContext} [context] - the AWS Lambda context, optional if testing
   * @param {...args} [args] - additional arguments that will get passed to the
   * endpoint method when it is invoked.
   * @returns {Promise} the promise-wrapped return value of the invoked endpoint
   * @since 1.0.0
   */
  handle(event, context, ...args) {

    // Validate event
    if (isUndefinedOrNull(event)) {
      return Promise.reject(new TypeError(`event is required`));
    }

    function callContextFn(name, value) {
      if (context && context[name] instanceof Function) {
        context[name](value);
      }
    }

    function onSuccess(result) {
      callContextFn('succeed', result);
      return result;
    }

    function onFailure(error) {
      callContextFn('fail', error);
      throw error;
    }

    // Extract from event
    const {
      [this.options.operationKey]: operation,
      [this.options.payloadKey]: payload
    } = event;

    // Lookup endpoint and invoke
    return this.resolveEndpoint(operation).spread((endpoint, metadata) => {
      // Run in "sandbox" with shadowed this
      /**
       * Object bound as `this` value when an {@link Endpoint} is invoked as the
       * last stage of the event-handling lifecycle. This new context is created
       * for a few reasons:
       * <ol>
       * <li>Provide only the invoked {@link Endpoint} with `event` and `context`
       * without needing to clear the values from the handler afterward or pass
       * them in as parameters. Instead, the parameters passed to the endpoint
       * are those that are locally relevant, such as the `payload`.</li>
       * <li>Implement a more functional approach with no shared state so that
       * the handler has no real side effects to the `context` or `event`.</li>
       * </ol>
       * @typedef {Object} InvocationContext
       * @property {EndpointMetadata} metadata - read-only copy of endpoint metadata
       * @property {string|number} operation - the operation key that was resolved
       * @property {Object} event - read-only copy of the event being handled
       * @property {AWSLambdaContext} [context] - read-only copy of AWS Lambda callContextFn
       */
      const thisArgs = {
        metadata: metadata,
        operation: operation,
        event: event,
        context: context
      };
      return this.invoke(endpoint, thisArgs, payload, ...args);
    })
    .then(onSuccess, onFailure);
  }

  /**
   * Invokes a endpoint (function) with payload and optional arguments.
   * @param {Function} endpoint - the endpoint to invoke
   * @param {Object} thisArgs - additional data to augment "this" during invocation
   * @param payload - the payload value of the event
   * @returns {Promise} a promise containing the result of invocation.
   * @private
   * @since 1.1.0
   */
  invoke(endpoint, thisArgs, payload, ...args) {
    // Synchronously (w/out Promise) invoke the endpoint
    const _invoke = () => {
      const ictx = deepCopyImmutable(thisArgs);
      const _epThis = Object.assign(Object.create(this), ictx);
      return endpoint.call(_epThis, payload, ...args);
    }
    return Promise.try(_invoke);
  }

  /**
   * Resolves an operation name to an instance method of a derived class.
   * @param {String} operation - the name of the operation to resolve
   * @return {Function} a function that can be called with the event payload.
   * @private
   * @since 1.1.0
   */
  resolveEndpoint(operation) {
    // Synchronous (w/out Promise) resolve endpoint
    const _resolveEndpoint = () => {

      // Validate operation, can be anything that's a valid key for an object
      if (isUndefinedOrNull(operation)) {
        throw new TypeError(`operation is required`);
      }

      // Get endpoint and metadata (or throw)
      const endpoint = this[operation];
      const metadata = Handler.getEndpointMetadata(endpoint);

      // Return array
      return [endpoint, metadata];
    }
    return Promise.try(_resolveEndpoint);
  }
}

/**
 * Operation decorator for handler methods.
 * @param {Object} target - the target class of the decorator
 * @param {string} key - the key used to access the method being decorated
 * @param {Object} descriptor - the property descriptor of the method
 * @return {Object} the modified property descriptor of the method
 * @since 1.1.0
 * @example
 *
 * import { Handler, operation } from 'lambda6'
 *
 * class TestHandler extends Handler {
 *
 *   @operation
 *   decoratedOperation() { return 'handled'; }
 *
 * }
 */
export function operation(target, key, descriptor) {
  const endpoint = target[key];
  Handler.validateEndpoint(endpoint);
  endpoint[Handler.metadataKey] = _defaultMetadata;
  descriptor.enumerable = true; // make visible for operation introspection
  return descriptor;
}
