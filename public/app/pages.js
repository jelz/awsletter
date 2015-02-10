window.AWSLETTER.controller('HomeCtrl', function($scope, $location, AmazonLogin) {
    if (AmazonLogin.isLogged()) { redirect(); }

    $scope.login = function() {
        AmazonLogin.authorize().then(redirect, error);
    };

    function redirect() { $location.path('/compose'); }
    function error() { $location.path('/error'); }
});

window.AWSLETTER.controller('ComposeCtrl', function(
    $scope, $rootScope, $location, GlobalStack, LocalStore, RecipientRepo, Dispatcher
) {
    var store = LocalStore.getInstance('awsletter');

    restoreMessage();
    RecipientRepo.count().then(function(n) { $scope.recipientCount = n; });
    $scope.$watch('message', function() { shorten(); storeMessage(); }, true);
    $scope.dispatch = dispatch;
    $scope.reset = function() {
        if (window.confirm('Are you sure?')) { resetMessage(); }
    };

    function resetMessage() { $scope.message = { topic: '', top: '', preheader: '', content: '' }; }
    function storeMessage() { store.save('msg', $scope.message); }
    function shorten() {
        $scope.message.topic = $scope.message.topic.substr(0, 50);
        $scope.message.preheader = $scope.message.preheader.substr(0, 50);
    }

    function restoreMessage() {
        if (store.has('msg')) {
            $scope.message = store.read('msg');
        } else { resetMessage(); }

        if (GlobalStack.size() > 0) { $scope.message.top = GlobalStack.pop(); }
    }

    function dispatch() {
        if (window.confirm('Sure? ' + $scope.recipientCount + ' mails will be sent.')) {
            showLoader();
            Dispatcher.dispatch($scope.message).
                then(success, error).
                finally(hideLoader);
        }
    }

    function error() { $location.path('/error'); }
    function success(result) {
        GlobalStack.push($scope.message);
        GlobalStack.push(result);
        $location.path('/summary');
    }
    function showLoader() {
        $rootScope.$emit('loader:show', { progress: $scope.recipientCount });
    }
    function hideLoader() { $rootScope.$emit('loader:hide'); }
});

window.AWSLETTER.controller('SummaryCtrl', function($scope, $location, GlobalStack) {
    if (GlobalStack.size() < 2) { return $location.path('/home'); }

    $scope.result = GlobalStack.pop();
    $scope.message = GlobalStack.pop();
});

window.AWSLETTER.controller('ImagesCtrl', function(
    $scope, $rootScope, $location, GlobalStack, ImageRepo
) {
    $scope.images = [];
    $scope.loading = true;

    reload();

    $scope.upload = function() {
        showLoader();
        ImageRepo.upload('file-picker').
            then(waitForImage).
            then(reload).
            catch(handleUploadError).
            finally(hideLoader);
    };

    $scope.remove = function(key) {
        showLoader();
        ImageRepo.remove(key).
            then(reload, error).
            finally(hideLoader);
    };

    $scope.useAsTop = function(url) {
        GlobalStack.push(url);
        $location.path('/compose');
    };

    function reload() {
        return ImageRepo.list().then(function(images) {
            $scope.images = images;
            $scope.loading = false;
        }, error).finally(hideLoader);
    }

    function waitForImage(resizedKey) { return ImageRepo.waitFor(resizedKey); }
    function handleUploadError(err) {
        if (err.type === 'client') { window.alert(err.msg); } else { error(); }
    }
    function error() { $location.path('/error'); }
    function showLoader() { $rootScope.$emit('loader:show'); }
    function hideLoader() { $rootScope.$emit('loader:hide'); }
});

window.AWSLETTER.controller('RecipientsCtrl', function($scope, RecipientRepo) {
    $scope.recipients = [];
    $scope.loading = true;

    RecipientRepo.list().then(function(items) {
        $scope.recipients = items;
        $scope.loading = false;
    });
});
