(function() {
    var steps = 0;
    var STEPS_REQUIRED = 2;

    window.onAmazonLoginReady = tryToStartApp;
    angular.element(document).ready(tryToStartApp);

    function tryToStartApp() {
        steps += 1;

        if (steps === STEPS_REQUIRED) {
            angular.bootstrap(document, ['awsletter']);
        }
    }
}());

window.AWSLETTER = angular.module('awsletter', ['ngRoute']);
window.AWSLETTER.constant('CONFIG', window.AWSLETTER_CONFIG);

window.AWSLETTER.controller('NavCtrl', function($scope, AmazonLogin) {
    $scope.isLogged = AmazonLogin.isLogged();
    $scope.profile = AmazonLogin.getProfile();
    $scope.logout = AmazonLogin.logout;

    $scope.$on('amazon:login', function(e, profile) {
        $scope.isLogged = true;
        $scope.profile = profile;

    });
});

window.AWSLETTER.directive('awsletterLoader', function($rootScope) {
    var TPL = [
        '<div>',
            '<div id="loader-overlay" data-ng-show="visible">',
                '<div class="spinner"></div>',
                '<div class="loader-progress" data-ng-show="progress.goal > 0">',
                    '<span data-ng-bind="progress.current"></span> / ',
                    '<span data-ng-bind="progress.goal"></span>',
                '</div>',
            '</div>',
        '</div>'
    ].join('');

    return {
        restrict: 'A',
        replace: true,
        template: TPL,
        scope: true,
        link: link
    };

    function link($scope) {
        $scope.visible = false;
        $scope.progress = { current: 0, goal: 0 };

        $rootScope.$on('loader:show', function (e, opts) {
            $scope.visible = true;
            if (angular.isObject(opts) && opts.progress) {
                $scope.progress = {current: 0, goal: opts.progress};
            }
        });

        $rootScope.$on('loader:hide', function () {
            $scope.visible = false;
            $scope.progress = { current: 0, goal: 0 };
        });

        $rootScope.$on('loader:progress', function () {
            if ($scope.progress.goal > 0) {
                $scope.progress.current += 1;
            }
        });
    }
});
