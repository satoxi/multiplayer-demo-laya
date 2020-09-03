namespace Muse {
  export class CameraKit2D {
    public get camera(): Camera2D {
      return this._camera;
    }

    public target: Entity;
    // percentage from -0.5 - 0.5 from the center of the screen
    public horizontalOffset: number = 0;
    // percentage from -0.5 - 0.5 from the center of the screen
    public verticalOffset: number = 0;

    ////////////////// Platform Snap ////////////////////
    // all platform snap settings only apply if enablePlatformSnap is true
    public enablePlatformSnap: boolean;
    // If true, no other base behaviors will be able to
    // modify the y-position of the camera when grounded
    public isPlatformSnapExclusiveWhenEnabled: boolean;
    // Range(-10, 10)
    public platformSnapVerticalOffset: number = 0;
    // This should be set as the player becomes grounded/ungrounded
    // if using platform snap
    public isPlayerGrounded: boolean = false;

    ////////////////// Smoothing ////////////////////
    public cameraSmoothingType: CameraSmoothingType = CameraSmoothingType.None;
    // approximately the time it will take to reach the target.
    // A smaller value will reach the target faster.
    public smoothDampTime: number = 0.08;
    // lower values are less damped and higher values are more damped
    // resulting in less springiness. should be between 0.01f,
    // 1f to avoid unstable systems.
    public springDampingRatio: number = 0.7;
    // An angular frequency of 2pi (radians per second) means the
    // oscillation completes one full period over one second, i.e. 1Hz.
    // should be less than 35 or so to remain stable
    public springAngularFrequency: number = 20;
    public lerpTowardsFactorX: number = 0.002; // the smaller, the faster
    public lerpTowardsFactorY: number = 0.002; // the smaller, the faster

    public constructor() {
      this._camera = new Camera2D();
      this._targetBounds = new RectangleF(0, 0, 0, 0);
    }

    public warpToTarget() {
      const oriSmooth = this.cameraSmoothingType;
      this.cameraSmoothingType = CameraSmoothingType.None;
      this.lateUpdate(Number.POSITIVE_INFINITY);
      this.cameraSmoothingType = oriSmooth;
    }

    public lateUpdate(dt: number) {
      if (!this.target) {
        return;
      }

      let targetBounds = null;
      if (this.target.collider) {
        targetBounds = this.target.collider.bounds;
      } else {
        this._targetBounds.x = this.target.x - this.target.pivotX;
        this._targetBounds.y = this.target.y - this.target.pivotY;
        this._targetBounds.width = this.target.spriteWidth;
        this._targetBounds.height = this.target.spriteHeight;
        targetBounds = this._targetBounds;
      }

      dt /= 1000;
      //  we keep track of the target's velocity since some camera behaviors need to know about it
      const { center } = targetBounds;
      const velocity = center.sub(this._targetPositionLastFrame).scale(1 / dt);
      this._averageVelocityQueue.push(velocity);
      this._targetPositionLastFrame.x = center.x;
      this._targetPositionLastFrame.y = center.y;
      //  fetch the average velocity for use in our camera behaviors
      const targetAvgVelocity = this._averageVelocityQueue.average();
      //  we use the transform.position plus the offset when passing the base position to our camera behaviors
      const basePosition = this.getNormalizedCameraPosition();
      const accumulatedDeltaOffset = Vector.zero;
      for (let i = 0; i < this._baseCameraBehaviors.length; i++) {
        const cameraBehavior = this._baseCameraBehaviors[i];
        if (cameraBehavior.isEnabled()) {
          //  once we get the desired position we have to subtract the offset that we previously added
          const desiredPos = cameraBehavior.getDesiredPositionDelta(
            targetBounds,
            basePosition,
            targetAvgVelocity
          );
          accumulatedDeltaOffset.addEqual(desiredPos);
        }
      }

      if (this.enablePlatformSnap && this.isPlayerGrounded) {
        //  when exclusive, no base behaviors can mess with y
        if (this.isPlatformSnapExclusiveWhenEnabled) {
          accumulatedDeltaOffset.y = 0;
        }

        const desiredOffset =
          targetBounds.y - (basePosition.y - this.platformSnapVerticalOffset);
        accumulatedDeltaOffset.y += desiredOffset;
      }

      //  fetch our effectors
      let totalWeight = 0;
      let accumulatedEffectorPosition = Vector.zero;
      for (let i = 0; i < this._cameraEffectors.length; i++) {
        const weight = this._cameraEffectors[i].getEffectorWeight();
        const position = this._cameraEffectors[i].getDesiredPositionDelta(
          targetBounds,
          basePosition,
          targetAvgVelocity
        );
        totalWeight = totalWeight + weight;
        accumulatedEffectorPosition = accumulatedEffectorPosition.add(
          position.scale(weight)
        );
      }

      let desiredPosition = this.camera.position.add(accumulatedDeltaOffset);
      //  if we have a totalWeight we need to take into account our effectors
      if (totalWeight > 0) {
        totalWeight += 1;
        accumulatedEffectorPosition.addEqual(desiredPosition);
        const finalAccumulatedPosition = accumulatedEffectorPosition.scale(
          1 / totalWeight
        );
        desiredPosition = finalAccumulatedPosition;
      }

      let smoothing = this.cameraSmoothingType;
      //  and finally, our finalizers have a go if we have any
      for (let i = 0; i < this._cameraFinalizers.length; i++) {
        desiredPosition = this._cameraFinalizers[i].getFinalCameraPosition(
          targetBounds,
          this.camera.position,
          desiredPosition
        );
        //  allow the finalizer with a 0 priority to skip smoothing if it wants to
        if (
          i === 0 &&
          this._cameraFinalizers[i].getFinalizerPriority() === 0 &&
            this._cameraFinalizers[i].shouldSkipSmoothingThisFrame()
        ) {
          smoothing = CameraSmoothingType.None;
        }
      }

      //  time to smooth our movement to the desired position
      switch (smoothing) {
        case CameraSmoothingType.None:
          this.camera.setTranslation(desiredPosition.x, desiredPosition.y);
          break;
        case CameraSmoothingType.SmoothDamp:
          const smoothP = MathUtils.smoothDampVector(
            this.camera.position,
            desiredPosition,
            this._cameraVelocity,
            this.smoothDampTime,
            Number.POSITIVE_INFINITY,
            dt
          );
          this.camera.setTranslation(smoothP.x, smoothP.y);
          break;
        case CameraSmoothingType.Spring:
          const springP = this.fastSpring(
            this.camera.position,
            desiredPosition,
            dt
          );
          this.camera.setTranslation(springP.x, springP.y);
          break;
        case CameraSmoothingType.Lerp:
          const lerpX = this.lerpTowards(
            this.camera.position.x,
            desiredPosition.x,
            this.lerpTowardsFactorX,
            dt
          );
          const lerpY = this.lerpTowards(
            this.camera.position.y,
            desiredPosition.y,
            this.lerpTowardsFactorY,
            dt
          );
          this.camera.setTranslation(lerpX, lerpY);
          break;
      }
    }

    public getNormalizedCameraPosition(): Vector {
      return this.camera.viewportToWorldPoint(
        new Vector(0.5 + this.horizontalOffset, 0.5 + this.verticalOffset)
      );
    }

    public addCameraBaseBehavior(cameraBehavior: ICameraBaseBehavior) {
      this._baseCameraBehaviors.push(cameraBehavior);
    }

    public removeCameraBaseBehavior(cameraBehavior: ICameraBaseBehavior) {
      for (let i = this._baseCameraBehaviors.length - 1; i >= 0; i--) {
        if (this._baseCameraBehaviors[i] === cameraBehavior) {
          this._baseCameraBehaviors.splice(i, 1);
          return;
        }
      }
    }

    public addCameraEffector(cameraEffector: ICameraEffector) {
      this._cameraEffectors.push(cameraEffector);
    }

    public removeCameraEffector(cameraEffector: ICameraEffector) {
      for (let i = this._cameraEffectors.length - 1; i >= 0; i--) {
        if (this._cameraEffectors[i] === cameraEffector) {
          this._cameraEffectors.splice(i, 1);
          return;
        }
      }
    }

    public addCameraFinalizer(cameraFinalizer: ICameraFinalizer) {
      this._cameraFinalizers.push(cameraFinalizer);
      //  sort the list if we need to
      if (this._cameraFinalizers.length > 1) {
        this._cameraFinalizers.sort(
          (a, b) => a.getFinalizerPriority() - b.getFinalizerPriority()
        );
      }
    }

    public removeCameraFinalizer(cameraFinalizer: ICameraFinalizer) {
      for (let i = this._cameraFinalizers.length - 1; i >= 0; i--) {
        if (this._cameraFinalizers[i] === cameraFinalizer) {
          this._cameraFinalizers.splice(i, 1);
          return;
        }
      }
    }

    // http://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/
    private lerpTowardsVector(
      from: Vector,
      to: Vector,
      remainingFactorPerSecond: number,
      dt: number
    ): Vector {
      return Vector.lerp(from, to, 1 - Math.pow(remainingFactorPerSecond, dt));
    }

    private lerpTowards(
      from: number,
      to: number,
      remainingFactorPerSecond: number,
      dt: number
    ): number {
      return Muse.MathUtils.lerp(
        from,
        to,
        1 - Math.pow(remainingFactorPerSecond, dt)
      );
    }

    ///  <summary>
    ///  uses the semi-implicit euler method. faster, but not always stable.
    ///  see http://allenchou.net/2015/04/game-math-more-on-numeric-springing/
    ///  </summary>
    ///  <returns>The spring.</returns>
    ///  <param name="currentValue">Current value.</param>
    ///  <param name="targetValue">Target value.</param>
    ///  <param name="velocity">Velocity by reference.
    ///  Be sure to reset it to 0 if changing the targetValue between calls</param>
    ///  <peram name="dampingRatio">lower values are less damped and higher values
    ///  are more damped resulting in less springiness.
    ///  should be between 0.01f, 1f to avoid unstable systems.</param>
    ///  <param name="angularFrequency">An angular frequency of 2pi (radians per second)
    ///  means the oscillation completes one
    ///  full period over one second, i.e. 1Hz.
    ///  should be less than 35 or so to remain stable</param>
    private fastSpring(
      currentValue: Vector,
      targetValue: Vector,
      dt: number
    ): Vector {
      this._cameraVelocity.addEqual(
        this._cameraVelocity.scale(
          -2 * dt * this.springDampingRatio * this.springAngularFrequency
        )
      );
      this._cameraVelocity.addEqual(
        targetValue
          .sub(currentValue)
          .scale(dt * this.springAngularFrequency * this.springAngularFrequency)
      );
      currentValue.addEqual(this._cameraVelocity.scale(dt));
      return currentValue;
    }

    private _baseCameraBehaviors: ICameraBaseBehavior[] = [];
    private _cameraEffectors: ICameraEffector[] = [];
    private _cameraFinalizers: ICameraFinalizer[] = [];
    private _averageVelocityQueue: FixedSizedVectorQueue = new FixedSizedVectorQueue(
      10
    );

    private _camera: Camera2D;
    private _targetPositionLastFrame: Vector = Vector.zero;
    private _cameraVelocity: Vector = Vector.zero;
    private _targetBounds: RectangleF;
  }
}
