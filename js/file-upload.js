function FileUpload() {
    var PORT = 5678;
    var SOCKET = undefined;
    var textEl = document.getElementById('fileUpload');
    var inputEl = document.getElementById('fileInput');
    var _socketId = undefined;

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
        });
    }

    function _startVideoPoll() {
        setInterval(function() {
            SOCKET.emit('video:poll');
        }, 500);
    }

}



var bpm = new FileUpload();