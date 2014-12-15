angular.module('ngScreenFlow.framework').directive('screen', ['eventDispatcher', function(eventDispatcher) {
  return {
    restrict: 'E',
    scope: {
      state: '@',
      isInitial: '@'
    },
    priority: 10,
    transclude: true,
    template: '<div style="width: 100%" ng-if="isActive"><div ng-transclude></div></div>',
    link: function($scope) {
      $scope.isActive = $scope.isInitial;

      eventDispatcher.ngOn($scope, 'state-changed', function(stateInfo) {
        if(stateInfo.next === $scope.state) {
          $scope.previous = stateInfo.value;
          $scope.isActive = true;
        } else {
          $scope.isActive = false;
        }
      });
    }
  };
}]);
