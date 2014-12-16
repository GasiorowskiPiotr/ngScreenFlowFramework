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

  var DataFilter = (function() {
    function DataFilter(filters, orderby, take, skip) {
      this.filters = filters || new Array();
      this.orderby = orderby || new Array();
      this.top = take;
      this.skip = skip;
    }

    DataFilter.prototype.toRestQueryString = function() {

      var qs = "";

      if(this.filters.length > 1) {
        console.warn('Filters with length greater than 1 are not supported.');
      } else if(this.filters.length == 1) {
        var field = this.filters[0].property;
        var oper = this.filters[0].operator;
        var value = this.filters[0].value;

        qs = "filterField=" + field + "&filterOper=" + oper + "&filterValue=" + value;
      }

      if(this.orderBy.length > 1) {
        console.warn('Filters with length greater than 1 are not supported.');
      } else if(this.orderBy.length == 1) {
        var field = this.orderby[0].property;
        var dir = this.orderby[0].direction;

        if(qs.length > 0) {
          qs = qs + '&';
        }

        qs = "orderField=" + field + "&orderDir=" + dir;
      }

      if(this.take > 0) {
        if(qs.length > 0) {
          qs = qs + '&';
        }

        qs = "take=" + this.take;
      }

      if(this.skip > 0) {
        if(qs.length > 0) {
          qs = qs + '&';
        }

        qs = "skip=" + this.skip;
      }

      return qs;
    };

    DataFilter.prototype.toBreezeWhere = function() {

      var Predicate = breeze.Predicate;

      var map = _.map(this.filters, function(f) {
        var prop = f.property;
        var oper = f.operator;
        var val = f.value;

        return Predicate.create(prop, oper, val);
      });

      return _.reduce(_.rest(map), function(f, p) {
        return f.and(p);
      }, _.first(map));
    };

    DataFilter.prototype.toBreezeOrderBy = function() {
      return _.reduce(this.orderby, function(acc, o) {
        var property = o.property;
        var direction = o.direction;

        if(acc.length !== 0) {
          acc = acc + ","
        }
        return acc + property + " " + direction;
      }, "");
    };

  })();

  ns.ScreenFlowDefinition = ScreenFlowDefinition;
  ns.DataFilter = DataFilter;

})(evilduck || (evilduck = {}));
