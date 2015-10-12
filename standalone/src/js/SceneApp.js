// SceneApp.js

var GL = bongiovi.GL, gl;
var ViewRing = require("./ViewRing");

function SceneApp(captures) {
	this._captures = captures;
	gl = GL.gl;
	gl.disable(gl.CULL_FACE);
	bongiovi.Scene.call(this);

	this.sceneRotation.lock(true);
	this.camera.lockRotation(false);

	window.addEventListener("resize", this.resize.bind(this));
}


var p = SceneApp.prototype = new bongiovi.Scene();

p._initTextures = function() {
	console.log('Init Textures');

	var mCaptures = this._captures;

	this._textures = [];
	for(var i=0 ;i <mCaptures.length ; i++) {
		var t = new bongiovi.GLTexture(mCaptures[i]);
		this._textures.push(t);
	}

};

p._initViews = function() {
	console.log('Init Views');
	this._vAxis = new bongiovi.ViewAxis();
	this._vDotPlane = new bongiovi.ViewDotPlane();

	this._rings = [];
	for(var i=0; i<4; i++) {
		var v = new ViewRing();
		this._rings.push(v);
	}


	for(var i=0; i<this._rings.length ; i++) {
		this._rings[i].spin();
	}
};

p.render = function() {
	// this._vAxis.render();
	this._vDotPlane.render();

	var h = this._rings[0].height;
	var sy = h * 2.5;
	for(var i=0; i<4; i++) {
		this._rings[i].render(this._textures[i], [0, sy - i * h * 2, 0]);
	}
};

p.resize = function() {
	GL.setSize(window.innerWidth, window.innerHeight);
	this.camera.resize(GL.aspectRatio);
};

module.exports = SceneApp;