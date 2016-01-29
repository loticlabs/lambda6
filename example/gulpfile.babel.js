// Gulp
import gulp from 'gulp';
import zip from 'gulp-zip';
import babel from 'gulp-babel';
import mocha from 'gulp-mocha';
import esdoc from 'gulp-esdoc';
import eslint from 'gulp-eslint';
import lambda from 'gulp-awslambda';
import istanbul from 'gulp-istanbul';
import install from 'gulp-install';

// Other plugins
import runSequence from 'run-sequence';
import * as isparta from 'isparta';
import del from 'del';

// Lambda config data
import lambdaConfig from './lambda';

// Clean task
gulp.task('clean', () => {
  return del(['lambda.zip', 'dist', 'docs', 'coverage']);
});

// Lint task
gulp.task('lint', function () {
  return gulp.src(['./src/**/*.js', './test/**/*.js', './index.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

// Babel Task
gulp.task('babel', () => {
  return gulp.src('./src/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('dist'));
});

// 1. Install npm packages to dist
gulp.task('npm', () => {
  return gulp.src('./package.json')
    .pipe(gulp.dest('./dist/'))
    .pipe(install({ production: true }));
});

// Istanbul Task
gulp.task('--pre-test-hook', () => {
  return gulp.src(['./src/**/*.js'])
    .pipe(istanbul({
      instrumenter: isparta.Instrumenter,
      includeUntested: true
    }))
    .pipe(istanbul.hookRequire());
});

// Test Task
gulp.task('test', ['lint', '--pre-test-hook'], () => {
  return gulp.src(['./test/**/*.js'])
    .pipe(mocha())
    .pipe(istanbul.writeReports({
      reporters: ['text', 'text-summary', 'html', 'lcov']
    }))
    .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }));
});

// Bundle Task
gulp.task('bundle', ['lint', 'test', 'babel', 'npm'], () => {
  return gulp.src(['./dist/**','!dist/package.json', 'dist/.*'])
    .pipe(zip('lambda.zip'))
    .pipe(gulp.dest('./'));
});

// Lambda Task
gulp.task('lambda', ['bundle'], () => {
  return gulp.src('./lambda.zip')
    .pipe(lambda(lambdaConfig))
    .pipe(gulp.dest('.'));
});

// Docs Task
gulp.task('docs', () => {
  return gulp.src('./src')
  .pipe(esdoc({
    includes: ['\\.js$'],
    destination: './docs'
  }));
});

// Watch Files For Changes
gulp.task('watch', function() {
  return gulp.watch(['./src/**/*.js', './test/**/*.js'], ['test']);
});

// Default Task
gulp.task('default', (callback) => {
  return runSequence(['clean', 'test'], ['babel']);
});
