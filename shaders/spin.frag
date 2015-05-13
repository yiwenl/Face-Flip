precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D texture;

const float permTexUnit = 1.0/256.0;        // Perm texture texel-size
const float permTexUnitHalf = 0.5/256.0;    // Half perm texture texel-size
const bool colored = true; //colored noise?
const float coloramount = 0.6;
const float grainsize = 1.7; //grain particle size (1.5 - 2.5)
const float lumamount = 1.0; //
const float grainamount = 0.15;
const float width = 2048.0;
const float height = 1024.0;
uniform float time;

//the grain animation
float anim = time; //too fast right now.. should be more like 41.66 ms

//a random texture generator, but you can also use a pre-computed perturbation texture
vec4 rnm(in vec2 tc) 
{
    float noise =  sin(dot(tc,vec2(anim)+vec2(12.9898,78.233))) * 43758.5453;
    float noiseR =  fract(noise)*2.0-1.0;
    float noiseG =  fract(noise*1.2154)*2.0-1.0; 
    float noiseB =  fract(noise*1.3453)*2.0-1.0;
    float noiseA =  fract(noise*1.3647)*2.0-1.0;
    
    return vec4(noiseR,noiseG,noiseB,noiseA);
}

float fade(in float t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float pnoise3D(in vec3 p)
{
    vec3 pi = permTexUnit*floor(p)+permTexUnitHalf; // Integer part, scaled so +1 moves permTexUnit texel
    // and offset 1/2 texel to sample texel centers
    vec3 pf = fract(p);     // Fractional part for interpolation

    // Noise contributions from (x=0, y=0), z=0 and z=1
    float perm00 = rnm(pi.xy).a ;
    vec3  grad000 = rnm(vec2(perm00, pi.z)).rgb * 4.0 - 1.0;
    float n000 = dot(grad000, pf);
    vec3  grad001 = rnm(vec2(perm00, pi.z + permTexUnit)).rgb * 4.0 - 1.0;
    float n001 = dot(grad001, pf - vec3(0.0, 0.0, 1.0));

    // Noise contributions from (x=0, y=1), z=0 and z=1
    float perm01 = rnm(pi.xy + vec2(0.0, permTexUnit)).a ;
    vec3  grad010 = rnm(vec2(perm01, pi.z)).rgb * 4.0 - 1.0;
    float n010 = dot(grad010, pf - vec3(0.0, 1.0, 0.0));
    vec3  grad011 = rnm(vec2(perm01, pi.z + permTexUnit)).rgb * 4.0 - 1.0;
    float n011 = dot(grad011, pf - vec3(0.0, 1.0, 1.0));

    // Noise contributions from (x=1, y=0), z=0 and z=1
    float perm10 = rnm(pi.xy + vec2(permTexUnit, 0.0)).a ;
    vec3  grad100 = rnm(vec2(perm10, pi.z)).rgb * 4.0 - 1.0;
    float n100 = dot(grad100, pf - vec3(1.0, 0.0, 0.0));
    vec3  grad101 = rnm(vec2(perm10, pi.z + permTexUnit)).rgb * 4.0 - 1.0;
    float n101 = dot(grad101, pf - vec3(1.0, 0.0, 1.0));

    // Noise contributions from (x=1, y=1), z=0 and z=1
    float perm11 = rnm(pi.xy + vec2(permTexUnit, permTexUnit)).a ;
    vec3  grad110 = rnm(vec2(perm11, pi.z)).rgb * 4.0 - 1.0;
    float n110 = dot(grad110, pf - vec3(1.0, 1.0, 0.0));
    vec3  grad111 = rnm(vec2(perm11, pi.z + permTexUnit)).rgb * 4.0 - 1.0;
    float n111 = dot(grad111, pf - vec3(1.0, 1.0, 1.0));

    // Blend contributions along x
    vec4 n_x = mix(vec4(n000, n001, n010, n011), vec4(n100, n101, n110, n111), fade(pf.x));

    // Blend contributions along y
    vec2 n_xy = mix(n_x.xy, n_x.zw, fade(pf.y));

    // Blend contributions along z
    float n_xyz = mix(n_xy.x, n_xy.y, fade(pf.z));

    // We're done, return the final noise value.
    return n_xyz;
}

//2d coordinate orientation thing
vec2 coordRot(in vec2 tc, in float angle)
{
    float aspect = width/height;
    float rotX = ((tc.x*2.0-1.0)*aspect*cos(angle)) - ((tc.y*2.0-1.0)*sin(angle));
    float rotY = ((tc.y*2.0-1.0)*cos(angle)) + ((tc.x*2.0-1.0)*aspect*sin(angle));
    rotX = ((rotX/aspect)*0.5+0.5);
    rotY = rotY*0.5+0.5;
    return vec2(rotX,rotY);
}


float rand(vec2 co)
{
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy ,vec2(a,b));
    highp float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}

//good for large clumps of smooth looking noise, but too repetitive
//for small grains
float fastNoise(vec2 n) {
	const vec2 d = vec2(0.0, 1.0);
	vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
	return mix(mix(rand(b), rand(b + d.yx ), f.x), mix(rand(b + d.xy ), rand(b + d.yy ), f.x), f.y);
}

void main(void) {
    gl_FragColor = texture2D(texture, vTextureCoord);
    float grey = (gl_FragColor.r + gl_FragColor.g + gl_FragColor.b) / 3.0;
    gl_FragColor.rgb = vec3(grey);


 //    float c = 1.0;
	// vec3 color = vec3(c);
	
	// vec2 texCoord = vTextureCoord.st;
	
	
	
	// vec3 rotOffset = vec3(1.425,3.892,5.835); //rotation offset values  
	// vec2 rotCoordsR = coordRot(texCoord, anim+rotOffset.x);
	// vec3 noise = vec3(pnoise3D(vec3(rotCoordsR*vec2(width/grainsize,height/grainsize),0.0)));
	
	// if (colored)
	// {
	// 	vec2 rotCoordsG = coordRot(texCoord,anim+ rotOffset.y);
	// 	vec2 rotCoordsB = coordRot(texCoord,anim+ rotOffset.z);
		
	// 	noise.g = mix(noise.r,pnoise3D(vec3(rotCoordsG*vec2(width/grainsize,height/grainsize),1.0)),coloramount);
	// 	noise.b = mix(noise.r,pnoise3D(vec3(rotCoordsB*vec2(width/grainsize,height/grainsize),2.0)),coloramount);
	// }
	// color = noise;
	// color = 0.5 + color*grainamount;
	
	// //constant moving burn
	// color += vec3( fastNoise(texCoord*sin(time*0.1)*3.0 + fastNoise(time*0.4+texCoord*2.0)) )*0.1;
	
	// //large occasional burns
	// float specs = fastNoise(texCoord*(10.0+sin(time)*5.0) + fastNoise(time+texCoord*50.0) );
	// color -= vec3( smoothstep(0.955, 0.96, specs*sin(time*4.0)  ) )*0.03;	
	// specs = fastNoise(texCoord*1.0*(10.0+sin(time)*5.0) - fastNoise(time+texCoord*40.0) );
	// color -= vec3( smoothstep(0.99, 0.98, (specs)*(sin(cos(time)*4.0)/2.+0.5)) )*0.05;	
	
	// //this is really crappy and should be revisited...
	// color -= clamp( 0.15*vec3( smoothstep(0.000001, 0.0000, rand(texCoord.xx*time) ) * (abs(cos(time)*sin(time*1.5))-0.5) ), 0.0, 1.0 );
	
	// vec3 filmGrain = vec3(color);
	// gl_FragColor.rgb *= filmGrain;
	// gl_FragColor = vec4( vec3( color ), 1.0 );
}