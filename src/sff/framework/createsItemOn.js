angular.module('ngScreenFlow.framework').directive('createsItemOn', ['eventDispatcher', function(eventDispatcher) {
  return {
    restrict: 'A',
    scope: false,
    link: function($scope, $iElem, $iAttrs) {
      var dsRef = $iAttrs.createsItemOn;

      $iElem.click(function() {
        $scope.$apply(function() {
          eventDispatcher.dispatch(0, 'ref-create', dsRef);
        });
      });
    }
  };
}]);
