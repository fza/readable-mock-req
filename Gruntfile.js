'use strict';

/*eslint-disable camelcase */

module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({

    eslint: {
      all: [
        'Gruntfile.js',
        'index.js',
        'lib/**/*.js',
        'test/**/*.js'
      ]
    },

    mocha_istanbul: {
      all: {
        options: {
          check: {
            lines: 100,
            statements: 100,
            branches: 100,
            functions: 100
          },
          root: './lib',
          reportFormats: [
            'lcovonly'
          ]
        },
        src: [
          'test/**/*.spec.js'
        ]
      }
    },

    coveralls: {
      options: {
        force: false
      },
      coverage: {
        src: 'coverage/lcov.info'
      }
    }

  });

  grunt.registerTask('test', [
    'eslint',
    'mocha_istanbul'
  ]);

  grunt.registerTask('default', [
    'test'
  ]);

};
