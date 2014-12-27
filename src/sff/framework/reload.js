angular.module('ngScreenFlow.framework').directive('reload', ['eventDispatcher', function(eventDispatcher){
  return {
    restrict: 'A',
    scope: false,
    link: function($scope, $iElem, $iAttr) {
      var neededDs = $iAttr.reload;
      $iElem.click(function(){
        $scope.$apply(function() {
          eventDispatcher.dispatch(0, 'reload', neededDs);
        });
      });
    }
  }
}]);
