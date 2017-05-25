class BrightnessShader {

    constructor() {

        this.uniforms = {
            brightness: { type: "f", value: 0 },
            contrast: { type: "f", value: 1 },
            tInput: { type: "sampler2D", value: null },
        };

        this.vertexShader = [
            "varying vec2 vUv;",
            "void main() {",

            "vUv = uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

            "}"

        ].join("\n");

        this.fragmentShader = [
            "uniform float brightness;",
            "uniform float contrast;",
            "uniform sampler2D tInput;",

            "varying vec2 vUv;",

            "void main() {",

            "vec3 color = texture2D(tInput, vUv).rgb;",
            "vec3 colorContrasted = (color) * contrast;",
            "vec3 bright = colorContrasted + vec3(brightness,brightness,brightness);",
            "gl_FragColor.rgb = bright;",
            "gl_FragColor.a = 1.;",

            "}"

        ].join("\n");
    }

};

export { BrightnessShader };
