// app.js
navigator.getMedia = ( navigator.mozGetUserMedia ||
					   navigator.getUserMedia ||
					   navigator.webkitGetUserMedia ||
					   navigator.msGetUserMedia);

window.bongiovi = require("./libs/bongiovi.js");
var dat = require("dat-gui");

(function() {
	var SceneApp = require("./SceneApp");

	App = function() {
		if(document.body) this._init();
		else {
			window.addEventListener("load", this._init.bind(this));
		}
	}

	var p = App.prototype;

	p._init = function() {
		this._captures = [];
		this._captureIndex = 0;
		this._captureDelay = 100;

		this._initWebcam();
	};

	p._initWebcam = function() {
		var hasGetUserMedia = (function() {
			return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
		})();

		if(!hasGetUserMedia) {
			console.warn("No webcam");
			return;
		} 

		if (navigator.getMedia) {
			navigator.getMedia({video:true}, this._onStream.bind(this), function(e) {
				console.log( "Error Getting media" );
			});
		} else {
			console.log("getUserMedia not supported");
		}

		window.addEventListener("keydown", this._onKey.bind(this));
	};

	p._onStream = function(stream) {
		this.video = document.body.querySelector("video");
		this.video.src = window.URL.createObjectURL(stream);
		this.video.play();
	};

	p._onKey = function(e) {
		// console.log(e.keyCode);
		if(e.keyCode == 83) { //s
			this._captureIndex = 0;
			this._captures = [];
			this.capture();

			document.body.querySelector('.desc').classList.add('hide');
		}
	};


	p.capture = function() {
		var canvas = document.createElement("canvas");
		canvas.width = this.video.clientWidth;
		canvas.height = this.video.clientHeight;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(this.video, 0, 0);

		this._captures.push(canvas);
		console.log("Capturing : ", this._captures.length);
		if(this._captures.length <16) {
			bongiovi.Scheduler.delay(this, this.capture, null, this._captureDelay);
		} else {
			console.log(this._captures.length);
			this._generateTiles();
		}
	};

	p._generateTiles = function() {
		var h = this.video.clientHeight / 4;
		var captures = []
		for(var i=0; i<4; i++) {
			var canvas = document.createElement("canvas");
			canvas.width = 2048;
			canvas.height = 1024;
			var ctx = canvas.getContext("2d");

			for(var j=0; j<this._captures.length; j++) {
				var img = this._captures[j];
				var tx = j % 4 * 512;
				var ty = Math.floor(j/4) * 256;

				ctx.drawImage(img, 0, i*h, img.width, h, tx, ty, 512, 256);
			}
			
			captures.push(canvas);
		}

		this.video.classList.add("hide");

		this.canvas = document.createElement("canvas");
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.canvas.className = "Main-Canvas";
		document.body.appendChild(this.canvas);
		bongiovi.GL.init(this.canvas);

		this._scene = new SceneApp(captures);
		bongiovi.Scheduler.addEF(this, this._loop);

		// this._scene.updateTextures(captures);
	};


	p._init3D = function() {
		
	};

	p._loop = function() {
		TWEEN.update();
		this._scene.loop();
	};

})();


new App();