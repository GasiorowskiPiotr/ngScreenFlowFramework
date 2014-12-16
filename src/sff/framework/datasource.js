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
