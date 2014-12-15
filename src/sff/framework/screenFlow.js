angular.module('ngScreenFlow.framework').directive('screenFlow', [function() {
  return {
    restrict: 'E',
    scope: {
    },
    transclude: true,
    template: '<div style="width: 100%"><div ng-transclude></div></div>',
    link: function() { }
  };
}]);
