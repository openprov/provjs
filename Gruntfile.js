module.exports = function(grunt) {
    'use strict';
    // Project configuration.
    grunt.initConfig({
        jasmine : {
            src : 'prov.js',
            options : {
                specs : 'tests/spec/**/*.js'
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-jasmine');
};
