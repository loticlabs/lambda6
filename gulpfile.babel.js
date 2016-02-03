// Include gulp
import gulp from 'gulp';

// Include plugins
import babel from 'gulp-babel';
import mocha from 'gulp-mocha';
import esdoc from 'gulp-esdoc';
import eslint from 'gulp-eslint';
import uglify from 'gulp-uglify';
import babelCore from 'babel-core/register';
import runSequence from 'run-sequence';
import istanbul from 'gulp-istanbul';
import * as isparta from 'isparta';
import del from 'del';
import { spawn } from 'child_process';
import { join } from 'path';

// Clean task
gulp.task('clean', () => {
  return del(['lib', 'docs', 'coverage']);
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
    .pipe(uglify())
    .pipe(gulp.dest('lib'));
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

// Process options for example project
const procOps = {
  cwd: join(__dirname, 'example'),
  stdio: 'inherit'
};

gulp.task('link', done => {
  spawn('npm', ['link'], { stdio: 'inherit' }, done);
});

// 1. Example project link
gulp.task('test:example:link', done => {
  spawn('npm', ['link', 'lambda6'], procOps, done);
});

// 2. Example project install
gulp.task('test:example:install', done => {
  spawn('npm', ['install'], procOps, done);
});

// 2. Example project install
gulp.task('test:example:test', done => {
  spawn('gulp', ['test'], procOps, done);
});

// Test example
gulp.task('test:example', ['link', 'test:example:link', 'test:example:install', 'test:example:test']);

// Docs Task
gulp.task('docs', () => {
  return gulp.src('./src')
    .pipe(esdoc());
});

// Watch Files For Changes
gulp.task('watch', function() {
  return gulp.watch(['./src/**/*.js', './test/**/*.js'], ['test']);
});

// Default Task
gulp.task('default', (callback) => {
  return runSequence('clean', 'test', 'babel', 'test:example');
});
