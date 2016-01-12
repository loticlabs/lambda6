// Include gulp
const gulp = require('gulp');

// Include plugins
const babel = require('gulp-babel'),
      mocha = require('gulp-mocha'),
      esdoc = require('gulp-esdoc'),
  babelCore = require('babel-core/register'),
runSequence = require('run-sequence'),
   istanbul = require('gulp-istanbul'),
    isparta = require('isparta'),
    install = require('gulp-install'),
     rename = require('gulp-rename'),
        del = require('del');

// Clean task
gulp.task('clean', () => {
  return del(['dist']);
});

// Babel Task
gulp.task('babel', () => {
  return gulp.src('.')
    .pipe(babel())
    .pipe(gulp.dest('dist'));
});

gulp.task('pre-test', () => {
  return gulp.src(['./*.es6'])
    .pipe(istanbul({
      instrumenter: isparta.Instrumenter,
      includeUntested: true
    }))
    .pipe(istanbul.hookRequire());
});

// Test Task
gulp.task('test', ['pre-test'], () => {
  return gulp.src(['test/**/*.es6'])
    .pipe(mocha({ reporter: 'spec' }))
    .pipe(istanbul.writeReports({
      reporters: ['text', 'text-summary', 'html', 'lcov']
    }))
    .pipe(istanbul.enforceThresholds({ thresholds: { global: 0 } }));
});

// Docs Task
gulp.task('docs', () => {
  gulp.src('.')
  .pipe(esdoc({
    includes: ['\\.es6$'],
    destination: './docs'
  }));
});

// Install npm packages to dist
gulp.task('npm', () => {
  gulp.src('./package.json')
  .pipe(gulp.dest('./dist/'))
  .pipe(install({ production: true }));
});

// Watch Files For Changes
gulp.task('watch', function() {
  gulp.watch('**/*.es6', ['']);
});

// Default Task
gulp.task('default', (callback) => {
  return runSequence(['clean', 'test'], ['babel'], ['npm']);
});
