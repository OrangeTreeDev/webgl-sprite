import { Data } from '../tool';
import { Sprite, Texture } from '../geometry';

interface WebGLContext {
    ele: string | HTMLCanvasElement;
    scale: number;
    enableBlend: boolean;
    batchUpdate: boolean;
}

export interface CanvasConfig {
    offsetX?: number;
    offsetY?: number;
    width: number;
    height: number;
    pixelRatio: number;
}

export class WebGLRender {
    context: WebGLContext;

    canvas: HTMLCanvasElement;

    gl: WebGLRenderingContext;

    vertexShader: WebGLShader;

    fragmentShader: WebGLShader;

    program: WebGLProgram;

    frameBuffer?: WebGLFramebuffer;

    framebufferTexture?: WebGLTexture;

    sprites: Sprite[] = [];

    offscreenRender?: WebGLRender;

    vertextSource: string = `
    attribute vec2 a_position;
    attribute vec2 a_textureCoord;

    uniform mat3 u_matrix;

    varying vec2 v_textureCoord;

    void main(void) {
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
      v_textureCoord = a_textureCoord;
    }
  `;

    fragmentSource: string = `
    precision mediump float;

    varying vec2 v_textureCoord;

    uniform sampler2D u_texture;

    uniform int u_filter;
    uniform vec4 v_rgba;
    void main() {
      vec4 v_texture_color = texture2D(u_texture, v_textureCoord);
      if (u_filter == 1) {
        float alpha_minus = 1.0 - v_rgba.a;
        float blend_r = v_rgba.r * v_rgba.a + v_texture_color.r * alpha_minus;
        float blend_g = v_rgba.g * v_rgba.a + v_texture_color.g * alpha_minus;
        float blend_b = v_rgba.b * v_rgba.a + v_texture_color.b * alpha_minus;
        gl_FragColor = vec4(blend_r, blend_g, blend_b, v_texture_color.a);
      } else {
        gl_FragColor = v_texture_color;
      }
    }
  `;

    constructor(context: WebGLContext) {
        this.context = context;

        this.canvas = this.createContext(context);
        const gl = this.canvas.getContext('webgl', {
            premultipliedAlpha: false,
            preserveDrawingBuffer: true
        });
        if (!gl) {
            throw new Error('webgl is not supported');
        }
        this.gl = gl;

        if (context.batchUpdate) {
            const framebuffer = this.gl.createFramebuffer();
            if (!framebuffer) {
                throw new Error('offscreen buffer creating occur error');
            }

            this.frameBuffer = framebuffer;
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);

            this.framebufferTexture = this.createTexture(
                null,
                this.gl.canvas.width,
                this.gl.canvas.height
            );
            this.gl.framebufferTexture2D(
                this.gl.FRAMEBUFFER,
                this.gl.COLOR_ATTACHMENT0,
                this.gl.TEXTURE_2D,
                this.framebufferTexture,
                0
            );
        }

        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

        this.clear();

        if (this.context.enableBlend) {
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFuncSeparate(
                this.gl.SRC_ALPHA,
                this.gl.ONE_MINUS_SRC_ALPHA,
                this.gl.ONE,
                this.gl.ONE_MINUS_SRC_ALPHA
            );
        }

        this.vertexShader = this.createShader(this.gl.VERTEX_SHADER, this.vertextSource); // 创建顶点着色器
        this.fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, this.fragmentSource); // 片段着色器
        this.program = this.createProgram([this.vertexShader, this.fragmentShader]); // 创建应用程序
    }

    createContext(options: WebGLContext) {
        const { ele, scale } = options;

        let canvas: HTMLCanvasElement;
        if (typeof ele === 'string') {
            canvas = document.getElementById(ele) as HTMLCanvasElement;
            if (canvas && canvas.tagName !== 'canvas') {
                throw new Error(`id ${ele} element should be a canvas element`);
            }
        } else {
            canvas = ele;
        }

        let { width, height } = canvas.getBoundingClientRect();
        if (!width || !height) {
            // 离屏canvas
            width = Number(canvas.style.width.replace('px', ''));
            height = Number(canvas.style.height.replace('px', ''));
            if (isNaN(width) || isNaN(height)) {
                throw new Error('need style canvas width and height');
            }
        }

        canvas.width = width * scale;
        canvas.height = height * scale;

        return canvas;
    }

    createShader(type: number, source: string) {
        const shader = this.gl.createShader(type)!;
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw new Error(this.gl.getShaderInfoLog(shader) ?? '');
        }

        return shader;
    }

    createProgram(shaders: WebGLShader[]) {
        const program = this.gl.createProgram()!;
        shaders.forEach((shader) => this.gl.attachShader(program, shader));
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            throw new Error(this.gl.getProgramInfoLog(program) ?? '');
        }

        this.gl.useProgram(program);
        return program;
    }

    createBuffer(bufferData: number[]) {
        const buffer = this.gl.createBuffer();
        if (!buffer) {
            throw new Error('gl create buffer fail');
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(bufferData), this.gl.STATIC_DRAW);
        return buffer;
    }

    createTexture(image: HTMLImageElement | null, width: number, height: number) {
        const texture = this.gl.createTexture();
        if (!texture) {
            throw new Error('gl create texture fail');
        }

        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        if (image) {
            this.gl.texImage2D(
                this.gl.TEXTURE_2D,
                0,
                this.gl.RGBA,
                this.gl.RGBA,
                this.gl.UNSIGNED_BYTE,
                image
            );
        } else {
            this.gl.texImage2D(
                this.gl.TEXTURE_2D,
                0,
                this.gl.RGBA,
                width,
                height,
                0,
                this.gl.RGBA,
                this.gl.UNSIGNED_BYTE,
                image
            );
        }

        return texture;
    }

    setVertexAttribute(name: string, buffer: WebGLBuffer) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);

        const aLocation = this.gl.getAttribLocation(this.program, name);

        this.gl.enableVertexAttribArray(aLocation);

        this.gl.vertexAttribPointer(aLocation, 2, this.gl.FLOAT, false, 0, 0);
    }

    batchUpdate() {
        if (!this.context.batchUpdate) {
            return;
        }

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.clear();

        if (this.framebufferTexture) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.framebufferTexture);
            const texture = new Texture({
                texture: this.framebufferTexture,
                offsetX: 0,
                offsetY: 0,
                width: this.gl.canvas.width,
                height: this.gl.canvas.height,
                needFlipY: true
            });
            texture.draw(this);
        }

        if (this.frameBuffer) {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
            this.gl.blendFuncSeparate(
                this.gl.SRC_ALPHA,
                this.gl.ONE_MINUS_SRC_ALPHA,
                this.gl.ONE,
                this.gl.ONE_MINUS_SRC_ALPHA
            );
            this.clear();
        }
    }

    addSprite(sprite: Sprite) {
        if (!this.sprites.includes(sprite)) {
            this.sprites.push(sprite);
        }
    }

    findSpriteById(id: string) {
        return this.sprites.find((node) => node.id === id);
    }

    getOffScreenRender(config: CanvasConfig) {
        if (!this.offscreenRender) {
            const offCanvas = document.createElement('canvas');
            offCanvas.style.width = `${config.width}px`;
            offCanvas.style.height = `${config.height}px`;
            this.offscreenRender = new WebGLRender({
                ele: offCanvas,
                scale: config.pixelRatio,
                enableBlend: true,
                batchUpdate: false
            });
        } else {
            this.offscreenRender.resize(config);
        }
        return this.offscreenRender;
    }

    toBlob(config?: CanvasConfig) {
        let dataUrl: string;
        if (!config) {
            dataUrl = this.canvas.toDataURL();
        } else {
            const sourceCrop = { offsetX: 0, offsetY: 0, ...config };
            const screenShotCanvas = document.createElement('canvas');
            screenShotCanvas.style.width = `${sourceCrop.width}px`;
            screenShotCanvas.style.height = `${sourceCrop.height}px`;
            screenShotCanvas.width = sourceCrop.width * sourceCrop.pixelRatio;
            screenShotCanvas.height = sourceCrop.height * sourceCrop.pixelRatio;

            screenShotCanvas
                .getContext('2d')
                ?.drawImage(
                    this.canvas,
                    sourceCrop.offsetX * this.context.scale,
                    sourceCrop.offsetY * this.context.scale,
                    sourceCrop.width * this.context.scale,
                    sourceCrop.height * this.context.scale,
                    0,
                    0,
                    sourceCrop.width * sourceCrop.pixelRatio,
                    sourceCrop.height * sourceCrop.pixelRatio
                );
            dataUrl = screenShotCanvas.toDataURL();
        }
        const blob = Data.dataUrlToBlob(dataUrl);
        return blob;
    }

    destory() {
        // TODO: 销毁canvas
        this.sprites = [];
        this.offscreenRender = undefined;
    }

    resize(config: CanvasConfig) {
        if (!this.gl) {
            return;
        }
        this.canvas.style.width = `${config.width}px`;
        this.canvas.style.height = `${config.height}px`;
        this.canvas.width = config.width * config.pixelRatio;
        this.canvas.height = config.height * config.pixelRatio;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.clear();
    }

    clear() {
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clearDepth(1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
}
