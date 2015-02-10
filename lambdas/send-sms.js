////////////////////////////////////////////////////////////////////////////////

var ACCOUNT_SID = '{{twilio_account_sid}}';
var ACCESS_TOKEN = '{{twilio_access_token}}';
var FROM_NUMBER = '+{{from_number}}';

////////////////////////////////////////////////////////////////////////////////

var https = require('https');
var qs = require('querystring');

exports.handler = function(e, ctx) {
    var postData, opts, req;

    log('Received event:'); log(e);

    if (isContentValid(e)) {
        return ctx.done('Invalid content.');
    }

    postData = createPostData(e);
    opts = createOptions(postData);
    req = https.request(opts, responseHandler(ctx));

    req.on('error', function(e) {
        log('Twilio request error.'); log(e);
        ctx.done('Finished with error.');
    });

    req.write(postData);
    req.end();
};

////////////////////////////////////////////////////////////////////////////////

function log(d) {
    console.log(typeof d === 'object' ? JSON.stringify(d, null, '  ') : d);
}

function isContentValid(e) {
    return (
        !e.content || typeof e.content !== 'string' || e.content.length < 1 ||
        !e.to || typeof e.to !== 'string' || !/^\+[0-9]{6,20}$/.test(e.to)
    );
}

function createPostData(e) {
    return qs.stringify({ To: e.to, From: FROM_NUMBER, Body: e.content });
}

function createOptions(postData) {
    return {
        method: 'POST', hostname: 'api.twilio.com', port: 443,
        path: '/2010-04-01/Accounts/' + ACCOUNT_SID + '/Messages.json',
        auth: ACCOUNT_SID + ':' + ACCESS_TOKEN,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
    };
}

function responseHandler(ctx) {
    return function(res) {
        var responseText = '';

        res.on('data', function(t) { responseText += t; });

        res.on('end', function() {
            log('Twilio response code: ' + res.statusCode);

            if (res.statusCode < 300) {
                log(JSON.parse(responseText));
                log('Finished w/o error.');
                ctx.done(null);
            } else {
                log(responseText);
                ctx.done('Finished with error.');
            }
        });
    };
}
