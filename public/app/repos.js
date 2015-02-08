window.AWSLETTER.factory('ImageRepo', function($q, $timeout, AWSHelper, CONFIG) {

    var TYPE = 'image/jpeg';
    var BUCKET = CONFIG.aws.imagesBucket;
    var REGION = CONFIG.aws.region;

    var S3 = AWSHelper.createInstance('S3', { params: { Bucket: BUCKET } });
    var T_COMPARATOR = function(a, b) { return b.t - a.t; };

    return {
        list: list,
        upload: upload,
        remove: remove,
        waitFor: waitFor
    };

    function list() {
        var d = $q.defer();
        var result = [];

        S3.listObjects(function(err, res) {
            if (err) { return d.reject(err); }

            angular.forEach(res.Contents, function(item) {
                if (!/^uploaded-.+\.jpg$/.test(item.Key)) {
                    result.push({
                        key: item.Key,
                        url: getFileUrl(item.Key),
                        t: item.LastModified.getTime()
                    });
                }
            });

            result.sort(T_COMPARATOR);
            d.resolve(result);
        });

        return d.promise;
    }

    function upload(id) {
        var filePicker = document.getElementById(id);
        var d = $q.defer();
        var file, params;

        if (!filePicker || !filePicker.files || !filePicker.files[0]) {
            return clientError(d, 'No file selected.');
        }

        file = filePicker.files[0];
        params = { Key: filename(), ContentType: TYPE, Body: file };

        if (file.type.toLowerCase() !== TYPE) {
            return clientError(d, 'Invalid file format.');
        }

        S3.upload(params, function(err) {
            if (err) { return d.reject(err); }
            d.resolve(params.Key.replace(/^uploaded-/, ''));
        });

        return d.promise;
    }

    function remove(key) {
        var d = $q.defer();

        S3.deleteObject({ Key: key }, function(err) {
            if (err) { return d.reject(err); }
            d.resolve(true);
        });

        return d.promise;
    }

    function waitFor(key, d) {
        d = d || $q.defer();

        $timeout(function() {
            checkFile(key, function (exists) {
                if (exists) { return d.resolve(key); }
                waitFor(key, d);
            });
        }, 750);

        return d.promise;
    }

    function checkFile(key, cb) {
        S3.getObject({ Key: key }, function (err) {
            if (err) { cb(false); } else { cb(true); }
        });
    }

    function getFileUrl(key) {
        return 'http://s3-' + REGION + '.amazonaws.com/' + BUCKET + '/' + key;
    }

    function guid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0;
            var v = c === 'x' ? r : (r&0x3|0x8);

            return v.toString(16);
        });
    }

    function filename() {
        return 'uploaded-' + guid() + '.jpg';
    }

    function clientError(d, msg) {
        d.reject({ msg: msg, type: 'client' });

        return d.promise;
    }
});
