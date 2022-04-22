import { WebGLRender } from '../render';

export abstract class Shape {
    id: string = '';

    render?: WebGLRender;

    abstract draw(rener: WebGLRender): void;
}
