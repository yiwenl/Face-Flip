// Spin.js

(function() {
	var GL = bongiovi.GL, gl;
	var random = function(min, max) {	return min + Math.random() * (max - min);	}
	ViewRing = function() {
		gl = GL.gl;
		this.speed = 0;
		this.pos = 0;
		this.time = 0;
		// bongiovi.View.call(this, bongiovi.ShaderLibs.get("generalVert"), bongiovi.ShaderLibs.get("simpleColorFrag"));
		// bongiovi.View.call(this, "../shaders/spin.vert", bongiovi.ShaderLibs.get("simpleColorFrag"));
		bongiovi.View.call(this, "/shaders/spin.vert", "/shaders/spin.frag");
	}

	var p = ViewRing.prototype = new bongiovi.View();

	p._init = function() {
		var positions = [],
			coords = [],
			indices = [],
			index = 0;

		var radius = 300 + random(0, 20);
		var totalLength = radius * Math.PI * 2.0;
		var height = totalLength / 16 / 2 * .25;
		var numSeg = 16;
		var gap = 1/4;
		var scale = 1;
		this.height = height;


		var x0, x1, z0, z1, theta;
		for(var i=0; i<numSeg; i++) {
			theta = i/numSeg * Math.PI * 2.0;
			x0 = Math.cos(theta) * radius;
			z0 = Math.sin(theta) * radius;
			theta = (i+1)/numSeg * Math.PI * 2.0;
			x1 = Math.cos(theta) * radius;
			z1 = Math.sin(theta) * radius;

			positions.push([x1, -height, z1]);
			positions.push([x0, -height, z0]);
			positions.push([x0*scale, height, z0*scale]);
			positions.push([x1*scale, height, z1*scale]);
			
			var u = i % 4;
			var v = Math.floor(i / 4);
			coords.push([gap*u, gap*v]);
			coords.push([gap*u+gap, gap*v]);
			coords.push([gap*u+gap, gap*v+gap]);
			coords.push([gap*u, gap*v+gap]);

			indices.push(index*4 + 0);
			indices.push(index*4 + 1);
			indices.push(index*4 + 2);
			indices.push(index*4 + 0);
			indices.push(index*4 + 2);
			indices.push(index*4 + 3);

			index ++;
		}

		this.mesh = new bongiovi.Mesh(positions.length, indices.length, GL.gl.TRIANGLES);
		this.mesh.bufferVertex(positions);
		this.mesh.bufferTexCoords(coords);
		this.mesh.bufferIndices(indices);

		// this.spin();
	};

	p.spin = function() {
		this._isStarted = true;
		var range = 1;
		var base = 256
		var targetSpeed = random(base-range, base+range);
		var duration = random(5000, 7000);
		new TWEEN.Tween(this).to({"speed":targetSpeed}, duration).easing( TWEEN.Easing.Exponential.InOut ).start();
	};

	p.render = function(texture, pos) {
		this.pos -= this.speed;
		if(this.pos > 4096) this.pos -= 4096;
		else if(this.pos <-4096) this.pos += 4096;

		this.shader.bind();
		this.shader.uniform("texture", "uniform1i", 0);
		this.shader.uniform("position", "uniform3fv", pos || [0, 50, 0]);
		// this.shader.uniform("scale", "uniform3fv", [1, 1, 1]);
		this.shader.uniform("offset", "uniform1f", this.pos/2048*Math.PI*2);
		this.shader.uniform("time", "uniform1f", this.time);

		// this.shader.uniform("color", "uniform3fv", [1, 1, .9]);
		// this.shader.uniform("opacity", "uniform1f", 1);
		texture.bind(0);
		GL.draw(this.mesh);

		this.time += .01;
	};
})();

(function() {
	var GL = bongiovi.GL;
	var gl;
	SceneFace = function(captures) {
		gl = GL.gl;
		gl.disable(gl.CULL_FACE);
		this.captures = captures;
		this.sceneRotation.lock();
		this.camera.lockRotation(false);
		bongiovi.Scene.call(this);
	}

	var p = SceneFace.prototype = new bongiovi.Scene();

	p._initTextures = function() {
		// console.log("init textures");
	};


	p._initViews = function() {
		console.log("init views");
		this._vRing = new ViewRing();
		this._rings = [];
		for(var i=0; i<4; i++) {
			var v = new ViewRing();
			this._rings.push(v);
		}

		this.updateTextures(this.captures);
	};

	p.updateTextures = function(mCaptures) {
		this._textures = [];
		for(var i=0 ;i <mCaptures.length ; i++) {
			var t = new bongiovi.GLTexture(mCaptures[i]);
			this._textures.push(t);
		}

		for(var i=0; i<this._rings.length ; i++) {
			this._rings[i].spin();
		}
	};


	p.render = function() {
		GL.clear(0, 0, 0, 1);
		// this._vRing.render();
		// console.log("Render");

		var h = this._vRing.height;
		var sy = h * 2.5;
		for(var i=0; i<4; i++) {
			this._rings[i].render(this._textures[i], [0, sy - i * h * 2, 0]);
		}
	};
})();

(function() {
	App = function(captures) {
		this.captures = captures;
		this._init();
	}

	var p = App.prototype;

	p._init = function() {
		if(!document.body) {
			bongiovi.Scheduler.next(this, this._init);
			return;
		}

		console.log("Ready");

		this.canvas = document.createElement("canvas");
		this.canvas.className = "Main-canvas";
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		document.body.appendChild(this.canvas);
		bongiovi.GL.init(this.canvas);

		this._scene = new SceneFace(this.captures);

		bongiovi.Scheduler.addEF(this, this._loop);
	};


	p._loop = function() {
		TWEEN.update();
		this._scene.loop();
	};
})();

// new App();