import { Shape } from './shape';
import { Matrix3 } from '../tool';
import { WebGLRender } from '../render';

interface TextureConfig {
    texture: WebGLTexture | null;

    offsetX: number;

    offsetY: number;

    width: number;

    height: number;

    needFlipY: boolean;

    filter?: number[];
}
export class Texture extends Shape {
    texture: WebGLTexture | null;

    offsetX: number;

    offsetY: number;

    width: number;

    height: number;

    needFlipY: boolean;

    filter?: number[];

    constructor(config: TextureConfig) {
        super();

        this.texture = config.texture;
        this.offsetX = config.offsetX;
        this.offsetY = config.offsetY;
        this.width = config.width;
        this.height = config.height;
        this.needFlipY = config.needFlipY;
        this.filter = config.filter;
    }

    draw(render: WebGLRender) {
        if (!this.texture) {
            return; // 只渲染一次
        }

        const offsetX = this.offsetX * render.context.scale;
        const offsetY = this.offsetY * render.context.scale;
        const width = this.width * render.context.scale;
        const height = this.height * render.context.scale;

        /* ****** 顶点 ********** */
        const unitVertexCoord = render.createBuffer([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]); // 单位方块对应的顶点坐标
        render.setVertexAttribute('a_position', unitVertexCoord);

        const unitTextureCoord = render.createBuffer([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]); // 单位方块对应的纹理坐标
        render.setVertexAttribute('a_textureCoord', unitTextureCoord);

        /* ****** 变换 ********** */
        const projectionMatrix = Matrix3.projection(
            render.gl.canvas.width,
            render.gl.canvas.height,
            this.needFlipY
        );
        const transaltedMatrix = Matrix3.translate(projectionMatrix, offsetX, offsetY);
        const scaledMatrix = Matrix3.scale(transaltedMatrix, width, height);

        const uMatrix = render.gl.getUniformLocation(render.program, 'u_matrix');
        render.gl.uniformMatrix3fv(uMatrix, false, scaledMatrix);

        /* ****** 纹理 ********** */
        render.gl.bindTexture(render.gl.TEXTURE_2D, this.texture);
        const uTexture = render.gl.getUniformLocation(render.program, 'u_texture');
        render.gl.uniform1i(uTexture, 0);

        /* ****** 滤镜 ********** */
        const uFilter = render.gl.getUniformLocation(render.program, 'u_filter');
        const vRgba = render.gl.getUniformLocation(render.program, 'v_rgba');
        if (this.filter) {
            render.gl.uniform1i(uFilter, 1);
            render.gl.uniform4fv(vRgba, this.filter);
        } else {
            render.gl.uniform1i(uFilter, 0);
        }

        /* ****** 绘制 ********** */
        render.gl.drawArrays(render.gl.TRIANGLES, 0, 6);
    }
}
