// Include gulp
import gulp from 'gulp';

// Include plugins
import babel from 'gulp-babel';
import mocha from 'gulp-mocha';
import esdoc from 'gulp-esdoc';
import babelCore from 'babel-core/register';
import runSequence from 'run-sequence';
import istanbul from 'gulp-istanbul';
import * as isparta from 'isparta';
import install from 'gulp-install';
import rename from 'gulp-rename';
import del from 'del';

// Clean task
gulp.task('clean', () => {
  return del(['dist', 'docs', 'coverage']);
});

// Babel Task
gulp.task('babel', () => {
  return gulp.src('./src')
    .pipe(babel())
    .pipe(gulp.dest('dist'));
});

// Istanbul Task
gulp.task('istanbul', () => {
  return gulp.src(['./src/**/*.js'])
    .pipe(istanbul({
      instrumenter: isparta.Instrumenter,
      includeUntested: true
    }))
    .pipe(istanbul.hookRequire());
});

// Test Task
gulp.task('test', ['istanbul'], () => {
  return gulp.src(['./test/**/*.js'])
    .pipe(mocha())
    .pipe(istanbul.writeReports({
      reporters: ['text', 'text-summary', 'html', 'lcov']
    }));
    // .pipe(istanbul.enforceThresholds({ thresholds: { global: 0 } }));
});

// Docs Task
gulp.task('docs', () => {
  gulp.src('./src')
  .pipe(esdoc({
    includes: ['\\.js$'],
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
  gulp.watch('./src/**/*.js', ['test']);
});

// Default Task
gulp.task('default', (callback) => {
  return runSequence(['clean', 'test'], ['babel'], ['npm']);
});
