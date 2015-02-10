window.AWSLETTER.factory('MailTemplate', function() {
    return {

    };
});

window.AWSLETTER.factory('MailSender', function(
    $log, $rootScope, $q, $timeout, AWSHelper, CONFIG
) {
    var lambda = AWSHelper.createInstance('Lambda', {
        params: { FunctionName: CONFIG.aws.mailFunctionName }
    });

    return {
        send: send,
        sendMultiple: sendMultiple
    };

    function send(message) {
        var d = $q.defer();
        var params = { InvokeArgs: JSON.stringify(message) };

        if (CONFIG.disableDelivery) {
            d.resolve(true);
            $log.debug('MailSender.send: delivery disabled');
        } else {
            lambda.invokeAsync(params, function(err, data) {
                if (err) { return d.reject(err); }
                d.resolve(data);
            });
        }

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

window.AWSLETTER.factory('SMSSender', function($log, $q, AWSHelper, CONFIG) {
    var lambda = AWSHelper.createInstance('Lambda', {
        params: { FunctionName: CONFIG.aws.smsFunctionName }
    });

    return {
        send: send,
        sendNotification: sendNotification
    };

    function send(message) {
        var d = $q.defer();
        var params = { InvokeArgs: JSON.stringify(message) };

        if (CONFIG.disableDelivery) {
            d.resolve(true);
            $log.debug('SMSSender.send: delivery disabled');
        } else {
            lambda.invokeAsync(params, function (err, data) {
                if (err) { return d.reject(err); }
                d.resolve(data);
            });
        }

        return d.promise;
    }

    function sendNotification(message, result) {
        var content = [
            'awsletter.elzbieciak.pl. ',
            'Dispatch of "' + message.topic + '" message finished. ',
            'Scheduled: ' + result.scheduled + ', ',
            'successful: ' + result.success + ', ',
            'failed: ' + result.error + '.'
        ].join('');

        return send({ to: CONFIG.notificationPhoneNumber, content: content });
    }
});

window.AWSLETTER.factory('Dispatcher', function(RecipientRepo, MailSender, SMSSender) {
    return { dispatch: dispatch };

    function dispatch(msg) {
        return getRecipients().
            then(sendMessages(msg)).
            then(sendNotification(msg));
    }

    function getRecipients() { return RecipientRepo.list(); }

    function sendMessages(msg) {
        return function(recipients) {
            //var messages = prepareMessages(msg, recipients);
            var messages = [ {}, {} ];

            return MailSender.sendMultiple(messages);
        };
    }

    function sendNotification(msg) {
        return function(result) {
            SMSSender.sendNotification(msg, result);

            return result;
        };
    }
});
