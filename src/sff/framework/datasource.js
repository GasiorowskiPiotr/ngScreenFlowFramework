angular.module('ngScreenFlow.framework').directive('datasource', ['eventDispatcher', '$parse', function(eventDispatcher, $parse) {
  return {
    restrict: 'E',
    scope: false,
    template: '<div></div>',
    link:  function($scope, iElem, iAttrs) {
      var neededDs = iAttrs.refId;
      $scope[neededDs] = { };

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
