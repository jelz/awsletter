window.AWSLETTER.factory('LoginWithAmazon', function(CONFIG) {
    var AMAZON_LOGIN = window.amazon.Login;

    AMAZON_LOGIN.setClientId(CONFIG.amazonLogin.clientId);

    return AMAZON_LOGIN;
});

window.AWSLETTER.factory('AWSHelper', function() {
    var AWS = window.AWS;

    return {
        getGlobalObject: function() { return AWS; },
        createInstance: createInstance,
        getInstance: undefined
    };

    function createInstance(serviceName, params) {
        return new AWS[serviceName](params);
    }
});

window.AWSLETTER.factory('AmazonLogin', function(
    $rootScope, $q, LoginWithAmazon, AWSHelper, LocalStore, CONFIG
) {

    var store = LocalStore.create('awsletter');
    var AWS = AWSHelper.getGlobalObject();

    if (isLogged()) { finalizeLogin(); }

    return {
        authorize: authorize,
        logout: logout,
        isLogged: isLogged,
        getProfile: getProfile
    };

    function authorize() {
        var d = $q.defer();
        var token;

        LoginWithAmazon.authorize({ scope: 'profile' }, function(res) {
            if (!res || res.error || !res.access_token) {
                return d.reject({ msg: 'Auth response error.' });
            }

            token = res.access_token;

            LoginWithAmazon.retrieveProfile(token, function(res) {
                if (!res || res.error || !res.profile) {
                    return d.reject({ msg: 'Profile response error.' });
                }

                store.save('token', token);
                store.save('profile', {
                    mail: res.profile.PrimaryEmail,
                    name: res.profile.Name
                });

                finalizeLogin();
                d.resolve(res);
            });
        });

        return d.promise;
    }

    function finalizeLogin() {
        configureAWS();
        $rootScope.$broadcast('amazon:login', getProfile());
    }

    function isLogged() {
        return !!readToken();
    }

    function logout() {
        LoginWithAmazon.logout();
        $rootScope.$broadcast('amazon:logout');
        forgetLogin();
        deconfigureAWS();
    }

    function readToken() {
        return store.read('token');
    }

    function getProfile() {
        return store.read('profile');
    }

    function forgetLogin() {
        store.remove('token');
        store.remove('profile');
    }

    function configureAWS() {
        AWS.config.region = CONFIG.aws.region;
        AWS.config.credentials = AWSHelper.createInstance('WebIdentityCredentials', {
            RoleArn: CONFIG.aws.roleArn,
            ProviderId: 'www.amazon.com',
            WebIdentityToken: readToken()
        });
    }

    function deconfigureAWS() {
        delete AWS.config.region;
        delete AWS.config.credentials;
    }
});

window.AWSLETTER.run(function($rootScope, $location, AmazonLogin) {
    $rootScope.$on('$routeChangeStart', function(e, next) {
        if (!AmazonLogin.isLogged() && !next.isPublic) {
            e.preventDefault();
            $rootScope.$evalAsync(redirect('home'));
        }
    });

    $rootScope.$on('amazon:login', redirect('compose'));
    $rootScope.$on('amazon:logout', redirect('home'));

    function redirect(page) {
        return function () { $location.path('/' + page); };
    }
});
