angular.module('ngScreenFlow.framework').directive('changesStateTo', ['eventDispatcher', '$parse', function(eventDispatcher, $parse) {
  return {
    restrict: 'A',
    scope: false,
    link: function($scope, $iElem, $iAttrs) {
      var nextState = $iAttrs.changesStateTo;

      $iElem.on('click',function() {
        $scope.$apply(function() {
          var value = $parse($iAttrs.changeStateValue)($scope);
          eventDispatcher.dispatch({next: nextState, value: value}, 'state-changed');
        });
      });
    }
  };
}]);
