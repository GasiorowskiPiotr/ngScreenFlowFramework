angular.module('ngScreenFlow.framework').directive('screenFlowWrapper', function() {
  return {
    restrict: 'E',
    scope: {
      item: '='
    },
    transclude: true,
    template: '<div style="width: 100%"><div ng-include="item.url"></div></div>',
    link: function($scope) {
    }
  }
});

var evilduck;
(function(ns) {

  var ScreenFlowDefinition = (function(){

    function ScreenFlowDefinition(options) {
      var defaults = {
      };

      options = options || { };

      this.options = $.extend(defaults, options);
      this.name = "";
      this.url = "";
    }

    return ScreenFlowDefinition;

  })();

  ns.ScreenFlowDefinition = ScreenFlowDefinition;

})(evilduck || (evilduck = {}));
