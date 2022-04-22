import { Texture } from './texture';
import { Env } from '../tool';
import { WebGLRender, CanvasConfig } from '../render';

interface SpriteConfig {
    id?: string;
    image: HTMLImageElement;

    offsetX: number;

    offsetY: number;

    width: number;

    height: number;

    filter?: number[];

    reserver?: boolean;

    needFlipY?: boolean;
}
export class Sprite extends Texture {
    static loadImage(src: string) {
        return new Promise<[string, HTMLImageElement]>((resolve, reject) => {
            const image = new Image();

            image.onload = () => {
                resolve([src, image]);
            };

            image.onerror = (e) => {
                reject(e);
            };

            image.crossOrigin = 'crossOrigin';
            image.src = src; // MUST BE SAME DOMAIN!!!
        });
    }

    static loadImages(srcs: string[]) {
        return Promise.all(srcs.map((src) => Sprite.loadImage(src)));
    }

    image: HTMLImageElement;

    config: SpriteConfig;

    constructor(config: SpriteConfig) {
        super({
            texture: null,
            offsetX: config.offsetX,
            offsetY: config.offsetY,
            width: config.width,
            height: config.height,
            filter: config.filter,
            needFlipY: true
        });

        this.config = config;
        this.image = config.image;
        this.id = config.id ?? '';
    }

    draw(render: WebGLRender) {
        if (this.texture) {
            return; // 只渲染一次
        }

        this.render = render;
        if (this.config.reserver !== false) {
            this.render.addSprite(this);
        }

        this.texture = render.createTexture(this.image, this.image.width, this.image.height);
        this.needFlipY =
            this.config.needFlipY !== undefined
                ? this.config.needFlipY
                : !render.context.batchUpdate;

        super.draw(render);
    }

    toBlob(config?: CanvasConfig) {
        if (!this.texture || !this.render) {
            return undefined;
        }

        const offScreenConfig = {
            width: this.width,
            height: this.height,
            pixelRatio: window.devicePixelRatio,
            ...config
        };
        const offscreenCanvas = this.render.getOffScreenRender(offScreenConfig);

        const sprite = new Sprite({
            image: this.image,
            offsetX: 0,
            offsetY: 0,
            width: offScreenConfig.width,
            height: offScreenConfig.height,
            filter: this.filter,
            reserver: false,
            needFlipY: Env.isiOS ? false : !offscreenCanvas.batchUpdate // ios dataurl bug
        });
        sprite.draw(offscreenCanvas);

        const blob = offscreenCanvas.toBlob();
        return blob;
    }
}
