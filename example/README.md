# lambda6Example
`// TODO: Badges go here`
Sample service using lambda6, created by Yeoman and generator-lambda6

## Documentation
Documentation can be auto-generated through [ESDoc](https://esdoc.org/) by using the `docs` gulp task (see below).

## Building
```bash
gulp
```

### Gulp Tasks
This project uses [gulp](http://gulpjs.com/) for all of its build stages. Below is a table of the build tasks that are currently configured in the [gulpfile.babel.js](gulpfile.babel.js) file. You can, of course, customize this to your needs.

Task Name | Purpose                                    | Artifacts
----------|--------------------------------------------|------------------------
clean     | removes build artifacts                    | none
babel     | transpiles Babel from `src` into `dist`    | `dist`
npm       | installs production npm packages to `dist` | `dist/node_modules`
lint      | [ESLint](http://eslint.org/) `{src,test}`  | `coverage`
test      | lints and runs unit tests from `test`      | `coverage`, test report
docs      | generates documentation from `src`         | `docs`
bundle    | generates the `lambda.zip` bundle          | `lambda.zip`
lambda    | uploads `lambda.zip` to AWS Lambda         | Lambda function in AWS

---
*This project was generated using [generator-lambda6](https://github.com/nombers/generator-lambda6).*
