import 'source-map-support/register';
import Promise from 'bluebird';

/** @external {Promise} http://bluebirdjs.com/docs/api-reference.html */
/** @external {AWSLambdaContext} http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html */
/**
 * An endpoint is a prototype method in a {@link Handler} subclass. It's so-called
 * because it is the end destination to which an event is dispatched. In the
 * current version, an endpoint is simply a function with attached {@link EndpointMetadata}.
 * In future versions, this may not be the case.
 * @typedef {Function} Endpoint
 * @property {EndpointMetadata} _λ6_metadata - attached handler metadata
 * @experimental Future versions may allow a more abstract model for endpoints.
 * Interacting directly with and endpoint or its metadata may cause breaking
 * changes.
 * @since 2.0.0
 * @example
 *  @operation
 *  testEndpoint() { return 'testEndpoint is an endpoint'; }
 */

function isUndefinedOrNull(val) {
  return val == null; //eslint-disable-line no-eq-null, eqeqeq
}

function checkType(obj, name, types) {
  if (isUndefinedOrNull(obj)) {
    throw new TypeError(`invalid type for ${name}, cannot be ${obj}`);
  }
  /* istanbul ignore next */
  let theType = typeof obj;
  // Currently only functions are allowed as endpoints
  if (types.indexOf(theType) < 0) { //eslint-disable-line no-magic-numbers
                // ^^ AWS doesn't support Array.prototype.includes()
    throw new TypeError(`invalid type for ${name}, cannot be ${theType}`);
  }
}

function deepCopy(obj, tpl) {
  if (obj != null) { //eslint-disable-line no-eq-null,eqeqeq
    // Use typeof here instead of instanceof so that functions get copied over
    if (typeof obj === 'object') {
      return Object.create(null, createCopyDescriptors(obj, true, tpl)); //eslint-disable-line no-use-before-define
    }
  }
  return obj;
}

/**
 * Creates a dictionary of property descriptors that can be used as the second
 * argument to {@link Object.defineProperties}. It does this by enumerating
 * the own properties of `obj` using {@link Object.keys} and then constructing
 * an object with corresponding keys and property descriptors as values of those
 * keys. The property descriptor is created using `template` as starting point, to
 * which it adds a `value` property. This method can also make deep copies of
 * `obj` by passing in a truthy `deep` value. This method doesn't type check `obj`.
 * @param {Object} object - the object to create copy descriptors for
 * @param {boolean} [deep] - controls whether the `value` property of the property
 * @param {Object} [template] - a property descriptor template, to which `value` is added
 * descriptor should be populated with a deeply-copied value from the source object.
 * @return {Object} that contains property descriptors to use in {@link Object.create}
 */
function createCopyDescriptors(obj, deep, template) {
  const pdc = {};
  const _tpl = template || { enumerable: true };
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    const valueDesc = { value: { value:  deep ? deepCopy(val, _tpl) : val } };
    pdc[key] = Object.create(_tpl, valueDesc);
  });
  return pdc;
}

/**
 * Endpoint metadata is what {@link Handler} uses to inspect an an {@link Endpoint}
 * to determine if it's eligible to handle a given operation. Operations are
 * "whitelisted" so that properties (own or inherited) of the handler don't get
 * exposed as operation endpoints where they aren't meant to.
 * @typedef {Object} EndpointMetadata
 * @since 2.0.0
 * @experimental The properties of this are likely to change.
 */
const _defaultMetadata = {};

/**
 * Base class for AWS Lambda handlers. This class should be extended and new
 * operations should be added to the class as prototype methods. A method added
 * to the subclass needs to be registered with the {@link operation} decorator in
 * order to be visible as an operation {@link Endpoint}. {@link Handler} will handle
 * an event in the following way:
 * <ol>
 * <li>Extract `operation` and `payload` from the event using keys defined in {@link HandlerOptions}</li>
 * <li>Lookup property `this[operation]` in handler and validate it as an {@link Endpoint}</li>
 * <li>Create a new {@link InvocationContext} with the current handler as the prototype</li>
 * <li>Invoke the {@link Endpoint}, binding `this` to the {@link InvocationContext}</li>
 * <li>Call `context.succeed()` or `context.fail()` if an {@link AWSLambdaContext} is present</li>
 * <li>Resolve or reject the results (or error) in the promise returned to the caller</li>
 * </ol>
 * @see http://docs.aws.amazon.com/lambda/latest/dg/programming-model.html
 * @version 2.0.0
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
   * The current value is "_λ6_metadata" and most likely won't conflict with any
   * existing properties of the function. AWS Lambda does not yet support {@link Symbol},
   * so the metadata key is currently a string.
   * @type {string}
   * @since 2.0.0
   */
  static get metadataKey() {
    // String for now, will be a Symbol later
    return '_λ6_metadata';
  }

  /**
   * Gets the default options for a new {@link Handler} instance. The defaults
   * are "operation" and "payloadKey" for
   * @type {HandlerOptions}
   * @since 2.0.0
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
   * @since 2.0.0
   */
  constructor(options) {
    /**
    * The {@link Handler} can be customized to inspect different values for the
    * operation and payload within the event. Currently, deep gets are not supported
    * for key values, so the data must reside as a direct child of the root JSON
    * object (event).
    * @typedef {Object} HandlerOptions
    * @property {string} [operationKey] - the key used to lookup the `operation`
    * from the `event` object.
    * @property {string} [payloadKey] - the key used to lookup the `payload`
    * from the `event` object.
    * @since 2.0.0
    * @todo Add support deep gets for operation and payload keys.
    */
    this.options = Object.assign({}, Handler.defaultOptions, options);
  }

  /**
   * Validates whether an endpoint object is valid and can be decorated with the
   * "@operation" decorator. If it is invalid, it will throw a `TypeError`.
   * @param {Endpoint} endpoint - the endpoint to validate
   * @throws {TypeError} if the endpoint is not of the correct type
   * @private
   * @since 2.0.0
   */
  static validateEndpoint(endpoint) {
    checkType(endpoint, 'endpoint', ['function']);
  }

  /**
   * Gets the {@link EndpointMetadata} from an {@link Endpoint}.
   * @param {Endpoint} endpoint - the endpoint to check
   * @return {EndpointMetadata} the metadata attached to the given endpoint, or `undefined`
   * @throws {TypeError} if the metadata is of the wrong type (not an object), including `null`
   * @since 2.0.0
   */
  static getEndpointMetadata(endpoint) {
    Handler.validateEndpoint(endpoint);
    if (!endpoint.hasOwnProperty(Handler.metadataKey)) {
      return;
    }
    const metadata = endpoint[Handler.metadataKey];
    checkType(metadata, 'endpoint metadata', ['object']);
    return metadata;
  }

  /**
   * Handler method that is exported to AWS Lambda.
   * @param {Object} event - the AWS Lambda event to be processed
   * @param {AWSLambdaContext} [context] - the AWS Lambda context, optional if testing
   * @param {...args} [args] - additional arguments that will get passed to the
   * endpoint method when it is invoked.
   * @returns {Promise} that resolves to the return value of the invoked endpoint
   * or rejects with an error
   * @since 2.0.0
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
    return Promise.try(() => this.resolveEndpoint(operation))
    .spread((endpoint, metadata) => {
      /**
       * Object bound as `this` value when an {@link Endpoint} is invoked as the
       * last stage of the event-handling lifecycle. There are a few reasons for
       * binding to the new context:
       * <ol>
       * <li>Provide only the invoked {@link Endpoint} with `event` and `context`
       * without needing to make these values universally available.</li>
       * <li>Allow parameters passed to the endpoint to be only those that are
       * locally relevant, such as the `payload`. In the future, this may include
       * providing additional filters or middleware.</li>
       * <li>Implement a more functional approach with no shared state so that
       * the handler has no real side effects to the `context` or `event`. This
       * enables future event handling schemes such as fanning out the event to
       * multiple endpoints.</li>
       * </ol>
       * @typedef {Object} InvocationContext
       * @property {EndpointMetadata} metadata - metadata of current endpoint
       * @property {string|number} operation - operation key of current endpoint
       * @property {Object} event - the event being handled
       * @property {AWSLambdaContext} [context] - the AWS Lambda context
       * @since 2.0.0
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
   * Creates an {@link InvocationContext} by creating a new object with the current
   * {@link Handler} instance as the prototype, assigning the properties from
   * `thisArgs` as read-only, enumerable own properties of the object and _optionally_
   * performing a deep copy of the values in `thisArgs` to make them deeply immutable.
   * The resulting object is then used as the `this` value during invocation of
   * the {@link Endpoint}.
   * @param {Object} [thisArgs] - object containing assignable values
   * @return {InvocationContext} that can be used to invoke an endpoint
   * @throws {TypeError} if `thisArgs` is not `undefined` or `null` and isn't an object
   * @since 2.0.0
   * @experimental Deep copying is disabled by default. To enable, set options.deepCopy
   * to a truthy value. This feature requires further testing to make sure it
   * operates as expected within the AWS environment.
   */
  createInvocationContext(thisArgs) {
    let descriptors;
    if (thisArgs != null) { //eslint-disable-line no-eq-null,eqeqeq
      if (typeof thisArgs !== 'object') {
        throw new TypeError(`thisArgs must be an object`);
      }
      descriptors = createCopyDescriptors(thisArgs, this.options.deepCopy);
    }
    return Object.create(this, descriptors);
  }

  /**
   * Invokes a endpoint (function) with payload and optional arguments.
   * @param {Function} endpoint - the endpoint to invoke
   * @param {Object} thisArgs - additional data to augment "this" during invocation
   * @param [payload] - the payload value of the event
   * @returns {Promise} a promise containing the result of invocation.
   * @private
   * @since 2.0.0
   */
  invoke(endpoint, thisArgs, payload, ...args) {
    // Synchronously (w/out Promise) invoke the endpoint
    const _invoke = () => {
      const ictx = this.createInvocationContext(thisArgs);
      return endpoint.call(ictx, payload, ...args);
    }
    return Promise.try(_invoke);
  }

  /**
   * Resolves an operation name to a prototype method of a derived class. This
   * method is a wrapper for {@link Handler.getEndpointMetadata} that type checks
   * the operation name to make sure it isn't `null` or `undefined`, then attempts
   * to retrieve the endpoint and metadata.
   * @param {string} operation - the name of the operation to resolve
   * @return {Array} - an array with two elements: the endpoint function and the metadata
   * @property {Endpoint} 0 - the endpoint function
   * @property {EndpointMetadata} 1 - the endpoint metadata
   * @throws {TypeError} if `operation` is not a string, or if the endpoint has
   * invalid metadata.
   * @throws {Error} if an endpoint cannot be found
   * @since 2.0.0
   */
  resolveEndpoint(operation) {
    checkType(operation, 'operation', ['string']);

    // Throw the same error for not found and for metadata issues
    const notFound = () => {
      throw new Error(`endpoint not found for operation "${operation}"`);
    };

    // Get endpoint and metadata (or throw)
    const endpoint = this[operation];
    if (!isUndefinedOrNull(endpoint)) {
      try {
        const metadata = Handler.getEndpointMetadata(endpoint);
        if (!isUndefinedOrNull(metadata)) {
          return [endpoint, metadata];
        }
      } catch (e) {
        console.error(e); //eslint-disable-line no-console
      }
    }

    // Got here, so the endpoint couldn't be found
    notFound();
  }
}

/**
 * Operation decorator for handler methods. Decorating a method in a `Handler`
 * subclass will attach a {@link EndpointMetadata} to that method, making it
 * visible as an operation {@link Endpoint}.
 * @param {Object} target - the target class of the decorator
 * @param {string} key - the key used to access the method being decorated
 * @param {Object} descriptor - the property descriptor of the method
 * @return {Object} the modified property descriptor of the method
 * @since 2.0.0
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
  endpoint[Handler.metadataKey] = Object.assign({}, _defaultMetadata);
  descriptor.enumerable = true; // make visible for operation introspection
  return descriptor;
}
