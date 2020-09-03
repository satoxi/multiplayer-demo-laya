namespace Muse {
  export abstract class AbstractCameraBehavior implements ICameraBaseBehavior {
    public isEnabled(): boolean {
      return this._isEnabled;
    }
    public enable() {
      this._isEnabled = true;
    }
    public disable() {
      this._isEnabled = false;
    }
    public abstract getDesiredPositionDelta(
      targetBounds: RectangleF,
      basePosition: Vector,
      targetAvgVelocity: Vector
    );

    private _isEnabled = false;
  }

  export class PositionLocking extends AbstractCameraBehavior {
    public axis: CameraAxis = CameraAxis.Horizontal | CameraAxis.Vertical;

    /////// Projected Focus ////////
    // projected focus will have the camera push ahead
    // in the direction of the current velocity which is averaged over 5 frames
    public enableProjectedFocus: boolean;
    // when projected focus is enabled the multiplier will increase the forward projection
    public projectedFocusMultiplier: number = 3;

    public getDesiredPositionDelta(
      targetBounds: RectangleF,
      basePosition: Vector,
      targetAvgVelocity: Vector
    ): Vector {
      const centerPos = this.getCenterBasedOnContraints(
        basePosition,
        targetBounds.center
      );
      const desiredOffset = targetBounds.center.sub(centerPos);
      // projected focus uses the velocity to project forward
      // TODO: this needs proper smoothing.
      // it only uses the avg velocity right now which can jump around
      if (this.enableProjectedFocus) {
        const hasHorizontal =
          (this.axis & CameraAxis.Horizontal) === CameraAxis.Horizontal;
        const hasVertical =
          (this.axis & CameraAxis.Vertical) === CameraAxis.Vertical;
        const hasBothAxis = hasHorizontal && hasVertical;
        if (hasBothAxis) {
          desiredOffset.addEqual(
            targetAvgVelocity.scale(
              (timer.deltaTime / 1000) * this.projectedFocusMultiplier
            )
          );
        } else if (hasHorizontal) {
          desiredOffset.x =
            desiredOffset.x +
            targetAvgVelocity.x *
              ((timer.deltaTime / 1000) * this.projectedFocusMultiplier);
        } else if (hasVertical) {
          desiredOffset.y =
            desiredOffset.y +
            targetAvgVelocity.y *
              ((timer.deltaTime / 1000) * this.projectedFocusMultiplier);
        }
      }

      return desiredOffset;
    }

    /// <summary>
    /// gets a center point for our position locking calculation
    /// based on the CameraAxis. The targetPosition is needed so that if
    /// only one axis is present we don't calculate a desired position
    /// in that direction.
    /// </summary>
    /// <returns>The center based on contraints.</returns>
    /// <param name="targetPosition">Target position.</param>
    private getCenterBasedOnContraints(
      basePosition: Vector,
      targetPosition: Vector
    ): Vector {
      const centerPos = basePosition.clone();
      // if we arent contrained to an axis make it match the targetPosition
      // so we dont have any offset in that direction
      if ((this.axis & CameraAxis.Horizontal) !== CameraAxis.Horizontal) {
        centerPos.x = targetPosition.x;
      }

      if ((this.axis & CameraAxis.Vertical) !== CameraAxis.Vertical) {
        centerPos.y = targetPosition.y;
      }

      return centerPos;
    }
  }

  export class CameraWindow extends AbstractCameraBehavior {
    public width: number = 150;
    public height: number = 150;
    public axis: CameraAxis = CameraAxis.Horizontal | CameraAxis.Vertical;

    public getDesiredPositionDelta(
      targetBounds: RectangleF,
      basePosition: Vector,
      targetAvgVelocity: Vector
    ): Vector {
      const desiredOffset = Vector.zero;
      const hasHorizontal =
        (this.axis & CameraAxis.Horizontal) === CameraAxis.Horizontal;
      const hasVertical =
        (this.axis & CameraAxis.Vertical) === CameraAxis.Vertical;
      const bounds = new RectangleF(
        basePosition.x - this.width / 2,
        basePosition.y - this.height / 2,
        this.width,
        this.height
      );
      if (
        !bounds.contains(targetBounds.right, targetBounds.bottom) ||
        !bounds.contains(targetBounds.x, targetBounds.y)
      ) {
        //  figure out the minimum distance we need to move to get the player back in our bounds
        //  x-axis
        if (hasHorizontal && bounds.x > targetBounds.x) {
          desiredOffset.x = targetBounds.x - bounds.x;
        } else if (hasHorizontal && bounds.right < targetBounds.right) {
          desiredOffset.x = targetBounds.right - bounds.right;
        }

        //  y-axis. disregard movement above the trap when in platform snap mode
        if (hasVertical && bounds.y > targetBounds.y) {
          desiredOffset.y = targetBounds.y - bounds.y;
        } else if (hasVertical && bounds.bottom < targetBounds.bottom) {
          desiredOffset.y = targetBounds.bottom - bounds.bottom;
        }
      }

      return desiredOffset;
    }
  }

  export enum DualForwardFocusType {
    ThresholdBased,
    VelocityBased,
    DirectionBased,
  }

  export class DualForwardFocus extends AbstractCameraBehavior {
    // Range(0, 20)
    public width: number = 3;

    public dualForwardFocusType: DualForwardFocusType;

    ///////// Threshold Based //////////
    // Range(0.5, 5)
    public dualForwardFocusThresholdExtents: number = 0.5;
    private _currentEdgeFocus: Edge;

    public velocityInfluenceMultiplier: number = 3;

    public getDesiredPositionDelta(
      targetBounds: RectangleF,
      basePosition: Vector,
      targetAvgVelocity: Vector
    ): Vector {
      const desiredOffset = Vector.zero;
      if (this.dualForwardFocusType === DualForwardFocusType.ThresholdBased) {
        const deltaPositionFromBounds = Vector.zero;
        let didLastEdgeContactChange = false;
        let rightEdge: number;
        let leftEdge: number;
        if (this._currentEdgeFocus === Edge.Left) {
          rightEdge = basePosition.x - this.width * 0.5;
          leftEdge = rightEdge - this.dualForwardFocusThresholdExtents * 0.5;
        } else {
          leftEdge = basePosition.x + this.width * 0.5;
          rightEdge = leftEdge + this.dualForwardFocusThresholdExtents * 0.5;
        }

        if (leftEdge > targetBounds.center.x) {
          deltaPositionFromBounds.x = targetBounds.center.x - leftEdge;
          if (this._currentEdgeFocus === Edge.Left) {
            didLastEdgeContactChange = true;
            this._currentEdgeFocus = Edge.Right;
          }
        } else if (rightEdge < targetBounds.center.x) {
          deltaPositionFromBounds.x = targetBounds.center.x - rightEdge;
          if (this._currentEdgeFocus === Edge.Right) {
            didLastEdgeContactChange = true;
            this._currentEdgeFocus = Edge.Left;
          }
        }

        const desiredX =
          this._currentEdgeFocus === Edge.Left ? rightEdge : leftEdge;
        desiredOffset.x = targetBounds.center.x - desiredX;
        //  if we didnt switch direction this works much like a normal camera window
        if (!didLastEdgeContactChange) {
          desiredOffset.x = deltaPositionFromBounds.x;
        }
      } else {
        const averagedHorizontalVelocity = targetAvgVelocity.x;
        //  direction switches are determined by velocity
        if (averagedHorizontalVelocity > 0) {
          this._currentEdgeFocus = Edge.Left;
        } else if (averagedHorizontalVelocity < 0) {
          this._currentEdgeFocus = Edge.Right;
        }

        let desiredX =
          this._currentEdgeFocus === Edge.Left
            ? basePosition.x - this.width * 0.5
            : basePosition.x + this.width * 0.5;
        desiredX = targetBounds.center.x - desiredX;
        if (this.dualForwardFocusType === DualForwardFocusType.DirectionBased) {
          desiredOffset.x = desiredX;
        } else {
          const velocityMultiplier = Math.max(
            1,
            Math.abs(averagedHorizontalVelocity)
          );
          desiredOffset.x = MathUtils.lerp(
            0,
            desiredX,
            (timer.deltaTime / 1000) *
              (this.velocityInfluenceMultiplier * velocityMultiplier)
          );
        }
      }

      return desiredOffset;
    }
  }
}
