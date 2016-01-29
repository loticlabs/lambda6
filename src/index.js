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

// Reserved for internal future use
const _defaultMetadata = {};

/**
 * Base class for AWS Lambda handlers. This class should be extended and new
 * operations should be added to the class as prototype/instance methods.
 */
export class Handler {

  /**
   * Gets the key used to access the endpoint metadata.
   */
  static get metadataKey() {
    // String for now, will be a Symbol later
    return '_λ6_metadata';
  }

  /**
   * Gets the default options for a new `Handler` instance.
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
   * @param {Object} options - an optional hash of options to adjust the handler.
   */
  constructor(options) {
    this.options = Object.assign({}, Handler.defaultOptions, options);
  }

  /**
   * Validates whether an endpoint object is valid and can be decorated with the
   * "@operation" decorator. If it is invalid, it will throw a `TypeError`.
   * @param endpoint - the endpoint value to test
   * @throws {TypeError} if the endpoint is not valid.
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
   * Gets the endpoint metadata from an endpoint. An endpoint, in this case is a
   * the value in a key/value pair of this `Handler` where the key is the name
   * of the operation. The value, then, can be anything that can be set as the
   * value of a JavaScript property. Attaching metadata to the endpoint ensures
   * that operations are "whitelisted" and that properties of the handler don't
   * get exposed as operation endpoints where they aren't meant to.
   * @param endpoint the endpoint to check, can be any value
   * @return {Promise} - a promise that resolves to metadata or rejects with error
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
   * @param {Object} context - the AWS Lambda context
   * @returns {Promise} the promise-wrapped return value of the invoked endpoint
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
 */
export function operation(target, key, descriptor) {
  const endpoint = target[key];
  Handler.validateEndpoint(endpoint);
  endpoint[Handler.metadataKey] = _defaultMetadata;
  descriptor.enumerable = true; // make visible for operation introspection
  return descriptor;
}
