angular.module('ngScreenFlow.framework').directive('enabledIfValidForm', function() {
  return {
    restrict: 'A',
    scope: false,
    link: function($scope, iElem, iAttrs) {
      var formName = iAttrs.enabledIfValidForm;

      $scope.$watch(formName + '.$valid', function(newValue) {
        if(newValue) {
          iElem[0].disabled = false;
          iElem.prop('disabled', false)
        } else {
          iElem[0].disabled = true;
          iElem.prop('disabled', true);
        }
      });
    }
  }
});
