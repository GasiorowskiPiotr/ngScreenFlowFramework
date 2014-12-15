angular.module('ngScreenFlow.framework').directive('screen', ['eventDispatcher', function(eventDispatcher) {
  return {
    restrict: 'E',
    scope: {
      state: '@',
      isInitial: '@'
    },
    priority: 10,
    transclude: true,
    template: '<div style="width: 100%" ng-if="options.isActive" ng-cloak><div ng-transclude></div></div>',
    link: function($scope) {
      $scope.options = {
        isActive: $scope.isInitial
      };

      eventDispatcher.ngOn($scope, 'state-changed', function(stateInfo) {
        if(stateInfo.next === $scope.state) {
          $scope.previous = stateInfo.value;
          $scope.options.isActive = true;
        } else {
          $scope.options.isActive = false;
        }
      });
    }
  };
}]);
