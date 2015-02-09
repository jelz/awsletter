window.AWSLETTER.factory('MailTemplate', function() {
    return {

    };
});

window.AWSLETTER.factory('MailSender', function(
    $rootScope, $q, $timeout, AWSHelper
) {
    var lambda = AWSHelper.createInstance('Lambda', {
        params: { FunctionName: 'awsletter-test' }
    });

    return {
        send: send,
        sendMultiple: sendMultiple
    };

    function send(message) {
        var d = $q.defer();
        var params = { InvokeArgs: JSON.stringify(message) };

        lambda.invokeAsync(params, function(err, data) {
            if (err) { return d.reject(err); }
            d.resolve(data);
        });

        return d.promise;
    }

    function sendMultiple(messages, delay) {
        var d = $q.defer();
        var result = { error: 0, success: 0, scheduled: messages.length };

        messages = angular.copy(messages);
        delay = delay || 250;

        sendNext();

        return d.promise;

        function sendNext() {
            $timeout(function() {
                if (messages.length < 1) { return d.resolve(result); }

                send(messages.shift()).then(success, err).finally(function() {
                    $rootScope.$emit('loader:progress');
                    sendNext();
                });
            }, delay);
        }

        function success() { result.success += 1; }
        function err() { result.error += 1; }
    }
});
