window.AWSLETTER = angular.module('awsletter', ['ngRoute']);
window.AWSLETTER.constant('CONFIG', window.AWSLETTER_CONFIG);

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
