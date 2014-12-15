angular.module('ngScreenFlow.framework').filter('propsFilter', function() {
  return function(items, obj) {
    return _.where(items, obj);
  };
})
