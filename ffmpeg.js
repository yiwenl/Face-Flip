var ffmpeg = require('fluent-ffmpeg');
var Ffmpeg = (function() {

    function encode(pathNoExt, ext, callback) {
        _encodeMp4(pathNoExt, ext, callback);
    }

    function _encodeMp4(pathNoExt, ext, callback) {
        var path = pathNoExt + ext;
        var output = pathNoExt + '.mp4';
        ffmpeg(path)
            .format('mp4')
            .output(output)
            .on('start', function(cmd) {
                console.log(cmd);
            })
            .on('end', function() {
                encodePoster(pathNoExt, output, callback);
            })
            .run();
    }

    function encodePoster(pathNoExt, videoOutput, callback) {
        var output = pathNoExt + '.jpg';
        ffmpeg(videoOutput)
            .outputOptions('-vf select=\'eq(n,' + 1 + ')\'')
            .outputOptions('-vframes 1')
            .outputOptions('-f image2')
            .output(output)
            .on('start', function(commandLine) {
                console.log(commandLine);
            })
            .on('end', function() {
                callback({
                    videoPath: videoOutput,
                    posterPath: output
                });
            })
            .run();
    }

    return {
        encode: encode,
        encodePoster: encodePoster
    }
})();

module.exports = Ffmpeg;