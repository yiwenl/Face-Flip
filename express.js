var express = require('express');
var _ = require('lodash');
var fs = require('fs');
var ip = require("ip");
var cors = require('cors'); // "Request" library
var ECT = require('ect');
var busboi = require('connect-busboy');
var bodyParser = require('body-parser');
var stream = require('stream');
var io = require('socket.io');

var BufferStream = require('./buffer-stream');
var FFMPEG = require('./Ffmpeg');
var users = {};

var DESTINATION = __dirname + '/videos/';
var PORT = 5678;

var ectRenderer = ECT({
    watch: true,
    root: __dirname + '/views',
    ext: '.ect'
});

var EXPRESS = (function() {

    var server;
    var app = express();

    app.use(cors({
        allowedOrigins: [
            'localhost',
            'app://',
            'app'
        ]
    }));

    app.use(busboi());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));

    app.set('view engine', 'ect');
    app.engine('ect', ectRenderer.render);

    server = app.listen(PORT);
    io = io.listen(server);
    io.on('connection', userConnected);

    console.log("Listening http://" + ip.address() + ":" + PORT);

    app.get('/', function(req, res) {
        res.render('file-upload');
    });

    var videoResponse;
    var videoRequest;

    //*-------------------*/
    //EXPRESS
    /*-------------------*/

    function userConnected(socket) {
        users[socket.id] = socket;

        users[socket.id].emit('handshake', {
            id: users[socket.id].id
        });

        users[socket.id].on('video:poll', function() {});

        console.log(users[socket.id]['id'], "connected!");
    }



    /*-------------------*/
    //GET
    /*-------------------*/

    app.get('/myip', function(req, res) {
        res.send({
            ip: ip.address()
        });
    });

    /*-------------------*/
    //POST
    /*-------------------*/

    app.post('/fileupload', function(req, res) {
        var fstream;
        req.pipe(req.busboy);
        req.busboy.on('file', function(fieldname, file, fullname) {
            var filename = fullname.substring(0, fullname.length - 4);
            var ext = fullname.substring(fullname.length - 4, fullname.length).toLowerCase();
            console.log("Uploading: " + filename, 'to: ', DESTINATION);
            console.log("Uploading: " + ext, 'to: ', DESTINATION);
            var fullPath = DESTINATION + filename + ext;
            console.log(fullPath);
            fstream = fs.createWriteStream(fullPath);
            file.pipe(fstream);
            fstream.on('close', function() {
                if (ext !== '.mp4') {
                    FFMPEG.encode(DESTINATION + filename, ext, emitResponse);
                    //_encodeMp4(DESTINATION + filename, ext);
                } else {
                    FFMPEG.encodePoster(DESTINATION + filename, DESTINATION + filename + ext, emitResponse);
                    //_sendVideoResponse(fullPath);
                }
            });
            res.send({
                status: 'pending upload...'
            });
        });
    });

    function emitResponse(data) {
        var socketId = data['videoPath'].substring(0, data['videoPath'].length - 4).split('/');
        socketId = socketId[socketId.length - 1];
        users[socketId]['data'] = data;
        users[socketId].emit('video:response', {
            res: data
        });
    }

    /*-------------------*/
    //SEND FILES
    /*-------------------*/

    app.get('/socket.io.js', function(req, res, next) {
        res.sendFile(__dirname + '/js/socket.io.js');
    });

    app.get('/file-upload.js', function(req, res, next) {
        res.sendFile(__dirname + '/js/file-upload.js');
    });

    app.get('/file-upload.css', function(req, res, next) {
        res.sendFile(__dirname + '/css/file-upload.css');
    });

    app.get('/myupload', function(req, res, next) {
        res.sendFile(users[req.query.id]['data']['videoPath']);
    });

    app.get('/myposter', function(req, res, next) {
        res.sendFile(users[req.query.id]['data']['posterPath']);
    });

})();

module.exports = EXPRESS;