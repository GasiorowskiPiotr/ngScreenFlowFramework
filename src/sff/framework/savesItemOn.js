angular.module('ngScreenFlow.framework').directive('savesItemOn', ['eventDispatcher', function(eventDispatcher) {
  return {
    restrict: 'A',
    scope: false,
    link: function($scope, $iElem, $iAttrs) {
      var dsRef = $iAttrs.savesItemOn;

      $iElem.click(function() {
        $scope.$apply(function() {
          eventDispatcher.dispatch(0, 'ref-save', dsRef);
        });
      });
    }
  };
}]);
