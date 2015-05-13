precision highp float;
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec3 position;
uniform float offset;

varying vec2 vTextureCoord;


mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

const vec3 yAXIS = vec3(0.0, 1.0, 0.0);

void main(void) {
	mat4 rot = rotationMatrix(yAXIS, offset);
	vec4 pos = rot * vec4(aVertexPosition, 1.0);
	pos.rgb += position;
    gl_Position = uPMatrix * uMVMatrix * pos;
    vTextureCoord = aTextureCoord;
}