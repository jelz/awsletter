window.AWSLETTER.factory('MailBuilder', function(Mail) {
    return {
        build: build,
        buildMultiple: buildMultiple
    };

    function build(message, recipient) {
        var topic = (message.topic || '(no topic)');
        var body = prepareBody(message, recipient);

        return {
            Source: 'awsletter <awsletter@elzbieciak.pl>',
            Destination: { ToAddresses: [ recipient.mail ] },
            Message: {
                Subject: { Data: topic, Charset: 'utf-8' },
                Body: { Html: { Data: body, Charset: 'utf-8' } }
            }
        };
    }

    function buildMultiple(message, recipients) {
        var result = [];

        angular.forEach(recipients, function(recipient) {
            result.push(build(message, recipient));
        });

        return result;
    }

    function prepareBody(message, recipient) {
        return Mail.createInstance(message, recipient).getHTML();
    }
});

// @todo - refactor this - worst implementation ever
window.AWSLETTER.factory('Mail', function() {
    return { createInstance: createInstance };

    function createInstance(message, recipient) {
        var html = [];

        addStart();
        addPreheader();
        addContainer();
        addHeader();
        addTop();
        addContent();
        addUnsubscribeLink();
        addEnding();

        return { getHTML: function() { return html.join(''); } };

        function addStart() {
            html.push('<html><body style="background: #f5f5f5; padding: 30px;">');
        }

        function addPreheader() {
            if (message.preheader.length > 0) {
                html.push('<span style="display: none !important; visibility: hidden; ');
                html.push('opacity: 0; color: transparent; height: 0; width: 0;">');
                html.push(message.preheader + '</span>');
            }
        }

        function addContainer() {
            html.push('<div style="width: 400px; border: 1px solid #d8d8d8; ');
            html.push('background: #fff; font-family: sans-serif !important;">');
        }

        function addHeader() {
            if (message.topic.length > 0) {
                html.push('<h1 style="margin: 0; padding: 20px;">' + message.topic + '</h1>');
            }
        }

        function addTop() {
            if (/https?:\/\/.{3,200}\.jpg/.test(message.top)) {
                html.push('<img src="' + message.top + '" style="display: block;">');
            }
        }

        function addContent() {
            var content = prepareContent(message.content, recipient);

            html.push('<div style="padding: 20px;">' + content + '</div>');
        }

        function addUnsubscribeLink() {
            html.push('<div style="padding: 10px; font-size: 11px; ');
            html.push('text-align: right; border-top: 1px dashed #d8d8d8;">');
            html.push('<a target="_blank" href="http://awsletter.elzbieciak.pl/unsub/');
            html.push(recipient.token + '">Click to unsubscribe</a></div>');
        }

        function addEnding() {
            html.push('</div></body></html>');
        }
    }

    function prepareContent(content, recipient) {
        content = content.replace(/(?:\r\n|\r|\n)/g, '<br>');
        content = content.replace('{{first_name}}', recipient.first_name || '');
        content = content.replace('{{last_name}}', recipient.last_name || '');

        return content;
    }
});
