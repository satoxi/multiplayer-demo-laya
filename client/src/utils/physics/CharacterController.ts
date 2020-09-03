namespace Muse {
  class CharacterRaycastOrigins {
    public topLeft: Vector;
    public bottomRight: Vector;
    public bottomLeft: Vector;

    public constructor() {
      this.topLeft = Vector.zero;
      this.bottomRight = Vector.zero;
      this.bottomLeft = Vector.zero;
    }
  }

  class CharacterCollisionState2D {
    public right: boolean = false;
    public left: boolean = false;
    public above: boolean = false;
    public below: boolean = false;
    public becameGroundedThisFrame: boolean = false;
    public wasGroundedLastFrame: boolean = false;
    public movingDownSlope: boolean = false;
    public slopeAngle: number = 0;

    public hasCollision(): boolean {
      return this.below || this.right || this.left || this.above;
    }

    public reset(): void {
      this.right = this.left = false;
      this.above = this.below = false;
      this.becameGroundedThisFrame = this.movingDownSlope = false;
      this.slopeAngle = 0;
    }

    public toString(): string {
      // tslint:disable-next-line:max-line-length
      return `[CharacterCollisionState2D] r: ${this.right}, l: ${this.left}, a: ${this.above}, b: ${this.below}, movingDownSlope: ${this.movingDownSlope}, angle: ${this.slopeAngle}, wasGroundedLastFrame: ${this.wasGroundedLastFrame}, becameGroundedThisFrame: ${this.becameGroundedThisFrame}`;
    }
  }

  export class CharacterController implements ITriggerListener {
    public static debug: boolean = false;

    public onControllerCollidedEvent: Muse.ObservableT<RaycastHit>;
    public onTriggerEnterEvent: Muse.ObservableT<Collider>;
    public onTriggerExitEvent: Muse.ObservableT<Collider>;

    /// <summary>
    /// when true, one way platforms will be ignored
    /// when moving vertically for a single frame
    /// </summary>
    public ignoreOneWayPlatformsTime: number;
    public supportSlopedOneWayPlatforms: boolean;

    public ignoredColliders: Set<Muse.Collider> = new Set();

    /// <summary>
    /// defines how far in from the edges of the collider rays are cast from.
    /// If cast with a 0 extent it will often result in ray hits that are
    /// not desired (for example a foot collider casting horizontally
    /// from directly on the surface can result in a hit)
    /// </summary>
    public get skinWidth() {
      return this._skinWidth;
    }

    public set skinWidth(value: number) {
      this._skinWidth = value;
      this.recalculateDistanceBetweenRays();
    }

    /// <summary>
    /// the max slope angle that the CC2D can climb
    /// </summary>
    /// <value>The slope limit.</value>
    public slopeLimit: number = 30;

    /// <summary>
    /// the threshold in the change in vertical movement between frames that constitutes jumping
    /// </summary>
    /// <value>The jumping threshold.</value>
    public jumpingThreshold: number = -7;

    /// <summary>
    /// curve for multiplying speed based on slope
    /// (negative = down slope and positive = up slope)
    /// </summary>
    public slopeSpeedMultiplier: AnimCurve;

    public totalHorizontalRays: number = 5;
    public totalVerticalRays: number = 3;

    public collisionState: CharacterCollisionState2D = new CharacterCollisionState2D();
    public velocity: Vector = new Vector(0, 0);

    public get isGrounded(): boolean {
      return this.collisionState.below;
    }

    public get raycastHitsThisFrame(): RaycastHit[] {
      return this._raycastHitsThisFrame;
    }

    public constructor(
      player: Entity,
      skinWidth?: number,
      platformMask: number = -1,
      onewayPlatformMask: number = -1,
      triggerMask: number = -1
    ) {
      this.onTriggerEnterEvent = new ObservableT();
      this.onTriggerExitEvent = new ObservableT();
      this.onControllerCollidedEvent = new ObservableT();

      this.platformMask = platformMask;
      this.oneWayPlatformMask = onewayPlatformMask;
      this.triggerMask = triggerMask;

      // add our one-way platforms to our normal platform mask
      // so that we can land on them from above
      this.platformMask |= this.oneWayPlatformMask;

      this._player = player;
      this._player.collider.isTrigger = false;
      this._player.addTriggerListener(this);
      if (player.collider instanceof BoxCollider) {
        this._collider = player.collider as BoxCollider;
      } else {
        throw new Error('player collider must be box');
      }

      // here, we trigger our properties that have setters with bodies
      this.skinWidth = skinWidth || player.collider.width * 0.05;

      this._slopeLimitTangent = Math.tan(75 * MathUtils.deg2Rad);
      this._debugSprite = new Laya.Sprite();
      this._triggerHelper = new ColliderTriggerHelper();

      // we want to set our CC2D to ignore all collision layers
      // except what is in our triggerMask
      for (let i = 0; i < 32; i++) {
        // see if our triggerMask contains this layer and if not ignore it
        if ((this.triggerMask & (1 << i)) === 0) {
          Flags.unsetFlag(this._collider.collidesWithLayers, i);
        }
      }
    }

    public onTriggerEnter(other: Collider, local: Collider): void {
      this.onTriggerEnterEvent.notify(other);
    }

    public onTriggerExit(other: Collider, local: Collider): void {
      this.onTriggerExitEvent.notify(other);
    }

    /// <summary>
    /// attempts to move the character to position + deltaMovement.
    /// Any colliders in the way will cause the movement to
    /// stop when run into.
    /// </summary>
    /// <param name="deltaMovement">Delta movement.</param>
    public move(deltaMovement: Vector, deltaTime: number): void {
      if (CharacterController.debug) {
        this._debugSprite.graphics.clear();
      }
      // save off our current grounded state
      // which we will use for wasGroundedLastFrame and becameGroundedThisFrame
      this.collisionState.wasGroundedLastFrame = this.collisionState.below;

      // clear our state
      this.collisionState.reset();
      this._raycastHitsThisFrame = [];
      this._isGoingUpSlope = false;

      this.primeRaycastOrigins();

      // first, we check for a slope below us before moving
      // only check slopes if we are going down and grounded
      if (deltaMovement.y > 0 && this.collisionState.wasGroundedLastFrame) {
        deltaMovement = this.handleVerticalSlope(deltaMovement);
      }

      // now we check movement in the horizontal dir
      if (deltaMovement.x !== 0) {
        deltaMovement = this.moveHorizontally(deltaMovement);
      }

      // next, check movement in the vertical dir
      if (deltaMovement.y !== 0) {
        deltaMovement = this.moveVertically(deltaMovement);
      }

      // move then update our state
      this._player.pos(
        this._player.x + deltaMovement.x,
        this._player.y + deltaMovement.y
      );

      if (deltaTime > 0) {
        // only calculate velocity if we have a non-zero deltaTime
        this.velocity.x = deltaMovement.x / deltaTime;
        this.velocity.y = deltaMovement.y / deltaTime;
      }

      // set our becameGrounded state
      // based on the previous and current collision state
      if (
        !this.collisionState.wasGroundedLastFrame &&
        this.collisionState.below
      ) {
        this.collisionState.becameGroundedThisFrame = true;
      }

      // if we are going up a slope
      // we artificially set a y velocity so we need to zero it out here
      if (this._isGoingUpSlope) {
        this.velocity.y = 0;
      }

      if (!this._isWarpingToGround) {
        this._triggerHelper.update([this._collider]);
      }
      // send off the collision events if we have a listener
      for (let i = 0; i < this._raycastHitsThisFrame.length; i++) {
        this.onControllerCollidedEvent.notify(this._raycastHitsThisFrame[i]);
      }

      if (this.ignoreOneWayPlatformsTime > 0) {
        this.ignoreOneWayPlatformsTime -= deltaTime;
      }
    }

    /// <summary>
    /// moves directly down until grounded
    /// </summary>
    public warpToGrounded(maxDistance: number = 1000): void {
      this.ignoreOneWayPlatformsTime = 0;
      this._isWarpingToGround = true;
      let delta = 0;
      do {
        delta += 1;
        this.move(new Vector(0, 1), 0.02);
        if (delta > maxDistance) {
          break;
        }
      } while (!this.isGrounded);
      this._isWarpingToGround = false;
    }

    /// <summary>
    /// this should be called anytime you have to modify the BoxCollider2D at runtime.
    /// It will recalculate the distance between the rays used for collision detection.
    /// It is also used in the skinWidth setter in case it is changed at runtime.
    /// </summary>
    public recalculateDistanceBetweenRays(): void {
      // figure out the distance between our rays in both directions

      // horizontal
      const colliderUsableHeight =
        this._collider.height * Math.abs(this._player.scaleY) -
        2 * this._skinWidth;
      this._verticalDistanceBetweenRays =
        colliderUsableHeight / (this.totalHorizontalRays - 1);

      // vertical
      const colliderUsableWidth =
        this._collider.width * Math.abs(this._player.scaleX) -
        2 * this._skinWidth;
      this._horizontalDistanceBetweenRays =
        colliderUsableWidth / (this.totalVerticalRays - 1);
    }

    /// <summary>
    /// resets the raycastOrigins to the current extents of the box collider
    /// inset by the skinWidth. It is inset
    /// to avoid casting a ray from a position
    /// directly touching another collider which results in wonky normal data.
    /// </summary>
    /// <param name="futurePosition">Future position.</param>
    /// <param name="deltaMovement">Delta movement.</param>
    private primeRaycastOrigins(): void {
      // our raycasts need to be fired from the bounds inset by the skinWidth
      const rect = this._collider.bounds;
      this._raycastOrigins.topLeft = new Vector(
        rect.x + this._skinWidth,
        rect.y + this._skinWidth
      );
      this._raycastOrigins.bottomRight = new Vector(
        rect.right - this._skinWidth,
        rect.bottom - this._skinWidth
      );
      this._raycastOrigins.bottomLeft = new Vector(
        rect.x + this._skinWidth,
        rect.bottom - this._skinWidth
      );
    }

    /// <summary>
    /// we have to use a bit of trickery in this one.
    /// The rays must be cast from a small distance inside of our
    /// collider (skinWidth) to avoid zero distance rays
    // which will get the wrong normal. Because of this small offset
    /// we have to increase the ray distance skinWidth
    // then remember to remove skinWidth from deltaMovement before
    /// actually moving the player
    /// </summary>
    private moveHorizontally(deltaMovement: Vector): Vector {
      const isGoingRight = deltaMovement.x > 0;
      let rayDistance =
        Math.abs(deltaMovement.x) +
        this._skinWidth * this.rayOriginSkinMutiplier;
      const rayDirection: Vector = isGoingRight ? Vector.right : Vector.left;
      const initialRayOriginY = this._raycastOrigins.bottomLeft.y;
      const initialRayOriginX = isGoingRight
        ? this._raycastOrigins.bottomRight.x -
          this._skinWidth * (this.rayOriginSkinMutiplier - 1)
        : this._raycastOrigins.bottomLeft.x +
          this._skinWidth * (this.rayOriginSkinMutiplier - 1);

      for (let i = 0; i < this.totalHorizontalRays; i++) {
        const ray = new Vector(
          initialRayOriginX,
          initialRayOriginY - i * this._verticalDistanceBetweenRays
        );

        if (CharacterController.debug) {
          this.debugDrawRay(
            ray,
            rayDirection.scale(Math.max(rayDistance, 1)),
            '#ff0000'
          );
        }

        // if we are grounded we will include oneWayPlatforms
        // only on the first ray (the bottom one). this will allow us to
        // walk up sloped oneWayPlatforms
        if (
          i === 0 &&
          this.supportSlopedOneWayPlatforms &&
          this.collisionState.wasGroundedLastFrame
        ) {
          this._raycastHit = Physics.linecast(
            ray,
            ray.add(rayDirection.scale(rayDistance)),
            this.platformMask,
            this.ignoredColliders
          );
        } else {
          this._raycastHit = Physics.linecast(
            ray,
            ray.add(rayDirection.scale(rayDistance)),
            this.platformMask & ~this.oneWayPlatformMask,
            this.ignoredColliders
          );
        }

        if (this._raycastHit.collider) {
          // the bottom ray can hit a slope
          // but no other ray can so we have special handling for these cases
          if (
            i === 0 &&
            this.handleHorizontalSlope(
              deltaMovement,
              Vector.unsignedAngle(this._raycastHit.normal, Vector.up)
            )
          ) {
            this._raycastHitsThisFrame.push(this._raycastHit);
            break;
          }

          // set our new deltaMovement and recalculate the rayDistance taking it into account
          deltaMovement.x = this._raycastHit.point.x - ray.x;
          rayDistance = Math.abs(deltaMovement.x);

          // remember to remove the skinWidth from our deltaMovement
          if (isGoingRight) {
            deltaMovement.x -= this._skinWidth * this.rayOriginSkinMutiplier;
            this.collisionState.right = true;
          } else {
            deltaMovement.x += this._skinWidth * this.rayOriginSkinMutiplier;
            this.collisionState.left = true;
          }

          this._raycastHitsThisFrame.push(this._raycastHit);

          // we add a small fudge factor for the float operations here.
          // if our rayDistance is smaller
          // than the width + fudge bail out because we have a direct impact
          if (
            rayDistance <
            this._skinWidth * this.rayOriginSkinMutiplier +
              this.kSkinWidthFloatFudgeFactor
          ) {
            break;
          }
        }
      }

      return deltaMovement;
    }

    private moveVertically(deltaMovement: Vector): Vector {
      const isGoingUp = deltaMovement.y < 0;
      let rayDistance =
        Math.abs(deltaMovement.y) +
        this._skinWidth * this.rayOriginSkinMutiplier;
      const rayDirection = isGoingUp ? Vector.up : Vector.down;

      let initialRayOriginX = this._raycastOrigins.topLeft.x;
      const initialRayOriginY = isGoingUp
        ? this._raycastOrigins.topLeft.y +
          this._skinWidth * (this.rayOriginSkinMutiplier - 1)
        : this._raycastOrigins.bottomLeft.y -
          this._skinWidth * (this.rayOriginSkinMutiplier - 1);

      // apply our horizontal deltaMovement here
      // so that we do our raycast from the actual position we would be in if we had moved
      initialRayOriginX += deltaMovement.x;

      // if we are moving up, we should ignore the layers in oneWayPlatformMask
      let mask = this.platformMask;
      if (isGoingUp || this.ignoreOneWayPlatformsTime > 0) {
        mask &= ~this.oneWayPlatformMask;
      }

      for (let i = 0; i < this.totalVerticalRays; i++) {
        const rayStart = new Vector(
          initialRayOriginX + i * this._horizontalDistanceBetweenRays,
          initialRayOriginY
        );
        if (CharacterController.debug) {
          this.debugDrawRay(
            rayStart,
            rayDirection.scale(Math.max(rayDistance, 1)),
            '#ff0000'
          );
        }
        this._raycastHit = Physics.linecast(
          rayStart,
          rayStart.add(rayDirection.scale(rayDistance)),
          mask,
          this.ignoredColliders
        );
        if (this._raycastHit.collider) {
          // set our new deltaMovement and recalculate the rayDistance taking it into account
          deltaMovement.y = this._raycastHit.point.y - rayStart.y;
          rayDistance = Math.abs(deltaMovement.y);

          // remember to remove the skinWidth from our deltaMovement
          if (isGoingUp) {
            deltaMovement.y += this._skinWidth * this.rayOriginSkinMutiplier;
            this.collisionState.above = true;
          } else {
            deltaMovement.y -= this._skinWidth * this.rayOriginSkinMutiplier;
            this.collisionState.below = true;
          }

          this._raycastHitsThisFrame.push(this._raycastHit);

          // this is a hack to deal with the top of slopes.
          // if we walk up a slope and reach the apex we can get in a situation
          // where our ray gets a hit that is less then skinWidth
          // causing us to be ungrounded the next frame due to residual velocity.
          if (!isGoingUp && deltaMovement.y < -0.00001) {
            this._isGoingUpSlope = true;
          }

          // we add a small fudge factor for the float operations here. if our rayDistance is smaller
          // than the width + fudge bail out because we have a direct impact
          if (
            rayDistance <
            this._skinWidth * this.rayOriginSkinMutiplier +
              this.kSkinWidthFloatFudgeFactor
          ) {
            break;
          }
        }
      }

      return deltaMovement;
    }

    /// <summary>
    /// checks the center point under the BoxCollider2D for a slope.
    /// If it finds one then the deltaMovement is adjusted so that
    /// the player stays grounded and the slopeSpeedModifier is taken into account to speed up movement.
    /// </summary>
    /// <param name="deltaMovement">Delta movement.</param>
    private handleVerticalSlope(deltaMovement: Vector): Vector {
      // slope check from the center of our collider
      const centerOfCollider =
        (this._raycastOrigins.bottomLeft.x +
          this._raycastOrigins.bottomRight.x) *
        0.5;
      const rayDirection = Vector.down;

      // the ray distance is based on our slopeLimit
      const slopeCheckRayDistance =
        this._slopeLimitTangent *
        (this._raycastOrigins.bottomRight.x - centerOfCollider);

      const slopeRay = new Vector(
        centerOfCollider,
        this._raycastOrigins.bottomLeft.y
      );

      this._raycastHit = Physics.linecast(
        slopeRay,
        slopeRay.add(rayDirection.scale(slopeCheckRayDistance)),
        this.platformMask,
        this.ignoredColliders
      );
      if (this._raycastHit.collider) {
        // bail out if we have no slope
        const angle = Vector.unsignedAngle(this._raycastHit.normal, Vector.up);
        if (angle === 0) {
          return deltaMovement;
        }

        // we are moving down the slope if our normal and
        // movement direction are in the same x direction
        const isMovingDownSlope =
          Math.sign(this._raycastHit.normal.x) === Math.sign(deltaMovement.x);
        if (isMovingDownSlope) {
          // going down we want to speed up in most cases
          // so the slopeSpeedMultiplier curve should be > 1 for negative angles
          const slopeModifier = this.slopeSpeedMultiplier
            ? this.slopeSpeedMultiplier.lerp(-angle)
            : 1;
          // we add the extra downward movement here to
          // ensure we "stick" to the surface below
          deltaMovement.y +=
            this._raycastHit.point.y - slopeRay.y - this.skinWidth;
          deltaMovement.x *= slopeModifier;
          this.collisionState.movingDownSlope = true;
          this.collisionState.slopeAngle = angle;
        }
      }

      return deltaMovement;
    }

    /// <summary>
    /// handles adjusting deltaMovement if we are going up a slope.
    /// </summary>
    /// <returns><c>true</c>, if horizontal slope was handled,
    /// <c>false</c> otherwise.</returns>
    /// <param name="deltaMovement">Delta movement.</param>
    /// <param name="angle">Angle.</param>
    private handleHorizontalSlope(
      deltaMovement: Vector,
      angle: number
    ): boolean {
      // disregard 90 degree angles (walls)
      if (Math.round(angle) === 90) {
        return false;
      }

      // if we can walk on slopes and our angle is small enough we need to move up
      if (angle < this.slopeLimit) {
        // we only need to adjust the deltaMovement if we are not jumping
        // TODO: this uses a magic number which isn't ideal!
        // The alternative is to have the user pass in if there is a jump this frame
        if (deltaMovement.y > this.jumpingThreshold) {
          // apply the slopeModifier to slow our movement up the slope
          const slopeModifier = this.slopeSpeedMultiplier
            ? this.slopeSpeedMultiplier.lerp(angle)
            : 1;
          deltaMovement.x *= slopeModifier;

          // we dont set collisions on the sides
          // for this since a slope is not technically a side collision.
          // smooth y movement when we climb.
          // we make the y movement equivalent
          // to the actual y location that corresponds
          // to our new x location using our good friend Pythagoras
          deltaMovement.y = Math.abs(
            Math.tan(angle * MathUtils.deg2Rad) * deltaMovement.x
          );
          const isGoingRight = deltaMovement.x > 0;

          // safety check. we fire a ray in the direction of movement
          // just in case the diagonal we calculated above ends up
          // going through a wall. if the ray hits,
          // we back off the horizontal movement to stay in bounds.
          const ray = isGoingRight
            ? this._raycastOrigins.bottomRight
            : this._raycastOrigins.bottomLeft;
          let raycastHit = null;
          if (
            this.supportSlopedOneWayPlatforms &&
            this.collisionState.wasGroundedLastFrame
          ) {
            raycastHit = Physics.linecast(
              ray,
              ray.add(deltaMovement),
              this.platformMask,
              this.ignoredColliders
            );
          } else {
            raycastHit = Physics.linecast(
              ray,
              ray.add(deltaMovement),
              this.platformMask & ~this.oneWayPlatformMask,
              this.ignoredColliders
            );
          }

          if (raycastHit.collider) {
            // we crossed an edge when using Pythagoras calculation,
            // so we set the actual delta movement to the ray hit location
            deltaMovement.x = raycastHit.point.x - ray.x;
            deltaMovement.y = raycastHit.point.y - ray.y;
            if (isGoingRight) {
              deltaMovement.x -= this._skinWidth;
            } else {
              deltaMovement.x += this._skinWidth;
            }
          }

          this._isGoingUpSlope = true;
          this.collisionState.below = true;
        }
      } else {
        // too steep. get out of here
        deltaMovement.x = 0;
      }

      return true;
    }

    private debugDrawRay(start: Vector, dir: Vector, linecolor: string) {
      if (!this._debugSprite) {
        this._debugSprite = new Laya.Sprite();
        Laya.stage.addChild(this._debugSprite);
        this._debugSprite.zOrder = 99999;
      }
      this._debugSprite.graphics.drawLine(
        start.x,
        start.y,
        start.x + dir.x,
        start.y + dir.y,
        linecolor,
        2
      );
    }

    private _debugSprite: Laya.Sprite;
    private _player: Entity;
    private _collider: BoxCollider;
    private _skinWidth: number = 0.02;
    private _triggerHelper: ColliderTriggerHelper;

    /// <summary>
    /// this is used to calculate the downward ray
    /// that is cast to check for slopes. We use the somewhat arbitrary value 75 degrees
    /// to calculate the length of the ray that checks for slopes.
    /// </summary>
    private _slopeLimitTangent: number;

    private readonly kSkinWidthFloatFudgeFactor: number = 0.001;

    /// <summary>
    /// holder for our raycast origin corners (TR, TL, BR, BL)
    /// </summary>
    private _raycastOrigins: CharacterRaycastOrigins = new CharacterRaycastOrigins();

    /// <summary>
    /// stores our raycast hit during movement
    /// </summary>
    private _raycastHit: RaycastHit = new RaycastHit();

    /// <summary>
    /// stores any raycast hits that occur this frame.
    /// we have to store them in case we get a hit moving
    /// horizontally and vertically so that
    // we can send the events after all collision state is set
    /// </summary>
    private _raycastHitsThisFrame: RaycastHit[];

    // horizontal/vertical movement data
    private _verticalDistanceBetweenRays: number;
    private _horizontalDistanceBetweenRays: number;

    // we use this flag to mark the case
    // where we are travelling up a slope
    // and we modified our delta.y to allow the climb to occur.
    // the reason is so that if we reach the end of the slope
    // we can make an adjustment to stay grounded
    private _isGoingUpSlope: boolean = false;

    private _isWarpingToGround: boolean = true;

    private platformMask: number = -1;
    private triggerMask: number = -1;
    private oneWayPlatformMask: number = -1;

    private readonly rayOriginSkinMutiplier = 4;
  }
}
