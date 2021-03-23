class MyLabel {
  factor = 1.25;
  minZoom = 0.1;
  maxZoom = 10;
  constructor(el, image) {
    paper.install(window);
    paper.setup(el);
    this.el = el;
    this.image = image;
    this.raster = null;
    this.group = new Group({
      applyMatrix: false,
      position: [0, 0],
      selected: true,
    });
    this.panTool = new Tool();
    this.rectangleTool = new Tool();
    this.polygonTool = new Tool();
    this.init();
    this.initPanTool();
    this.initRectangleTool();
    this.initPolygonTool();
  }

  init() {
    this.raster = new Raster({
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
    view.onResize = this.onResize;
  }
  onMouseWheel(event) {
    const delta = event.deltaY;
    const mousePos = new paper.Point(event.offsetX, event.offsetY);
    const oldZoom = view.zoom;
    const oldCenter = view.center;
    const viewPos = view.viewToProject(mousePos);
    let newZoom = delta < 0 ? view.zoom * this.factor : view.zoom / this.factor;
    newZoom = Math.max(newZoom, this.minZoom);
    newZoom = Math.min(newZoom, this.maxZoom);
    view.zoom = newZoom;
    const zoomScale = oldZoom / newZoom;
    const centerAdjust = viewPos.subtract(oldCenter);
    const offset = viewPos.subtract(centerAdjust.multiply(zoomScale)).subtract(oldCenter);
    view.center = view.center.add(offset);
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
      console.log(hitResult);
      project.selectedItems.forEach(item => {
        item.selected = false;
      });
      if (hitResult && hitResult.item.className !== 'Raster') {
        hitResult.item.selected = true;
        activePath = hitResult.item;
      }
      if (hitResult && hitResult.type === 'fill') {
        panMode = 'fill';
      } else if (hitResult && hitResult.type === 'stroke') {
        panMode = 'stroke';
        hitIndex = hitResult.location.index;
      } else if (hitResult && hitResult.type === 'segment') {
        panMode = 'segment';
        hitIndex = hitResult.segment.index;
      } else {
        panMode = '';
      }
      console.log('panMode', panMode);
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
  }
  onResize(e) {}

  initRectangleTool() {
    let rect;
    this.rectangleTool.onMouseDrag = e => {
      rect = new Path.Rectangle({
        from: e.downPoint,
        to: e.point,
        strokeColor: 'red',
        strokeWidth: 3,
        fillColor: '#ff000033',
        data: {
          type: 'rectangle',
        },
        parent: this.group,
      });
      rect.removeOnDrag();
    };
  }

  initPolygonTool() {
    let polygon;
    let clickTime = -1000;
    this.polygonTool.onMouseUp = e => {
      if (!polygon) {
        polygon = new Path({
          strokeColor: 'red',
          strokeWidth: 3,
          fillColor: '#ff000033',
          data: {
            type: 'polygon',
          },
          parent: this.group,
        });
      }
      if (e.timeStamp - clickTime < 300) {
        clickTime = -1000;
        polygon.closed = true;
        polygon = null;
      } else {
        clickTime = e.timeStamp;
        polygon.add(e.point);
      }
    };
  }

  addRectangle(option) {
    option.data = Object.assign({ type: 'rectangle' }, option.data);
    option.parent = this.group;
    new Path.Rectangle(option);
  }
  addPolygon(points = [], option) {
    option.data = Object.assign({ type: 'polygon' }, option.data);
    option.parent = this.group;
    option.closed = true;
    let polygon = new Path(option);
    points.forEach(point => {
      polygon.add(point);
    });
  }

  setMode(mode) {
    project.selectedItems.forEach(item => {
      item.selected = false;
    });
    switch (mode) {
      case 'pan':
        this.panTool.activate();
        break;
      case 'rectangle':
        this.rectangleTool.activate();
        break;
      case 'polygon':
        this.polygonTool.activate();
        break;
      default:
        break;
    }
  }
  getAll(option) {
    return this.group.getItems(option);
  }
}
