# lambda6
[![Build Status](https://travis-ci.org/nombers/lambda6.svg)](https://travis-ci.org/nombers/lambda6)
[![Code Climate](https://codeclimate.com/github/nombers/lambda6/badges/gpa.svg)](https://codeclimate.com/github/nombers/lambda6)
[![Test Coverage](https://codeclimate.com/github/nombers/lambda6/badges/coverage.svg)](https://codeclimate.com/github/nombers/lambda6/coverage)

A simple ES6 handler architecture for AWS Lambda with opinionated defaults. The base class, `Handler` can be subclassed to provide a structured framework for handling AWS Lambda events. `Handler` matches an event `operationKey` to a method name by default, and extracts an argument for that method from the event using the `payloadKey`. Both of these keys can be changed by passing in an options hash to the constructor.

### Table of Contents
* [Installing](#installing)
* [Design Goals](#design-goals)
* [Documentation](#documentation)
    * [Getting Started](#getting-started)
    * [Usage](#usage)
    * [Dependencies](#dependencies)
* [Building](#building)
* [Contributing](#contributing)
* [Future Improvements](#future-improvements)

## Installing
`npm install --save lambda6`

## Design Goals
* 100% ES6, albeit transpiled to ES5
* Limited or no [dependencies](#dependencies) (small code base)
* Easy dispatching of events based on event structure, with sane defaults
* Minimalist and intuitive request lifecycle
* Promise-oriented using the venerable [Bluebird](https://github.com/petkaantonov/bluebird) library

## Documentation
[JavaScript API docs](http://lambda6-docs.s3-website-us-east-1.amazonaws.com/index.html) are generated using [ESDoc](https://esdoc.org) during the build process. If any documentation is inaccurate or missing, please create an issue here on GitHub.

### Getting Started
The fastest way to get started is to use the [lambda6 Yeoman generator](https://github.com/nombers/generator-lambda6) to generate a new lambda6 project.

```bash
npm install -g yo generator-lambda6
mkdir lambda-6-sample && cd $_
yo lambda-6
gulp lambda
```

The last line above will deploy your function to AWS Lambda using the settings configured by the Yeoman generator. Check out the README for more detailed instructions. After you've generated that project, you can refer to the section below for more details on how to structure your handler methods.

### Usage
#### 1. Create a subclass of Handler
Within your subclass, create methods for each operation. Register these methods using the `@operation` decorator.

```javascript
import { Handler, operation } from 'lambda6'

class HelloHandler extends Handler {

  @operation
  greet({ greeting, title, name }) {
    const fullName = `${title} ${name}`;
    return `${this.operation}: ${greeting}, ${fullName}`;
    // returns "greet: hello Mr. Bond"
  }

}
```

#### 2. Organize your Lambda request operations

By default, lambda6 expects to receive an event with the following _own_ properties set using the keys below:

Options Key  | Required | Default     | Description
-------------|----------|-------------|-----------------------------------------
operationKey | Yes      | "operation" | the operation/method to invoke
payloadKey   | Yes      | "payload"   | method argument/payload

The `Handler` class uses `operation` to find an appropriate method to handle the request and then passes the `payload` to that method. The dispatched method can optionally retrieve the same data from `this.event.payload`, so the method argument is there for convenience.

Here's an example of calling the `HelloHandler` class with a Lambda event:
```javascript
{
  "operation": "greet",
  "payload": {
    "name": "Bond",
    "title": "Mr.",
    "greeting": "hello"
  }
}
```

This allows you to create a thin dispatch layer between the event received and the method that will process the request. In the case above, `greet` would be invoked within a newly-created `this` context with the following characteristics:

* prototype set to the `Handler` subclass of which `greet` is member
* `metadata`, `operation`, `event` and `context` immutable properties of `this`

#### 3. Export and expose the handler function to AWS Lambda

```javascript
export function handler(event, context) {
  // passing in the default operationKey as an example
  return new MyHandler({ operationKey: 'operation' }).handle(event, context);
}
```

### Dependencies
lambda6 has only one runtime dependency: [Bluebird](https://github.com/petkaantonov/bluebird). Other than that, an ES5 runtime is required. This keeps the code base compact, leading to faster provisioning times in AWS Lambda.

## Building
This project uses [gulp](https://gulpjs.com) to perform the necessary build steps. The default build step (which transpiles the ES6 code to `lib`) can be invoked like so:
```bash
gulp
```

Tests can be run without generating the transpiled code by running:
```bash
gulp test
```

Pay close attention to the ESLint settings in [.eslintrc](.eslintrc), which are quite strict, so that you don't get tripped up if you start changing code.

## Contributing
Pull requests are welcome and encouraged. Please take a look at [.eslintrc](.eslintrc) to see what the coding standards are that are enforced as part of our build system. That way, when you create a pull request, the build will pass. Also, please provide a rationale for your change and make sure it fits within the [Design Goals](#Design-Goals).

## Future Improvements
The eventual goal is to leverage the declarative features of ES6 (decorators, getters, etc.) to more concisely describe a service. To that effect, here are some ideas in the pipeline.

* Handler introspection and enumeration of operations
* Use a `RexExp` operation resolver and dispatch with extracted parameters
* Make `@operation` more sophisticated and attach pre/post events (i.e. auth)
* Hierarchical dispatching and chaining
* Allow other endpoint types besides functions, for example:
```javascript
class UserHandler extends Handler {

  // Handle with a literal value
  @operation
  get version() { '1.0.1' }

  // Handle with a literal error value (calls context.fail())
  @operation
  get errorOp() { Error('not yet implemented') }

  // Handle with a function
  @operation
  me({ id }) {
    return db.getProfile(id);
  }

  // Handle with a downstream chained Handler
  @operation
  get ['groups/{groupId}']: { GroupHandler }

}
```
