angular.module('ngScreenFlow.framework').directive('savesItemOn', ['eventDispatcher', function(eventDispatcher) {
  return {
    restrict: 'A',
    scope: false,
    link: function($scope, $iElem, $iAttrs) {
      var dsRef = $iAttrs.savesItemOn;

      $iElem.click(function() {
        $scope.$apply(function() {
          var promise = eventDispatcher.dispatch(0, 'ref-save', dsRef);
          if($iAttrs.changeStateOnSuccessTo) {
            var nextState = $iAttrs.changeStateOnSuccessTo;
            promise.then(function() {
              return eventDispatcher.dispatch({next: nextState}, 'state-changed');
            });
          }
        });
      });
    }
  };
}]);
