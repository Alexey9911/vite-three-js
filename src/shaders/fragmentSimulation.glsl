uniform sampler2D texturePosition;
uniform float time;
// varying vec2 resolution;

void main() {

    vec2 uv = gl_FragCoord.xy / resolution.xy;
    // vec2 uv = gl_FragCoord.xy / 600.;

    vec4 tmpPos = texture2D(texturePosition, uv);

    vec3 position = tmpPos.xyz;

    gl_FragColor = vec4(position + vec3(0.001), 1.0);

}