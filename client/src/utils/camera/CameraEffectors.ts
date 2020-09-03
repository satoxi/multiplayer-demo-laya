namespace Muse {
  export class CueFocusRing implements ICameraEffector, ITriggerListener {
    // when true, an additional inner ring can be used to
    // have it's own specific weight indpendent of the outer ring
    public enableInnerRing: boolean = false;
    public outerRingRadius: number = 8;
    public insideRingRadius: number = 2;
    public outsideEffectorWeight: number = 0.5;
    public insideEffectorWeight: number = 5;

    // The curve should go from 0 to 1 being the normalized distance from center to radius.
    // It's value will be multiplied by the effectorWeight to get the final weight used.
    public effectorFalloffCurve: AnimCurve;

    private _trackedTarget: Entity;

    constructor(
      cameraKit: CameraKit2D,
      entity: Entity,
      outerRingRadius: number = 8
    ) {
      this._cameraKit = cameraKit;
      this._entity = entity;
      this.outerRingRadius = outerRingRadius;
      (this._entity.collider as CircleCollider).radius = this.outerRingRadius;
    }

    public onTriggerEnter(other: Collider) {
      if (other.entity.name === 'player') {
        this._trackedTarget = other.entity;
        this._cameraKit.addCameraEffector(this);
      }
    }

    public onTriggerExit(other: Collider) {
      if (other.entity === this._trackedTarget) {
        this._trackedTarget = null;
        this._cameraKit.removeCameraEffector(this);
      }
    }

    public getEffectorWeight(): number {
      const distanceToTarget = Vector.distance(
        new Vector(this._entity.x, this._entity.y),
        new Vector(this._trackedTarget.x, this._trackedTarget.y)
      );
      if (this.enableInnerRing && distanceToTarget <= this.insideRingRadius) {
        return this.insideEffectorWeight;
      }

      const t = 1 - distanceToTarget / this.outerRingRadius;
      return this.effectorFalloffCurve
        ? this.effectorFalloffCurve.lerp(t) * this.outsideEffectorWeight
        : t * this.outsideEffectorWeight;
    }

    public getDesiredPositionDelta(
      targetBounds: RectangleF,
      basePosition: Vector,
      targetAvgVelocity: Vector
    ): Vector {
      return new Vector(this._entity.x, this._entity.y);
    }

    private _cameraKit: CameraKit2D;
    private _entity: Entity;
  }
}
