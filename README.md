# lambda6
[![Build Status](https://travis-ci.org/nombers/lambda6.svg)](https://travis-ci.org/nombers/lambda6)

A simple and opinionated handler architecture for AWS Lambda using ES6. Lambda6 provides a base class `Handler` to be used for dispatching AWS Lambda requests to methods within the subclass.

## Installing

`npm install`

## Using it in your project

It's easy to use lambda6 in your project, you just need to do two things:

### 1. Create a subclass of Handler

```javascript
import { Handler } from 'lambda6'

class HelloHandler extends Handler {

  sayHello(payload) {
    const { name } = payload;
    this.context.succeed(`Hello, ${name}`);
  }
}
```

### 2. Organize your Lambda request operations

Lambda6 is opinionated, and it expects to receive an `event` with an `operation` property that allows the base class to dispatch to the appropriate handler method. Additionally, that method is called with the `payload` property of the `event`. Here's an example of calling the `HelloHandler` class with a Lambda event:
```javascript
{
  "operation": "sayHello",
  "payload": {
    "name": "Mr. Incredible"
  }
}
```
This allows you to create a thin dispatch layer between the event received and the method that will process the request. The `Handler` class contains `event` and `context` as member variables that can be accessed in the manner shown above.
