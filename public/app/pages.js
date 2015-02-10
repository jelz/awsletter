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
        templateUrl: 'views/recipients.html',
        controller: 'RecipientsCtrl'
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

window.AWSLETTER.controller('LoaderCtrl', function($scope, $rootScope) {
    $scope.visible = false;
    $scope.progress = { current: 0, goal: 0 };

    $rootScope.$on('loader:show', function(e, opts) {
        $scope.visible = true;
        if (angular.isObject(opts) && opts.progress) {
            $scope.progress = { current: 0, goal: opts.progress };
        }
    });

    $rootScope.$on('loader:hide', function() {
        $scope.visible = false;
        $scope.progress = { current: 0, goal: 0 };
    });

    $rootScope.$on('loader:progress', function() {
        if ($scope.progress.goal > 0) {
            $scope.progress.current += 1;
        }
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

window.AWSLETTER.controller('ComposeCtrl', function(
    $scope, $timeout, GlobalStack, LocalStore, RecipientRepo, MailSender
) {
    var store = LocalStore.getInstance('awsletter');

    restoreMessage();
    RecipientRepo.count().then(function(n) { $scope.recipientCount = n; });
    $scope.$watch('message', function() { shorten(); storeMessage(); }, true);

    $scope.reset = function() {
        if (window.confirm('Are you sure?')) { resetMessage(); }
    };

    $scope.dispatch = function() {
        var t = [ {}, {}, {} ];

        $scope.$emit('loader:show', { progress: t.length });
        MailSender.sendMultiple(t).then(function() {
            console.log(arguments);
            $scope.$emit('loader:hide');
        });
    };

    function resetMessage() {
        $scope.message = { topic: '', top: '', preheader: '', content: '' };
    }

    function restoreMessage() {
        if (store.has('msg')) {
            $scope.message = store.read('msg');
        } else { resetMessage(); }

        if (GlobalStack.size() > 0) { $scope.message.top = GlobalStack.pop(); }
    }

    function storeMessage() { store.save('msg', $scope.message); }

    function shorten() {
        $scope.message.topic = $scope.message.topic.substr(0, 50);
        $scope.message.preheader = $scope.message.preheader.substr(0, 50);
    }
});

window.AWSLETTER.controller('ImagesCtrl', function($scope, $location, GlobalStack, ImageRepo) {
    $scope.images = [];
    $scope.loading = true;

    reload();

    $scope.upload = function() {
        $scope.$emit('loader:show');
        ImageRepo.upload('file-picker').then(function(resizedKey) {
            ImageRepo.waitFor(resizedKey).then(reload);
        }, function(err) {
            if (err.type === 'client') {
                window.alert(err.msg);
                $scope.$emit('loader:hide');
            } else { error(); }
        });
    };

    $scope.remove = function(key) {
        $scope.$emit('loader:show');
        ImageRepo.remove(key).then(reload, error);
    };

    $scope.useAsTop = function(url) {
        GlobalStack.push(url);
        $location.path('/compose');
    };

    function reload() {
        ImageRepo.list().then(function (images) {
            $scope.images = images;
            $scope.loading = false;
            $scope.$emit('loader:hide');
        }, error);
    }

    function error() {
        $location.path('/error');
        $scope.$emit('loader:hide');
    }
});

window.AWSLETTER.controller('RecipientsCtrl', function($scope, RecipientRepo) {
    $scope.recipients = [];
    $scope.loading = true;

    RecipientRepo.list().then(function(items) {
        $scope.recipients = items;
        $scope.loading = false;
    });
});
