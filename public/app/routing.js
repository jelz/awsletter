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

    $routeProvider.when('/summary', {
        templateUrl: 'views/summary.html',
        controller: 'SummaryCtrl'
    });

    $routeProvider.when('/images', {
        templateUrl: 'views/images.html',
        controller: 'ImagesCtrl'
    });

    $routeProvider.when('/recipients', {
        templateUrl: 'views/recipients.html',
        controller: 'RecipientsCtrl'
    });

    $routeProvider.otherwise({ redirectTo: '/home' });
});
