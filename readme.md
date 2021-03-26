# 基于 paper.js 的图像标注工具。

# mode

- pan 浏览模式
- rectangle 画矩形
- polygon 画多边形
- brush 画笔

## pan

- 拖动浏览
- 选择并拖动图形
- 拖动矩形四个边
- 拖动矩形四个角
- 拖动多边形端点
- 点击多边形的边可以增加一个端点
- shift+点击端点删除一个端点
- delete 或 backsoace 删除选中的图形

## rectangle

- 按住鼠标拖动画矩形

## polygon

- 点击添加多边形的一个端点
- ~~双击结束绘制~~ 按快捷键`n`新建（包含当前点。少于两个端点，不绘制）
- `esc`键取消当前绘制

# 使用方式

- 引入[paper.js](http://paperjs.org/)。
- 引入 Label.js

```html
<canvas id="myCanvas" style="height: 100vh; width: 100vh" resize></canvas>
<script>
  let canvas = document.getElementById('myCanvas');
  let myLabel = new MyLabel(canvas, 'http:xxx.jpg');
</script>
```

#### 设置 mode setMode(string)

```javascript
setMode((string: 'pan' | 'rectangle' | 'polygon' | 'brush'));
```

#### 添加矩形 addRectangle(option,data) 

| 参数   | 说明                                                         |
| ------ | ------------------------------------------------------------ |
| option | 参考 [Paper.js — Path](http://paperjs.org/reference/path/#path-rectangle-object) |
| data   | 携带自定义参数，注意不要在data里添加type属性，默认为图形type |

```javascript

myLabel.addRectangle({
    from: [100, 100],
    to: [200, 200],
    strokeColor: 'green',
    strokeWidth: 3,
    fillColor: '#ff000033'
},{
    id: new Date().getTime(),
})
```

#### 添加多边形 addPolygon(points, option, data)

| 参数   | 说明                                                         |      |
| ------ | ------------------------------------------------------------ | ---- |
| points | point[] 参考[Paper.js — Point](http://paperjs.org/reference/point/) |      |
| option | 参考 [Paper.js — Path](http://paperjs.org/reference/path/#path-rectangle-object) |      |
| data   | 携带自定义参数，注意不要在data里添加type属性，默认为图形type |      |

```javascript
myLabel.addPolygon(
    [
        [0, 0],
        [100, 0],
        [200, 100],
        [100, 100],
    ],
    {
        strokeColor: 'red',
        strokeWidth: 1,
        fillColor: '#ff000033',
    }
);
```



#### 获取图形 getAll(option)

| 参数   | 说明                                                         |
| ------ | ------------------------------------------------------------ |
| option | [Paper.js — Group](http://paperjs.org/reference/group/#getitems-options) |

```javascript
myLabel.getAll({ data: { type: 'polygon' } });// 获取特定type图形
myLabel.getAll({ data: { id: 'xxx' } });// 获取自定义参数图形
myLabel.getAll({})// 获取所有，包含背景图片
```

