namespace Muse {
  export class ZoomDrag {
    public minScale = 1;
    public maxScale = 1.5;
    public maxScaleOverFactor = 1.3;
    public minScaleOverFactor = 1.1;

    public constructor(
      element: Laya.Sprite,
      elementBounds: Laya.Rectangle,
      inputTarget: Laya.Sprite,
      hasInertia: boolean = true
    ) {
      this._element = element;
      this._elementBounds = elementBounds;
      this._inputTarget = inputTarget;
      this._hasInertia = hasInertia;
      this._panOffsets = [];

      this._touchkit = new Muse.TouchKit(this._inputTarget);
      const pinchR = new Muse.TKPinchRecognizer();
      pinchR.onPinchStart.addListener(this, this.onPinchStart);
      pinchR.onPinch.addListener(this, this.onPinch);
      pinchR.onPinchEnd.addListener(this, this.onPinchEnd);
      const panR = new Muse.TKPanRecognizer();
      panR.onPanStart.addListener(this, this.onPanStart);
      panR.onPan.addListener(this, this.onPan);
      panR.onPanEnd.addListener(this, this.onPanEnd);
      this._touchkit.addGestureRecognizer(panR);
      this._touchkit.addGestureRecognizer(pinchR);
      this._touchkit.onInputStart.addListener(this, this.onInputStart);
      this._touchkit.onInputEnd.addListener(this, this.onInputEnd);
    }

    public enable() {
      this._touchkit.enable();
      Laya.stage.on(Laya.Event.MOUSE_WHEEL, this, this.onMouseWheel);
      this.updateDragRegion();
    }

    public disable() {
      this._touchkit.disable();
      if (
        this._element.scaleX < this.minScale ||
        this._element.scaleX > this.maxScale
      ) {
        this.updateScale(
          MathUtils.clamp(this._element.scaleX, this.minScale, this.maxScale)
        );
      }
      Laya.stage.off(Laya.Event.MOUSE_WHEEL, this, this.onMouseWheel);
    }

    public stopScaleAnim() {
      Muse.TweenMgr.stopAllTweensWithTarget(this._element);
    }

    public onScaleUpdate(clampPos: boolean = true) {
      this.updateDragRegion();
      if (clampPos) {
        this.clampPos();
      }
    }

    private onMouseWheel(e) {
      const scaleDelta = Muse.MathUtils.mapMinMax(e.delta, -18, 18, 0.5, 1.5);
      let scale = this._element.scaleX * scaleDelta;
      scale = Muse.MathUtils.clamp(scale, this.minScale, this.maxScale);
      this.updateScale(scale, true);
    }

    private onPanStart(pr: Muse.TKPanRecognizer) {
      this.stopScaleAnim();
      this._panOffsets = [];
      this.updateDragRegion();
      Laya.TouchManager.I.preDowns = [];
      this._element.pos(
        this._element.x + pr.deltaTranslation.x,
        this._element.y + pr.deltaTranslation.y
      );
      this.clampPos();
    }

    private onPan(pr: Muse.TKPanRecognizer) {
      this.stopScaleAnim();
      this._panOffsets.push(pr.deltaTranslation.clone());
      this._element.pos(
        this._element.x + pr.deltaTranslation.x,
        this._element.y + pr.deltaTranslation.y
      );
      this.clampPos();
    }

    private onPanEnd(e) {}

    private onInputStart() {
      this.stopScaleAnim();
    }

    private onInputEnd() {
      const inertiaOffset = this.getPanInertiaOffset();
      this.revertScale(this._pinchCenter, inertiaOffset[0], inertiaOffset[1]);
      this._pinchCenter = null;
      this._panOffsets = [];
    }

    private onPinchStart(ev) {
      this.stopScaleAnim();
      this._scaleOnPinch = this._element.scaleX;
      this._posXOnPinch = this._element.x;
      this._posYOnPinch = this._element.y;
      const center = ev.center;
      this._pinchCenter = new Vector(center.x, center.y);
      this._panOffsets = [];
      Laya.TouchManager.I.preDowns = [];
      // console.log('on pinch start', ev.scale, center);
    }

    private onPinch(ev) {
      let scale = this._scaleOnPinch * ev.scale;
      scale = Muse.MathUtils.clamp(
        scale,
        this.minScale / this.minScaleOverFactor,
        this.maxScale * this.maxScaleOverFactor
      );
      if (scale >= this.maxScale * this.maxScaleOverFactor) {
        return;
      }

      const center = ev.center;
      // console.log('on pinch', ev.scale, center);
      const xOffset = center.x - this._pinchCenter.x;
      const yOffset = center.y - this._pinchCenter.y;
      const x = (this._posXOnPinch - this._pinchCenter.x) * (ev.scale - 1);
      const y = (this._posYOnPinch - this._pinchCenter.y) * (ev.scale - 1);
      this._element.x = this._posXOnPinch + xOffset + x;
      this._element.y = this._posYOnPinch + yOffset + y;

      this.updateScale(scale, true);
    }

    private onPinchEnd(ev) {
      const center = ev.center;
      this._pinchCenter = new Vector(center.x, center.y);
      // console.log('on pinch end', this._pinchCenter);
    }

    private getPanInertiaOffset() {
      const n = Math.min(this._panOffsets.length, 3);
      if (n === 0 || !this._hasInertia) {
        return [0, 0];
      }
      const offsets = this._panOffsets.slice(this._panOffsets.length - n);
      let offsetX = 0;
      let offsetY = 0;
      for (let i = 0; i < offsets.length; i += 1) {
        offsetX += offsets[i].x;
        offsetY += offsets[i].y;
      }
      offsetX = offsetX / n;
      offsetY = offsetY / n;
      if (Math.abs(offsetX) > this.maxOffset) {
        offsetX = offsetX > 0 ? this.maxOffset : -this.maxOffset;
      }
      if (Math.abs(offsetY) > this.maxOffset) {
        offsetY = offsetY > 0 ? this.maxOffset : -this.maxOffset;
      }
      let num = offsetX;
      while (Math.abs(num) > 1) {
        num *= this.inertiaRatio;
        offsetX += num;
      }
      num = offsetY;
      while (Math.abs(num) > 1) {
        num *= this.inertiaRatio;
        offsetY += num;
      }
      return [offsetX, offsetY];
    }

    private updateScale(scale: number, clampPos: boolean = true) {
      this._element.scale(scale, scale);
      this.onScaleUpdate(clampPos);
    }

    private clampPos() {
      this._element.x = Muse.MathUtils.clamp(
        this._element.x,
        this._currentDragRegion.x,
        this._currentDragRegion.right
      );
      this._element.y = Muse.MathUtils.clamp(
        this._element.y,
        this._currentDragRegion.y,
        this._currentDragRegion.bottom
      );
    }

    private revertScale(center, inertiaX: number, inertiaY: number) {
      if (
        this._element.scaleX >= this.minScale &&
        this._element.scaleY <= this.maxScale
      ) {
        return;
      }

      this.stopScaleAnim();
      const scale = Muse.MathUtils.clamp(
        this._element.scaleX,
        this.minScale,
        this.maxScale
      );
      let offsetX = 0;
      let offsetY = 0;
      if (center) {
        offsetX =
          (this._element.x - center.x) * (scale / this._element.scaleX - 1);
        offsetY =
          (this._element.y - center.y) * (scale / this._element.scaleY - 1);
      }
      const x = Muse.MathUtils.clamp(
        this._element.x + offsetX + inertiaX,
        this._currentDragRegion.x,
        this._currentDragRegion.right
      );
      const y = Muse.MathUtils.clamp(
        this._element.y + offsetY + inertiaY,
        this._currentDragRegion.y,
        this._currentDragRegion.bottom
      );
      Muse.tweenProps(
        this._element,
        { scaleX: scale, scaleY: scale, x, y },
        400
      )
        .setUpdateHandler(this.onScaleUpdate.bind(this))
        .start();
    }

    private updateDragRegion(scale?: number) {
      if (!scale) {
        scale = this._element.scaleX;
      }
      let dragMaxX = -(this._elementBounds.x - this._element.pivotX) * scale;
      let dragMinX =
        Laya.stage.width -
        (this._elementBounds.right - this._element.pivotX) * scale;
      let dragMaxY = -(this._elementBounds.y - this._element.pivotY) * scale;
      let dragMinY =
        Laya.stage.height -
        (this._elementBounds.bottom - this._element.pivotY) * scale;
      if (dragMaxX < dragMinX) {
        dragMaxX = dragMinX = Laya.stage.width / 2;
      }
      if (dragMaxY < dragMinY) {
        dragMaxY = dragMinY = Laya.stage.height / 2;
      }
      this._currentDragRegion = new Laya.Rectangle(
        dragMinX,
        dragMinY,
        dragMaxX - dragMinX,
        dragMaxY - dragMinY
      );
    }

    private _element: Laya.Sprite;
    private _elementBounds: Laya.Rectangle;
    private _inputTarget: Laya.Sprite;
    private _touchkit: Muse.TouchKit;

    private _scaleOnPinch: number;
    private _posXOnPinch: number;
    private _posYOnPinch: number;
    private _pinchCenter: Vector;
    private _currentDragRegion: Laya.Rectangle;
    private _panOffsets: Vector[];
    private _hasInertia: boolean;

    private readonly maxOffset = 60;
    private readonly inertiaRatio = 0.92;
  }
}
