'use strict';

/**
 * @ngdoc overview
 * @name stockMarketApp
 * @description
 * # stockMarketApp
 *
 * Main module of the application.
 */

/*global io*/


var socket = io();  

angular
  .module('stockMarketApp', [
    'ngRoute',
    'chart.js'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'angular-views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/about', {
        templateUrl: 'angular-views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .otherwise({
        redirectTo: '/'
      });
  });