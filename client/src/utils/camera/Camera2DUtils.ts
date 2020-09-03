namespace Muse {
  ///  <summary>
  ///  BaseBehaviors get to decide a desired position for the camera.
  ///  They are first in line for the calculation.
  ///  </summary>
  export interface ICameraBaseBehavior extends ICameraPositionAssertion {
    enable();
    disable();
    isEnabled(): boolean;
  }

  ///  <summary>
  ///  Effectors get evaluated after BaesBehaviors.
  ///  They each have a weight that is used for a weighted average to get a final
  ///  camera position. The BaseBehavior has a weight of 1f
  ///  which should be taken into account when deciding your Effector's weight.
  ///  </summary>
  export interface ICameraEffector extends ICameraPositionAssertion {
    ///  <summary>
    ///  each effector has a weight that changes
    ///  how much it effects the final position. When the position is calculated the
    ///  camera base behavior has a weight of 1.
    ///  Your effectors can have weights larger than one
    ///  if you want them weighted more than the
    ///  base behavior
    ///  </summary>
    getEffectorWeight(): number;
  }

  ///  <summary>
  ///  common interface for BaseBehaviors and Effectors.
  ///  Importantly, basePosition is the camera's position plus the offsets
  ///  of CameraKit. The method should return the desired offset
  ///  from that position that it wants the camera to be moved by.
  ///  </summary>
  export interface ICameraPositionAssertion {
    getDesiredPositionDelta(
      targetBounds: Muse.RectangleF,
      basePosition: Vector,
      targetAvgVelocity: Vector
    ): Vector;
  }

  ///  <summary>
  ///  camera finalizers get the final say for the camera position.
  ///  They are sorted by priority and passed the current and desired
  ///  camera positions. shouldSkipSmoothingThisFrame will ONLY be called
  ///  on a priority 0 finalizer. It allows the finalizer to
  ///  force smoothing to None. This is important when the finalizer
  ///  has a position change that is absolute (extents are a good
  ///  example since you never want to display outside of your extents).
  ///  </summary>
  export interface ICameraFinalizer {
    getFinalCameraPosition(
      targetBounds: Muse.RectangleF,
      currentCameraPosition: Vector,
      desiredCameraPosition: Vector
    ): Vector;

    getFinalizerPriority(): number;
    shouldSkipSmoothingThisFrame(): boolean;
  }

  export enum CameraSmoothingType {
    None,
    SmoothDamp,
    Spring,
    Lerp,
  }

  export enum CameraAxis {
    Horizontal = 1 << 0,
    Vertical = 1 << 1,
  }

  export class FixedSizedVectorQueue {
    public constructor(limit: number) {
      this._limit = limit;
      this._list = [];
    }

    public push(item: Vector) {
      if (this._list.length === this._limit) {
        this._list.splice(0, 1);
      }

      this._list.push(item);
    }

    public average(): Vector {
      let avg = Vector.zero;
      //  early out for no items
      if (this._list.length === 0) {
        return avg;
      }

      for (let i = 0; i < this._list.length; i++) {
        avg = avg.add(this._list[i]);
      }

      return avg.scale(1 / this._list.length);
    }

    private _list: Vector[];
    private _limit: number;
  }
}
