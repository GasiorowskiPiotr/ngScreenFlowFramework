angular.module('ngScreenFlow.framework').directive('validatorMessage', function() {
  return {
    restrict: 'E',
    scope: false,
    transclude: true,
    template: "<div ng-transclude></div>",
    link: function($scope, iElem, iAttrs) {
      var formName = iAttrs.form;
      var fieldName = iAttrs.field;
      var errorName = iAttrs.error;

      $scope.$watch(formName + '.' +  fieldName + '.$error.' + errorName, function(newValue) {
        if(newValue && ($scope[formName].$submitted || $scope[formName].$touched || $scope[formName].$dirty)) {
          iElem.show();
        } else {
          iElem.hide();
        }
      });
    }
  };
});
