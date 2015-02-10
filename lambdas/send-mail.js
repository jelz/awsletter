var ses = new (require('aws-sdk').SES)();

////////////////////////////////////////////////////////////////////////////////

exports.handler = function(e, ctx) {

    log('Received event:'); log(e);

    ses.sendEmail(e, function(err, data) {
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
