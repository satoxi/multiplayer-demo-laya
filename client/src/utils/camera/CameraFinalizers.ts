namespace Muse {
  export class MapExtentsFinalizer implements ICameraFinalizer {
    public snapToBottom: boolean;
    public snapToTop: boolean;
    public snapToRight: boolean;
    public snapToLeft: boolean;
    public bounds: RectangleF;

    public getFinalCameraPosition(
      targetBounds: RectangleF,
      currentCameraPosition: Vector,
      desiredCameraPosition: Vector
    ): Vector {
      this._shouldSkipSmoothingThisFrame = false;
      // orthographicSize is 0.5 * height. aspect is width / height.
      // that makes this calculation equal 0.5 * width
      const orthoSize = Laya.stage.height / 2;
      const orthographicHalfWidth = Laya.stage.width / 2;
      //  clamp the camera position to the maps bounds
      //  left
      if (
        this.snapToLeft &&
        desiredCameraPosition.x - orthographicHalfWidth < this.bounds.x
      ) {
        this._shouldSkipSmoothingThisFrame = true;
        desiredCameraPosition.x = this.bounds.x + orthographicHalfWidth;
      }

      //  right
      if (
        this.snapToRight &&
        desiredCameraPosition.x + orthographicHalfWidth > this.bounds.right
      ) {
        this._shouldSkipSmoothingThisFrame = true;
        desiredCameraPosition.x = this.bounds.max.x - orthographicHalfWidth;
      }

      //  top
      if (
        this.snapToTop &&
        desiredCameraPosition.y + orthoSize > this.bounds.bottom
      ) {
        this._shouldSkipSmoothingThisFrame = true;
        desiredCameraPosition.y = this.bounds.max.y - orthoSize;
      }

      //  bottom
      if (
        this.snapToBottom &&
        desiredCameraPosition.y - orthoSize < this.bounds.y
      ) {
        this._shouldSkipSmoothingThisFrame = true;
        desiredCameraPosition.y = this.bounds.y + orthoSize;
      }

      return desiredCameraPosition;
    }

    public getFinalizerPriority(): number {
      return 0;
    }

    public shouldSkipSmoothingThisFrame(): boolean {
      return this._shouldSkipSmoothingThisFrame;
    }

    private _shouldSkipSmoothingThisFrame: boolean;
  }
}
