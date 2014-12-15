angular.module('ngScreenFlow.framework').directive('restDataService', ['eventDispatcher', '$q', '$http', function(eventDispatcher, $q, $http) {
  return {
    restrict: 'E',
    scope: {
      url: '@',
      refId: '@',
      canCreate: '@?',
      canUpdate: '@?',
      canDelete: '@?',
      loadOnStart: '@'
    },
    template: '<div style="display:none"></div>',
    link: function($scope) {
      $scope.items = [];

      var doLoad = function() {
        var deferred = $q.defer();
        //TODO: Build URL
        $http.get($scope.url).then(function(result) {

          $scope.items = result.data;

          eventDispatcher.dispatch($scope.items, 'refresh', $scope.refId);

          deferred.resolve(result.data);
        }).catch(function(err) {
          deferred.reject(err);
        });

        return deferred.promise;
      };

      var doSave = function(item) {
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

      eventDispatcher.ngOn($scope, 'load-data', function() {
        return doLoad();
      }, $scope.refId);

      eventDispatcher.ngOn($scope, 'get-items', function() {
        eventDispatcher.dispatch($scope.items, 'got-items');
      }, $scope.refId);

      if($scope.canUpdate) {
        eventDispatcher.ngOn($scope, 'save', function (item) {
          doSave(item);
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

      if($scope.loadOnStart) {
        doLoad();
      }
    }
  };
}]);

