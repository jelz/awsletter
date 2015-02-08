////////////////////////////////////////////////////////////////////////////////

var THUMBNAIL_WIDTH = 400;

////////////////////////////////////////////////////////////////////////////////

var S3_INSTANCE = null;

exports.handler = function(e, ctx) {

    log('Received event:'); log(e);

    if (!isValidImage(e)) {
        log('Skipping event - not a valid, uploaded image.');

        return finalize(ctx);
    }

    getObject(e, function(err, image) {
        if (err) { return handleError(err, 'aws.s3.getObject', ctx); }

        resize(image, function(err, resized) {
            if (err) { return handleError(err, 'imagemagick.resize', ctx); }

            putObject(e, resized, function(err) {
                if (err) { return handleError(err, 'aws.s3.putObject', ctx); }

                deleteObject(e, function(err) {
                    if (err) { return handleError(err, 'aws.s3.deleteObject', ctx); }

                    return finalize(ctx);
                });
            });
        });
    });

};

////////////////////////////////////////////////////////////////////////////////

function S3() {
    if (!S3_INSTANCE) { S3_INSTANCE = new (require('aws-sdk').S3)(); }

    return S3_INSTANCE;
}

function log(d) {
    console.log(typeof d === 'object' ? JSON.stringify(d, null, '  ') : d);
}

function handleError(err, where, ctx) {
    log('Error' + (where ? (' in ' + where) : '') + ':'); log(err);
    if (ctx) { ctx.done('Finished with error.'); }
}

function finalize(ctx) {
    log('Finished w/o error.');
    if (ctx) { ctx.done(null); }
}

function isValidImage(e) {
    if (e && e.Records && e.Records.length && e.Records[0].s3) {
        e = e.Records[0].s3;

        if (e.bucket && e.bucket.name && e.object && e.object.key) {
            return /^uploaded-.+\.jpg$/.test(e.object.key);
        }
    }

    return false;
}

function createBaseParams(e) {
    e = e.Records[0].s3;

    return { Bucket: e.bucket.name, Key: e.object.key };
}

function createPutParams(e, body) {
    var params = createBaseParams(e);

    params.ContentType = 'image/jpeg';
    params.Key = params.Key.replace(/^uploaded-/, '');
    params.Body = body;
    params.ACL = 'public-read';

    return params;
}

function resize(data, cb) {
    require('imagemagick').resize({
        srcData: data,
        width: THUMBNAIL_WIDTH
    }, function(err, out) {
        if (err) { return cb(err); }
        cb(null, new Buffer(out, 'binary'));
    });
}

function getObject(e, cb) {
    S3().getObject(createBaseParams(e), function(err, obj) {
        if (err) { return cb(err); }
        cb(null, obj.Body);
    });
}

function putObject(e, body, cb) {
    S3().putObject(createPutParams(e, body), cb);
}

function deleteObject(e, cb) {
    S3().deleteObject(createBaseParams(e), cb);
}
