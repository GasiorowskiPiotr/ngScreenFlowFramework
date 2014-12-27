'use strict';

var app = angular.module('ngScreenFlow.framework', ['evilduck.eventDispatcher']);

angular.module('ngScreenFlow.framework').directive('breezeDataService', ['eventDispatcher', function(eventDispatcher) {
  return {
    restrict: 'E',
    scope: {
      url: '@',
      apiPrefix: '@',
      entity: '@',
      entities: '@',
      refId: '@',
      canCreate: '@?',
      canUpdate: '@?',
      canDelete: '@?'
    },
    template: '<div style="display:none"></div>',
    link: function($scope) {

      var manager = new breeze.EntityManager($scope.url + "" + $scope.apiPrefix);

      var doLoad = function(filterObj) {
        var query = new breeze.EntityQuery().from($scope.entities);

        if (filterObj.toBreezeWhere) {
          var predicates = filterObj.toBreezeWhere();
          if (predicates) {
            query = query.where(predicates);
          }
        }

        if (filterObj.toBreezeOrderBy) {
          var orderBy = filterObj.toBreezeOrderBy();
          if (orderBy) {
            query = query.orderby(orderBy);
          }
        }

        var take = filterObj.take;
        if(!take) {
          take = 20;
        }

        query = query.take(take);

        var skip = filterObj.skip;
        if (!skip) {
          skip = 0;
        }
        query = query.skip(skip).inlineCount();

        return manager.executeQuery(query);
      };

      var doGet = function(id) {
        return manager.fetchEntityByKey($scope.entity, id);
      };

      var doUpdate = function(item) {
        return manager.saveChanges();
      };

      var doCreate = function(item) {
        var entity = manager.createEntity($scope.entity, item);
        manager.addEntity(entity);
        return manager.saveChanges();
      };

      var doDelete = function (id) {
        return doGet(id).then(function(data) {
          data.entity.entityAspect.setDeleted();
          return manager.saveChanges();
        });
      };

      eventDispatcher.ngOn($scope, 'get-items', function(filterObj) {
        return doLoad(filterObj);
      }, $scope.refId);

      eventDispatcher.ngOn($scope, 'get-item', function(id) {
        return doGet(id);
      }, $scope.refId);

      if($scope.canUpdate) {
        eventDispatcher.ngOn($scope, 'save', function (item) {
          return doUpdate(item);
        }, $scope.refId);
      }

      if($scope.canCreate) {
        eventDispatcher.ngOn($scope, 'create', function (item) {
          return doCreate(item);
        }, $scope.refId);

        eventDispatcher.ngOn($scope, 'init-item', function(entityType) {
          return manager.createEntity(entityType);
        });

      }

      if($scope.canDelete) {
        eventDispatcher.ngOn($scope, 'delete', function (item) {
          return doDelete(item);
        }, $scope.refId);
      }
    }
  };
}]);



angular.module('ngScreenFlow.framework').directive('changesStateTo', ['eventDispatcher', '$parse', function(eventDispatcher, $parse) {
  return {
    restrict: 'A',
    scope: false,
    link: function($scope, $iElem, $iAttrs) {
      var nextState = $iAttrs.changesStateTo;

      $iElem.on('click',function() {
        $scope.$apply(function() {
          var value = $parse($iAttrs.changeStateValue)($scope);
          eventDispatcher.dispatch({next: nextState, value: value}, 'state-changed');
        });
      });
    }
  };
}]);

angular.module('ngScreenFlow.framework').directive('createsItemOn', ['eventDispatcher', function(eventDispatcher) {
  return {
    restrict: 'A',
    scope: false,
    link: function($scope, $iElem, $iAttrs) {
      var dsRef = $iAttrs.createsItemOn;

      $iElem.click(function() {
        $scope.$apply(function() {
          var promise = eventDispatcher.dispatch(0, 'ref-create', dsRef);

          if($iAttrs.changeStateOnSuccessTo) {
            var nextState = $iAttrs.changeStateOnSuccessTo;
            promise.then(function() {
              return eventDispatcher.dispatch({next: nextState}, 'state-changed');
            }).catch(function(err) {
              console.log("ERROR!!!");
              console.log(err);
            });
          }
        });
      });
    }
  };
}]);

angular.module('ngScreenFlow.framework').directive('datasource', ['eventDispatcher', '$parse', function(eventDispatcher, $parse) {
  return {
    restrict: 'E',
    scope: false,
    template: '<div></div>',
    link:  function($scope, iElem, iAttrs) {
      var neededDs = iAttrs.refId;
      $scope[neededDs] = { };

      eventDispatcher.ngOn($scope, 'reload', function() {
        eventDispatcher.dispatch({}, 'get-items', neededDs).then(function(data) {
          $scope[neededDs].items = data[0].results;
        });

        if(iAttrs.getItem) {
          var filter = $parse(iAttrs.getItem)($scope);
          var id = filter.Id;
          eventDispatcher.dispatch(id, 'get-item', neededDs).then(function(data) {
            $scope[neededDs].item = data[0].entity;
          });
        }
      }, neededDs);

      if(iAttrs.getItemsOnStart) {
        eventDispatcher.dispatch({}, 'get-items', neededDs).then(function(data) {
          $scope[neededDs].items = data[0].results;
        });
      }

      iAttrs.$observe('getItem', function(newValue) {
        if(newValue) {
          var filter = $parse(newValue)($scope);
          var id = filter.Id;
          eventDispatcher.dispatch(id, 'get-item', neededDs).then(function(data) {
            $scope[neededDs].item = data[0].entity;
          });
        }
      });

      var saveRef;
      iAttrs.$observe('save', function(newValue) {
        if(newValue) {
          saveRef = eventDispatcher.on('ref-save', function() {
            return eventDispatcher.dispatch($scope[neededDs].item, 'save', neededDs);
          }, neededDs);
        } else {
          if(saveRef) {
            saveRef.destoy();
          }
        }
      });

      var createRef;
      iAttrs.$observe('createsNew', function(newValue) {
        if(newValue) {
          var createsNew = $scope[neededDs].item = $parse(newValue)($scope);
          if(createsNew.entity) {
            $scope[neededDs].item = eventDispatcher.dispatch(createsNew.entity, 'init-item', neededDs).then(function(item) {
              $scope[neededDs].item = item;
            });
          } else {
            $scope[neededDs].item = createsNew || { };
          }

          createRef = eventDispatcher.on('ref-create', function() {
            return eventDispatcher.dispatch($scope[neededDs].item, 'create', neededDs);
          }, neededDs);

        } else {
          $scope[neededDs].item = null;

          if(createRef) {
            createRef.destoy();
          }
        }
      });

      $scope.$on('$destroy', function () {
        if(createRef) {
          createRef.destoy();
        }

        if(saveRef) {
          saveRef.destoy();
        }
      })
    }
  };
}]);

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

angular.module('ngScreenFlow.framework').filter('propsFilter', function() {
  return function(items, obj) {
    return _.where(items, obj);
  };
})

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

angular.module('ngScreenFlow.framework').directive('restDataService', ['eventDispatcher', '$q', '$http', function(eventDispatcher, $q, $http) {
  return {
    restrict: 'E',
    scope: {
      url: '@',
      refId: '@',
      canCreate: '@?',
      canUpdate: '@?',
      canDelete: '@?'
    },
    template: '<div style="display:none"></div>',
    link: function($scope) {
      $scope.items = [];

      var doLoad = function(filterObj) {
        //TODO: Build URL
        return $http.get($scope.url + "/" + filterObj.toRestQueryString()).then(function(result) {
          return result.data;
        });
      };

      var doGet = function(id) {
        return $http.get($scope.url).then(function(result) {
          return result.data;
        });
      };

      var doUpdate = function(item) {
        return $http.put($scope.url + '/' + item.Id, item).then(function() {
          return doLoad();
        });
      };

      var doCreate = function(item) {
        return $http.post($scope.url, item).then(function() {
          return doLoad();
        });
      };

      var doDelete = function(item) {
        return $http.delete($scope.url + '/' + item.Id, item).then(function(){
          return doLoad();
        });
      };

      eventDispatcher.ngOn($scope, 'get-items', function(filterObj) {
        return doLoad(filterObj);
      }, $scope.refId);

      eventDispatcher.ngOn($scope, 'get-item', function(id) {
        return doGet(id);
      }, $scope.refId);

      if($scope.canUpdate) {
        eventDispatcher.ngOn($scope, 'save', function (item) {
          return doUpdate(item);
        }, $scope.refId);
      }

      if($scope.canCreate) {
        eventDispatcher.ngOn($scope, 'create', function (item) {
          return doCreate(item);
        }, $scope.refId);

        eventDispatcher.ngOn($scope, 'init-item', function() {
          return { };
        });
      }

      if($scope.canDelete) {
        eventDispatcher.ngOn($scope, 'delete', function (item) {
          return doDelete(item);
        }, $scope.refId);
      }
    }
  };
}]);


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
            }).catch(function(err) {
              console.log("ERROR!!!");
              console.log(err);
            });
          }
        });
      });
    }
  };
}]);

angular.module('ngScreenFlow.framework').directive('screen', ['eventDispatcher', function(eventDispatcher) {
  return {
    restrict: 'E',
    scope: {
      state: '@',
      isInitial: '@'
    },
    priority: 10,
    transclude: true,
    template: '<div style="width: 100%" ng-if="options.isActive" ng-cloak><div ng-transclude></div></div>',
    link: function($scope) {
      $scope.options = {
        isActive: $scope.isInitial
      };

      eventDispatcher.ngOn($scope, 'state-changed', function(stateInfo) {
        if(stateInfo.next === $scope.state) {
          $scope.previous = stateInfo.value;
          $scope.options.isActive = true;
        } else {
          $scope.options.isActive = false;
        }
      });
    }
  };
}]);

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

angular.module('ngScreenFlow.framework').directive('validatorMessage', function() {
  return {
    restrict: 'E',
    scope: false,
    transclude: true,
    replace: true,
    template: '<small class="error" ng-transclude></small>',
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
