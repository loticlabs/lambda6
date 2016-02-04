// Include gulp
import gulp from 'gulp';

// Include plugins
import babel from 'gulp-babel';
import mocha from 'gulp-mocha';
import esdoc from 'gulp-esdoc';
import eslint from 'gulp-eslint';
import uglify from 'gulp-uglify';
import sourcemaps from 'gulp-sourcemaps';
import babelCore from 'babel-core/register';
import runSequence from 'run-sequence';
import istanbul from 'gulp-istanbul';
import * as isparta from 'isparta';
import del from 'del';
import { spawn } from 'child_process';
import { join } from 'path';
import Promise from 'bluebird';

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
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
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

// Test example
gulp.task('test:example', done => {
  // Process options for example project
  const procOps = {
    cwd: join(__dirname, 'example'),
    stdio: 'inherit'
  };
  function _spawn(...args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(...args);
      proc.on('exit', (code, signal) => {
        if (code !== 0) {
          reject(`code: ${code}, signal: ${signal}`);
        }
        resolve();
      });
      proc.on('error', reject);
    });
  }
  const linkNpmPart1 = () => _spawn('npm', ['link'], { stdio: 'inherit' });
  const linkNpmPart2 = () => _spawn('npm', ['link', 'lambda6'], procOps);
  const npmInstall = () => _spawn('npm', ['install'], procOps);
  const gulpTest = () => _spawn('gulp', ['test'], procOps);
  // Run the series of promises
  linkNpmPart1().then(linkNpmPart2).then(npmInstall).then(gulpTest).then(() => done()).catch(done);
});

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
