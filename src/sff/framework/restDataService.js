angular.module('ngScreenFlow.framework').directive('restDataService', ['eventDispatcher', '$q', '$http', function(eventDispatcher, $q, $http) {
  return {
    restrict: 'E',
    scope: {
      url: '@',
      refId: '@',
      canCreate: '@?',
      canUpdate: '@?',
      canDelete: '@?'
    },
    template: '<div style="display:none"></div>',
    link: function($scope) {
      $scope.items = [];

      var doLoad = function(filterObj) {
        //TODO: Build URL
        return $http.get($scope.url).then(function(result) {
          return result.data;
        });
      };

      var doGet = function(id) {
        return $http.get($scope.url).then(function(result) {
          return result.data;
        });
      };

      var doUpdate = function(item) {
        return $http.put($scope.url + '/' + item.Id, item).then(function() {
          return doLoad();
        });
      };

      var doCreate = function(item) {
        return $http.post($scope.url, item).then(function() {
          return doLoad();
        });
      };

      var doDelete = function(item) {
        return $http.delete($scope.url + '/' + item.Id, item).then(function(){
          return doLoad();
        });
      };

      eventDispatcher.ngOn($scope, 'get-items', function(filterObj) {
        return doLoad(filterObj);
      }, $scope.refId);

      eventDispatcher.ngOn($scope, 'get-item', function(id) {
        return doGet(id);
      }, $scope.refId);

      if($scope.canUpdate) {
        eventDispatcher.ngOn($scope, 'save', function (item) {
          doUpdate(item);
        }, $scope.refId);
      }

      if($scope.canCreate) {
        eventDispatcher.ngOn($scope, 'create', function (item) {
          doCreate(item);
        }, $scope.refId);
      }

      if($scope.canDelete) {
        eventDispatcher.ngOn($scope, 'delete', function (item) {
          doDelete(item);
        }, $scope.refId);
      }
    }
  };
}]);

