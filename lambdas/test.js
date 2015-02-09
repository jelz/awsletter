exports.handler = function(e, ctx) {
    console.log('Received event:');
    console.log(JSON.stringify(e, null, '  '));
    ctx.done(null);
};
