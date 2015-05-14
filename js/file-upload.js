function FileUpload() {
    var PORT = 5678;
    var SOCKET = undefined;
    var textEl = document.getElementById('fileUpload');
    var inputEl = document.getElementById('fileInput');
    var _socketId = undefined;
    var isClicked = false;

    _getIp();

    function _getIp() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/myip', true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.addEventListener('readystatechange', function(e) {
            if (this.readyState === 4) {
                var res = JSON.parse(e.target.response);
                console.log(res);
                _init(res['ip']);
            }
        });
        xhr.send();
    }

    function _init(ip) {
        SOCKET = io('http://' + ip + ':' + PORT);
        _addSocketListeners();
        _startVideoPoll();

        inputEl.addEventListener('change', _fileSelected);
        textEl.addEventListener('click', function(e) {
            if(isClicked) return;
            isClicked = true;
            inputEl.click();
        });
    }

    function _fileSelected(e) {
        var file = inputEl.files[0];
        var formData = new FormData();
        var ext = file.name.substring(file.name.length - 4, file.name.length).toLowerCase();
        //send the socketId and extension combined
        //because busboi bullshit doesnt accept multiple formdatas
        formData.append('photos[]', file, _socketId + ext);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/fileupload', true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.addEventListener('readystatechange', function(e) {
            if (this.readyState === 4) {
                var res = JSON.parse(e.target.response);
                console.log(res);
            }
        });
        xhr.send(formData);
    }


    function _requestVideoData() {
        var videoEl = document.getElementById('myVideo');
        videoEl.src = '/myupload?id=' + _socketId;
        videoEl.poster = '/myposter?id=' + _socketId;
    }

    function _addSocketListeners() {
        SOCKET.on('handshake', function(data) {
            console.log('handshake', data);
            _socketId = data['id'];
        });

        SOCKET.on('video:response', function(data) {
            console.log(data);
            _requestVideoData();
            onVideoData();
        });
    }

    function _startVideoPoll() {
        setInterval(function() {
            SOCKET.emit('video:poll');
        }, 500);
    }

}


//  Captures

var video;
var screenshots = [];
var frameIndex = 0;
var _interval;
function onVideoData() {
    var textEl = document.querySelector('.FileUpload');
    textEl.innerHTML = "Processing ... "
    video = document.getElementById('myVideo');
    video = document.querySelector("#myVideo");
    console.log('Video : ', video);
    video.load();
    video.addEventListener("loadedmetadata", onMetaData);
}


function onMetaData() {
    console.log("On Metadata : ", video.duration);
    console.log("On Metadata : ", video.videoWidth, video.videoHeight);

    // getScreenshot();

    // window.addEventListener("touchstart", startScreenshot);
    // window.addEventListener("mousedown", startScreenshot);

    startScreenshot();
}


function startScreenshot() {
    if(_interval != undefined) return;

    // video.play();
    // video.style.display = "none";
    console.log("Start getting Screenshots");
    screenshots = [];
    var interval = (video.duration * 1000) / 18;
    _interval = setInterval(getScreenshot, interval);
}


function getScreenshot() {
    var seekTime = video.duration/18 * frameIndex;
    // console.log("Seek Time : ", seekTime);
    // video.seek(seekTime);
    video.currentTime = seekTime;
    var canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    var ctx = canvas.getContext("2d");
    var width = canvas.height;
    var height = canvas.width;
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(Math.PI * .5);
    ctx.drawImage(video, -width / 2, -height / 4, width, height);
    ctx.restore();
    canvas.className = "screenshot";
    screenshots.push(canvas);

    // document.body.appendChild(canvas);
    // console.log(screenshots.length, canvas);

    frameIndex++;

    if(screenshots.length == 18) {
        window.removeEventListener("touchstart", startScreenshot);
        window.removeEventListener("mousedown", startScreenshot);
        clearInterval(_interval);
        generateTiles();
    }
}

function generateTiles() {
    var h = screenshots[0].height / 4;
    console.log("HEIGHT : ", h);

    var captures = []
    for(var i=0; i<4; i++) {
        var canvas = document.createElement("canvas");
        canvas.width = 2048;
        canvas.height = 1024;
        var ctx = canvas.getContext("2d");

        for(var j=2; j<screenshots.length; j++) {
            var img = screenshots[j];
            var tx = (j-2) % 4 * 512;
            var ty = Math.floor((j-2)/4) * 256;

            ctx.drawImage(img, 0, i*h, img.width * 3/4, h, tx, ty, 512, 256);
        }
        
        captures.push(canvas);
        canvas.className = "tile";
        // document.body.appendChild(canvas);
        // console.log(canvas);
    }

    // this.video.classList.add("hide");
    // this._scene.updateTextures(captures);

    new App(captures);
}




var bpm = new FileUpload();