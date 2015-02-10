module.exports = function(g) {

    function readOptionalFile(path) {
        try { return g.file.readJSON(path); } catch(e) {}
        return {};
    }

    function notFound(req, res) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not found');
    }

    g.initConfig({
        pkg: g.file.readJSON('package.json'),
        aws: readOptionalFile('config/aws.json'),

        jshint: {
            app: {
                options: { jshintrc: true },
                src: [
                    'Gruntfile.js',
                    'public/app/*.js',
                    'config/*.js',
                    'lambdas/*.js'
                ]
            }
        },

        connect: {
            serve: {
                options: {
                    port: 8000,
                    keepalive: true,
                    middleware: function(connect) {
                        return [
                            connect.compress(),
                            connect.static('public'),
                            notFound
                        ];
                    }
                }
            }
        },

        s3: {
            options: {
                accessKeyId: "<%= aws.accessKey %>",
                secretAccessKey: "<%= aws.secret %>",
                bucket: "<%= aws.bucket %>",
                region: "<%= aws.region %>",
                sslEnabled: true,
                gzip: true,
                overwrite: true,
                cache: true
            },
            publish: {
                cwd: 'public/',
                src: '**'
            }
        }
    });

    g.loadNpmTasks('grunt-contrib-jshint');
    g.loadNpmTasks('grunt-contrib-connect');
    g.loadNpmTasks('grunt-aws');

    g.registerTask('lint', ['jshint:app']);
    g.registerTask('publish', ['s3:publish']);
    g.registerTask('default', ['connect:serve']);
};
