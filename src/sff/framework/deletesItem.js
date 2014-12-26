angular.module('ngScreenFlow.framework').directive('deletesItem', ['eventDispatcher',  '$parse', function(eventDispatcher, $parse) {
  return {
    restrict: 'A',
    scope: false,
    link: function($scope, $iElem, $iAttr) {
      var options= $parse($iAttr.deletesItem)($scope);
      var dsRef = options.on;
      var itemId = options.id;

      $iElem.click(function() {
        $scope.$apply(function() {
          var promise = eventDispatcher.dispatch(itemId, 'delete', dsRef);

          if($iAttr.changeStateOnSuccessTo) {
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
