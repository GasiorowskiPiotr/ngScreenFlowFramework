'use strict';

var app = angular.module('ngScreenFlow.framework', ['evilduck.eventDispatcher']);

app.directive('screenFlow', [function() {
  return {
    restrict: 'E',
    scope: {
    },
    transclude: true,
    template: '<div style="width: 100%"><div ng-transclude></div></div>',
    link: function() {

    }
  };
}]);

app.directive('restDataSource', ['eventDispatcher', '$q', '$http', function(eventDispatcher, $q, $http) {
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

      eventDispatcher.ngOn($scope, 'save', function(item) {
        doSave(item);
      }, $scope.refId);

      eventDispatcher.ngOn($scope, 'create', function(item) {
        doCreate(item);
      }, $scope.refId);

      eventDispatcher.ngOn($scope, 'delete', function(item) {
        doDelete(item);
      }, $scope.refId);

      if($scope.loadOnStart) {
        doLoad();
      }
    }
  };
}]);

app.directive('screen', ['eventDispatcher', function(eventDispatcher) {
  return {
    restrict: 'E',
    scope: {
      state: '@',
      isInitial: '@'
    },
    priority: 10,
    transclude: true,
    template: '<div style="width: 100%" ng-if="isActive"><div ng-transclude></div></div>',
    link: function($scope) {
      $scope.isActive = $scope.isInitial;

      eventDispatcher.ngOn($scope, 'state-changed', function(stateInfo) {
        if(stateInfo.next === $scope.state) {
          $scope.previous = stateInfo.value;
          $scope.isActive = true;
        } else {
          $scope.isActive = false;
        }
      });
    }
  };
}]);

app.directive('ds', ['eventDispatcher', '$parse', function(eventDispatcher, $parse) {
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
      eventDispatcher.dispatch(0, 'get-items', neededDs);

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
            eventDispatcher.dispatch($scope[neededDs].item, 'save', neededDs);
          }, neededDs);
        } else {
          if(saveRef) {
            eventDispatcher.unsubscribe(saveRef, 'ref-save', neededDs);
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
            eventDispatcher.dispatch($scope[neededDs].item, 'create', neededDs);
          }, neededDs);

        } else {
          $scope[neededDs].item = null;

          if(createRef) {
            eventDispatcher.unsubscribe(createRef, 'ref-create', neededDs);
          }
        }
      });
    }
  };
}]);

app.directive('changesStateTo', ['eventDispatcher', '$parse', function(eventDispatcher, $parse) {
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

app.directive('savesItemOn', ['eventDispatcher', function(eventDispatcher) {
  return {
    restrict: 'A',
    scope: false,
    link: function($scope, $iElem, $iAttrs) {
      var dsRef = $iAttrs.savesItemOn;

      $iElem.click(function() {
        $scope.$apply(function() {
          eventDispatcher.dispatch(0, 'ref-save', dsRef);
        });
      });
    }
  };
}]);

app.directive('createsItemOn', ['eventDispatcher', function(eventDispatcher) {
  return {
    restrict: 'A',
    scope: false,
    link: function($scope, $iElem, $iAttrs) {
      var dsRef = $iAttrs.createsItemOn;

      $iElem.click(function() {
        $scope.$apply(function() {
          eventDispatcher.dispatch(0, 'ref-create', dsRef);
        });
      });
    }
  };
}]);

app.directive('deletesItem', ['eventDispatcher',  '$parse', function(eventDispatcher, $parse) {
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

app.directive('enabledIfValidForm', function() {
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

app.directive('validatorMessage', function() {
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

