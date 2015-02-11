////////////////////////////////////////////////////////////////////////////////

var ACCOUNT_SID = '{{twilio_account_sid}}';
var ACCESS_TOKEN = '{{twilio_access_token}}';
var FROM_NUMBER = '+{{from_number}}';

////////////////////////////////////////////////////////////////////////////////

var https = require('https');
var qs = require('querystring');

exports.handler = function(e, ctx) {
    var postData, opts, req;
    var params = prepareParams(e);

    log('Received event:'); log(params);

    if (!params || !isContentValid(params)) {
        return ctx.done('Invalid content.');
    }

    postData = createPostData(params);
    opts = createOptions(postData);
    req = https.request(opts, responseHandler(ctx));

    req.on('error', function(err) {
        log('Twilio request error.'); log(err);
        ctx.done('Finished with error.');
    });

    req.write(postData);
    req.end();
};

////////////////////////////////////////////////////////////////////////////////

function log(d) {
    console.log(typeof d === 'object' ? JSON.stringify(d, null, '  ') : d);
}

function prepareParams(e) {
    try {
        return JSON.parse(JSON.stringify(e), function(k, v) {
            return typeof v === 'string' ? decodeURIComponent(v) : v;
        });
    } catch (ex) { return false; }
}

function isContentValid(e) {
    return (
        e.to && typeof e.to === 'string' && /^\+[0-9]{6,20}$/.test(e.to) &&
        e.content && typeof e.content === 'string' && e.content.length > 0
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
