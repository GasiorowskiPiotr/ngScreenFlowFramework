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
        query = query.skip(skip);

        return manager.executeQuery(query);
      };

      var doGet = function(id) {
        return manager.fetchEntityByKey($scope.entities, id);
      };

      var doUpdate = function(item) {
        manager.saveChanges();
      };

      var doCreate = function(item) {
        var entity = manager.createEntity($scope.entity, item);
        manager.addEntity(entity);
        manager.saveChanges();
      };

      var doDelete = function(item) {
        item.entityAspect.setDeleted();
        manager.saveChanges();
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


