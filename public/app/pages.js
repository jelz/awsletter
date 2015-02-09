window.AWSLETTER.config(function($routeProvider) {
    $routeProvider.when('/home', {
        templateUrl: 'views/home.html',
        controller: 'HomeCtrl',
        isPublic: true
    });

    $routeProvider.when('/error', {
        templateUrl: 'views/error.html',
        isPublic: true
    });

    $routeProvider.when('/compose', {
        templateUrl: 'views/compose.html',
        controller: 'ComposeCtrl'
    });

    $routeProvider.when('/images', {
        templateUrl: 'views/images.html',
        controller: 'ImagesCtrl'
    });

    $routeProvider.when('/recipients', {
        templateUrl: 'views/recipients.html'
    });

    $routeProvider.otherwise({ redirectTo: '/home' });
});

window.AWSLETTER.controller('NavCtrl', function($scope, AmazonLogin) {
    $scope.isLogged = AmazonLogin.isLogged();
    $scope.profile = AmazonLogin.getProfile();
    $scope.logout = AmazonLogin.logout;

    $scope.$on('amazon:login', function(e, profile) {
        $scope.isLogged = true;
        $scope.profile = profile;

    });
});

window.AWSLETTER.controller('HomeCtrl', function($scope, $location, AmazonLogin) {
    if (AmazonLogin.isLogged()) { redirect(); }

    $scope.login = function() {
        AmazonLogin.authorize().then(redirect, error);
    };

    function redirect() { $location.path('/compose'); }
    function error() { $location.path('/error'); }
});

window.AWSLETTER.controller('ComposeCtrl', function($scope) {
    $scope.message = { topic: '', preheader: '', content: '' };
});

window.AWSLETTER.controller('ImagesCtrl', function($scope, $location, ImageRepo) {
    $scope.images = [];
    $scope.loading = true;

    reload();

    $scope.upload = function() {
        ImageRepo.upload('file-picker').then(function(resizedKey) {
            ImageRepo.waitFor(resizedKey).then(reload);
        }, function(err) {
            if (err.type === 'client') { alert(err.msg); } else { error(); }
        });
    };

    $scope.remove = function(key) {
        ImageRepo.remove(key).then(reload, error);
    };

    function reload() {
        ImageRepo.list().then(function (images) {
            $scope.images = images;
            $scope.loading = false;
        }, error);
    }

    function error() { $location.path('/error'); }
});
