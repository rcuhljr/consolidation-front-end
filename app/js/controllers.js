'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('MyCtrl1', ['$scope', function($scope) {
  	$scope.loadData = function(){
  		load_data();
  	};

  }])
  .controller('MyCtrl2', [function() {

  }]);