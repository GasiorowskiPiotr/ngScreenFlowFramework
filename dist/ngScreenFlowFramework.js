'use strict';

var app = angular.module('ngScreenFlow.framework', ['evilduck.eventDispatcher']);

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

      eventDispatcher.ngOn($scope, 'got-items', function(data) {
        $scope[neededDs].items = data;
      });

      if(iAttrs.getItemsOnStart) {
        eventDispatcher.dispatch(0, 'get-items', neededDs);
      }

      eventDispatcher.ngOn($scope, 'refresh', function(data) {
        $scope[neededDs].items = data;
      }, neededDs);

      iAttrs.$observe('item', function(newValue) {
        if(newValue) {
          var filter = $parse(newValue)($scope);
          $scope[neededDs].item = _.findWhere($scope[neededDs].items, filter);
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
          if(newValue === true || newValue === 'true') {
            $scope[neededDs].item = { };
          } else {
            $scope[neededDs].item = $parse(newValue)($scope);
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

          if($iAttrs.changeStateOnSuccessTo) {
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

angular.module('ngScreenFlow.framework').directive('restDataService', ['eventDispatcher', '$q', '$http', function(eventDispatcher, $q, $http) {
  return {
    restrict: 'E',
    scope: {
      url: '@',
      refId: '@',
      canCreate: '@?',
      canUpdate: '@?',
      canDelete: '@?',
      loadOnStart: '@'
    },
    template: '<div style="display:none"></div>',
    link: function($scope) {
      $scope.items = [];

      var doLoad = function() {
        var deferred = $q.defer();
        //TODO: Build URL
        $http.get($scope.url).then(function(result) {

          $scope.items = result.data;

          eventDispatcher.dispatch($scope.items, 'refresh', $scope.refId);

          deferred.resolve(result.data);
        }).catch(function(err) {
          deferred.reject(err);
        });

        return deferred.promise;
      };

      var doSave = function(item) {
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

      eventDispatcher.ngOn($scope, 'load-data', function() {
        return doLoad();
      }, $scope.refId);

      eventDispatcher.ngOn($scope, 'get-items', function() {
        eventDispatcher.dispatch($scope.items, 'got-items');
      }, $scope.refId);

      if($scope.canUpdate) {
        eventDispatcher.ngOn($scope, 'save', function (item) {
          return doSave(item);
        }, $scope.refId);
      }

      if($scope.canCreate) {
        eventDispatcher.ngOn($scope, 'create', function (item) {
          return doCreate(item);
        }, $scope.refId);
      }

      if($scope.canDelete) {
        eventDispatcher.ngOn($scope, 'delete', function (item) {
          return doDelete(item);
        }, $scope.refId);
      }

      if($scope.loadOnStart) {
        doLoad();
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

  ns.ScreenFlowDefinition = ScreenFlowDefinition;

})(evilduck || (evilduck = {}));

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
