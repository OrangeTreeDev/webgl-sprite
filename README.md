webgl-sprite是一个图像库，提供了图像编辑、绘制、滤镜、截屏功能。使用webgl-sprite，即使你不了解WebGL，也可以收益WebGL带来的性能优势。

![yuque_diagram](https://user-images.githubusercontent.com/24699644/195777450-1ddad392-13cf-4c89-8c06-c934ebbca0bc.png)


# 使用

```javascript
import { WebGLRender, Sprite } from 'webgl-sprite';

// 获取canvas dom
const container = document.getElementById('canvas-container');

// 初始化渲染器
const webGLRender = new WebGLRender({
  ele: container,
  scale: window.devicePixelRatio,
  enableBlend: true,
  batchUpdate: false,
});

// 下载图片，初始化Sprite，绘制Sprite
Sprite.loadImage('image src').then(image => {
  const sprite = new Sprite({
    id: 'first-sprite',
    image,
    offsetX: 0,
    offsetY: 0,
    width: image.width,
    height: image.height,
  });
  
  sprite.draw(webGLRender);
});

// 导出指定id的图片
const blob = webGLRender.findSpriteById('first-sprite').toBlob();
```



# API

### WebGLRender

```javascript
interface WebGLContext {
    ele: string | HTMLCanvasElement; // canvas元素id，或canvas对象
    scale: number; // 设备像素比
    enableBlend: boolean; // 是否开启图片混合模式
    batchUpdate: boolean; // 是否开启批量绘制
}
WebGLRender(context: WebGLContext): WebGLRender
```

构建渲染器实例。



```javascript
WebGLRender.findSpriteById(id: string): Sprite | undefined
```

根据ID查询图像对象。



```javascript
WebGLRender.toBlob(config?: CanvasConfig | undefined): Blob
```

对渲染器渲染内容进行截图导出。



```javascript
WebGLRender.clear(): void
```

清空渲染器的内容。



### Sprite

```javascript
interface SpriteConfig {
    id?: string; // 对象ID
    
    image: HTMLImageElement; // 图像

    offsetX: number; // 图像在画布左上角的x方向的偏移

    offsetY: number; // 图像在画布左上角的y方向的偏移

    width: number; // 绘制的宽度

    height: number; // 绘制的高度

    filter?: number[]; // 滤色，传入rgba四个分量，每个分量需要归一化为0-1

    reserver?: boolean; // 是否需要把图像实例添加到render实例的sprites属性中

    needFlipY?: boolean; // 是否需要翻转图片
}
Sprite(config: SpriteConfig): Sprite
```

构建图像实例。



```javascript
Sprite.loadImages(srcs: string[]): Promise<[string, HTMLImageElement][]>
```

下载多张图片，返回图片地址和图片对象。



```javascript
Sprite.draw(render: WebGLRender): void
```

绘制图像到渲染器。



```javascript
interface CanvasConfig {
    offsetX?: number; // 导出图片的x方向的偏移量
    offsetY?: number; // 导出图片的y方向的偏移量
    width: number; // 导出图片的宽度
    height: number; // 导出图片的高度
    pixelRatio: number; // 导出图片的设备像素比
}
Sprite.toBlob(config?: CanvasConfig | undefined): Blob | undefined
```

截图导出图像，支持指定图片的大小和清晰度。

