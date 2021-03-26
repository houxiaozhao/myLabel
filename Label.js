class MyLabel {
  factor = 1.25;
  minZoom = 0.1;
  maxZoom = 10;
  mode = 'pan';
  constructor(el, image) {
    paper.setup(el);
    this.el = el;
    this.image = image;
    this.raster = null;
    this.group = new paper.Group({
      applyMatrix: false,
      position: [0, 0],
      selected: true,
    });
    this.panTool = new paper.Tool();
    this.rectangleTool = new paper.Tool();
    this.polygonTool = new paper.Tool();
    this.init();
    this.initPanTool();
    this.initRectangleTool();
    this.initPolygonTool();
    this.setMode('pan');
  }

  init() {
    this.raster = new paper.Raster({
      source: this.image,
      position: [0, 0],
      parent: this.group,
    });
    this.raster.onLoad = () => {
      this.raster.position = [this.raster.width / 2, this.raster.height / 2];
    };

    this.el.addEventListener('wheel', event => {
      this.onMouseWheel(event);
    });
    paper.view.onResize = this.onResize;
  }
  onMouseWheel(event) {
    const delta = event.deltaY;
    const mousePos = new paper.Point(event.offsetX, event.offsetY);
    const oldZoom = paper.view.zoom;
    const oldCenter = paper.view.center;
    const viewPos = paper.view.viewToProject(mousePos);
    let newZoom = delta < 0 ? paper.view.zoom * this.factor : paper.view.zoom / this.factor;
    newZoom = Math.max(newZoom, this.minZoom);
    newZoom = Math.min(newZoom, this.maxZoom);
    paper.view.zoom = newZoom;
    const zoomScale = oldZoom / newZoom;
    const centerAdjust = viewPos.subtract(oldCenter);
    const offset = viewPos.subtract(centerAdjust.multiply(zoomScale)).subtract(oldCenter);
    paper.view.center = paper.view.center.add(offset);
  }
  initPanTool() {
    let panMode = '';
    let activePath;
    let hitIndex;
    this.panTool.onMouseDown = e => {
      let hitResult = this.group.hitTest(e.point, {
        segments: true,
        stroke: true,
        curves: true,
        fill: true,
        guide: false,
        tolerance: 8 / paper.view.zoom,
      });
      //   console.log(hitResult);
      paper.project.selectedItems.forEach(item => {
        item.selected = false;
      });
      if (hitResult && hitResult.item.className !== 'Raster') {
        hitResult.item.selected = true;
        activePath = hitResult.item;
        this.group.addChild(activePath); // 放到顶层
      }
      if (hitResult && hitResult.type === 'fill') {
        panMode = 'fill';
      } else if (hitResult && hitResult.type === 'stroke') {
        panMode = 'stroke';
        hitIndex = hitResult.location.index;
        //点击多边形边，添加一个 端点
        if (activePath.data.type === 'polygon') {
          activePath.insert(hitIndex + 1, new paper.Segment(hitResult.location.point));
          panMode = 'segment';
          hitIndex = hitIndex + 1;
        }
      } else if (hitResult && hitResult.type === 'segment') {
        panMode = 'segment';
        hitIndex = hitResult.segment.index;
        // shift点击 删除端点
        if (e.event.shiftKey) {
          activePath.removeSegment(hitIndex);
          panMode = '';
        }
      } else {
        panMode = '';
      }
      //   console.log('panMode', panMode);
    };
    this.panTool.onMouseDrag = e => {
      let point;
      if (activePath) point = activePath.globalToLocal(e.point);
      //   console.log('鼠标坐标', e.point, point);
      //   console.log('group', this.group.bounds.x, this.group.bounds.y);
      if (panMode === '') {
        this.group.position = this.group.position.add(e.delta);
      } else if (panMode === 'fill') {
        activePath.position = activePath.position.add(e.delta);
      } else if (panMode === 'stroke') {
        if (activePath.data.type === 'rectangle') {
          let axis = hitIndex % 2 ? 'y' : 'x';
          activePath.segments[hitIndex].point[axis] = point[axis];
          activePath.segments[hitIndex].next.point[axis] = point[axis];
        } else if (activePath.data.type == 'polygon') {
        }
      } else if (panMode === 'segment') {
        if (activePath.data.type === 'rectangle') {
          activePath.segments[hitIndex].point.x = point.x;
          activePath.segments[hitIndex].point.y = point.y;
          activePath.segments[hitIndex].next.point[hitIndex % 2 ? 'y' : 'x'] = point[hitIndex % 2 ? 'y' : 'x'];
          activePath.segments[hitIndex].previous.point[hitIndex % 2 ? 'x' : 'y'] = point[hitIndex % 2 ? 'x' : 'y'];
        } else if (activePath.data.type == 'polygon') {
          activePath.segments[hitIndex].point.x = point.x;
          activePath.segments[hitIndex].point.y = point.y;
        }
      }
    };
    this.panTool.onKeyDown = e => {
      if (e.key === 'delete' || e.key === 'backspace') {
        this.group.getItems().forEach(e => {
          if (e.selected) {
            e.remove();
          }
        });
      }
    };
  }
  onResize(e) {}

  initRectangleTool() {
    let rect;
    this.rectangleTool.onMouseDrag = e => {
      let temp = new paper.Path({ parent: this.group });
      let point = temp.globalToLocal(e.point);
      let downPoint = temp.globalToLocal(e.downPoint);
      temp.remove();

      rect = this.addRectangle(
        { from: downPoint, to: point, strokeColor: 'red', strokeWidth: 3, fillColor: '#ff000033' },
        {}
      );

      rect.removeOnDrag();
    };
  }

  initPolygonTool() {
    let polygon;
    let clickTime = -1000;

    this.polygonTool.onMouseUp = e => {
      let temp = new paper.Path({ parent: this.group });
      let point = temp.globalToLocal(e.point);
      temp.remove();
      if (!polygon) {
        polygon = this.addPolygon(
          [],
          {
            strokeColor: 'red',
            strokeWidth: 3,
            fillColor: '#ff000033',
          },
          {}
        );
      }
      //双击
      if (e.timeStamp - clickTime < 300) {
        clickTime = -1000;
        if (polygon.segments.length < 3) {
          polygon.remove();
        }
        polygon.closed = true;
        polygon = null;
      } else {
        clickTime = e.timeStamp;
        polygon.add(point);
      }
    };
    this.polygonTool.onMouseMove = e => {
      if (polygon) {
        let temp = new paper.Path({ parent: this.group });
        let point = temp.globalToLocal(e.point);
        temp.remove();
        var path1 = new paper.Path.Line({
          from: polygon.firstSegment.point,
          to: point,
          strokeColor: 'red',
          strokeWidth: 3,
          fillColor: '#ff000033',
          parent: this.group,
        });
        path1.removeOnMove();
        var path2 = new paper.Path.Line({
          from: polygon.lastSegment.point,
          to: point,
          strokeColor: 'red',
          strokeWidth: 3,
          fillColor: '#ff000033',
          parent: this.group,
        });
        path2.removeOnMove();
      }
    };
  }

  addRectangle(option, data) {
    let rect = new paper.Path.Rectangle(Object.assign({ parent: this.group }, option));
    rect.data = Object.assign({ type: 'rectangle' }, data);
    rect.onMouseEnter = e => {
      if (this.mode === 'pan') {
        this.el.style.cursor = 'move';
      }
    };
    rect.onMouseLeave = e => {
      if (this.mode === 'pan') {
        this.el.style.cursor = 'default';
      }
    };
    return rect;
  }
  addPolygon(points = [], option, data) {
    let polygon = new paper.Path(Object.assign({ parent: this.group, closed: true }, option));
    polygon.data = Object.assign({ type: 'polygon' }, data);
    points.forEach(point => {
      polygon.add(point);
    });
    polygon.onMouseEnter = e => {
      if (this.mode === 'pan') {
        this.el.style.cursor = 'move';
      }
    };
    polygon.onMouseLeave = e => {
      if (this.mode === 'pan') {
        this.el.style.cursor = 'default';
      }
    };
    return polygon;
  }

  setMode(mode) {
    paper.project.selectedItems.forEach(item => {
      item.selected = false;
    });
    this.mode = mode;
    switch (mode) {
      case 'pan':
        this.panTool.activate();
        this.el.style.cursor = 'default';
        break;
      case 'rectangle':
        this.rectangleTool.activate();
        this.el.style.cursor = 'crosshair';
        break;
      case 'polygon':
        this.polygonTool.activate();
        this.el.style.cursor = 'crosshair';
        break;
      default:
        break;
    }
  }
  getAll(option) {
    return this.group.getItems(option);
  }
}
