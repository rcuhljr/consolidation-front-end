'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
	.controller('MyCtrl1', ['$scope', '$routeParams',
		function($scope, $routeParams) {
			$scope.game_id = $routeParams.id;
			$scope.loadData = function() {
				load_data();
			};

		}
	])
	.controller('MyCtrl2', ['$scope', '$http',
		function($scope, $http) {
			$http.get($scope.host_url + "games", {params :{'state':'active'}}).success(function(data) {
				$scope.activeGames = data;
			});

			$http.get($scope.host_url + "games", {params :{'state':'complete'}}).success(function(data) {
				$scope.completeGames = data;
			});
		}
	]);