// ViewRing.js

var GL = bongiovi.GL;
var gl;
var glslify = require("glslify");
var random = function(min, max) { return min + Math.random() * (max - min);	}

function ViewRing() {
	this.speed = 0;
	this.pos = 0;
	this.time = 0;
	bongiovi.View.call(this, glslify("../shaders/spin.vert"), glslify("../shaders/spin.frag"));
	// bongiovi.View.call(this, glslify("../shaders/spin.vert"), bongiovi.ShaderLibs.get(''));
}

var p = ViewRing.prototype = new bongiovi.View();
p.constructor = ViewRing;


p._init = function() {
	gl = GL.gl;
	var positions = [],
		coords = [],
		indices = [],
		index = 0;

	var radius = 200 + random(0, 20);
	var totalLength = radius * Math.PI * 2.0;
	var height = totalLength / 16 / 2 * .5;
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
};

p.spin = function() {
	this._isStarted = true;
	var range = 2;
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
	this.shader.uniform("position", "uniform3fv", pos);
	this.shader.uniform("offset", "uniform1f", this.pos/2048*Math.PI*2);
	this.shader.uniform("time", "uniform1f", this.time);
	texture.bind(0);
	GL.draw(this.mesh);

	this.time += .01;
};

module.exports = ViewRing;