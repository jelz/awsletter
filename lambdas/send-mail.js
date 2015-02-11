var ses = new (require('aws-sdk').SES)();

////////////////////////////////////////////////////////////////////////////////

exports.handler = function(e, ctx) {
    var params = prepareParams(e);

    log('Received event:'); log(params);

    if (!params) {
        return ctx.done('Invalid params provided. Finished with error.');
    }

    ses.sendEmail(params, function(err, data) {
        if (err) {
            log('SES error:'); log(err);
            ctx.done('Finished with error.');
        } else {
            log('SES response:'); log(data);
            log('Finished w/o error.');
            ctx.done(null);
        }
    });
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
