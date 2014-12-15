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
          eventDispatcher.dispatch(itemId, 'delete', dsRef);
        });
      });
    }
  };
}]);
