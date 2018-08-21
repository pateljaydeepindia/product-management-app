const cartController = function($scope, $stateParams, databaseService) {
    $scope.guid = databaseService.guidHandler('load');
    $scope.cart = [];

    getCartContents();

    function getCartContents() {
        databaseService.getFromDatabase(`/api/cart/${$scope.guid}`)
            .then((data) => {
                $scope.cart = data;
            });
    }

    $scope.emptyCartContents = function (){
        localStorage.clear();
        $scope.cart=[];

        databaseService.getFromDatabase(`/api/emptycart/${$scope.guid}`)
            .then(() => {
            });

    }
};

angular.module('myApp')
    .component('myCart', {
        controller: cartController,
        templateUrl: 'app/components/cart/cart.html'
    })
    .config(function($stateProvider) {
        $stateProvider
            .state('cart', {
                url: '/cart',
                component: 'myCart'
            });
    });
