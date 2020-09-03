namespace Muse {
  export abstract class Collider {
    public static readonly lateSortOrder = 999;
    ///  <summary>
    ///  the underlying Shape of the Collider
    ///  </summary>
    public shape: Shape;
    public castSortOrder: number = 0;

    public get entity(): Entity {
      return this._entity;
    }

    public set entity(value: Entity) {
      this._entity = value;
    }

    public get enabled(): boolean {
      return this._isEnabled;
    }

    public set enabled(enabled: boolean) {
      if (enabled !== this._isEnabled) {
        this._isEnabled = enabled;
        this.onEnabledChanged();
      }
    }

    ///  <summary>
    /// localOffset is added to entity.position to get the final position
    /// for the collider geometry. This allows you to add multiple
    /// Colliders to an Entity and position them separately
    /// and also lets you set the point of rotation/scale.
    ///  </summary>
    public get localOffset(): Vector {
      return this._localOffset;
    }
    public set localOffset(value: Vector) {
      this.setLocalOffset(value.x, value.y);
    }

    ///  <summary>
    ///  represents the absolute position to this Collider.
    ///  It is entity.transform.position + localPosition - origin.
    ///  </summary>
    ///  <value>The absolute position.</value>
    public get absolutePosition(): Vector {
      return this._localOffset.add(this.position);
    }

    public get position(): Vector {
      return new Vector(this._entity.x, this._entity.y);
    }

    ///  <summary>
    ///  wraps Transform.rotation and returns 0
    ///  if this Collider does not rotate with the Entity
    ///  else it returns Transform.rotation
    ///  </summary>
    ///  <value>The rotation.</value>
    public get rotation(): number {
      return this.shouldColliderScaleAndRotateWithTransform
        ? this._entity.rotation
        : 0;
    }

    public get isRotationDirty(): boolean {
      return this._isRotationDirty;
    }

    ///  <summary>
    ///  if this collider is a trigger it will not cause collisions but it will still trigger events
    ///  </summary>
    public isTrigger: boolean;

    ///  <summary>
    ///  physicsLayer can be used as a filter when dealing with collisions.
    ///  The Flags class has methods to assist with bitmasks.
    ///  </summary>
    public physicsLayer: number = 1 << 0;

    ///  <summary>
    ///  layer mask of all the layers this Collider should collide with
    ///  when Entity.move methods are used. defaults to all layers.
    ///  </summary>
    public collidesWithLayers: number = Physics.allLayers;

    ///  <summary>
    ///  if true, the Collider will scale and rotate following the Transform it is attached to
    ///  </summary>
    public shouldColliderScaleAndRotateWithTransform: boolean = true;

    public get localOffsetLength(): number {
      return this._localOffsetLength;
    }

    public get bounds(): RectangleF {
      if (this._isPositionDirty || this._isRotationDirty) {
        this.shape.recalculateBounds(this);
        this.debugDraw();
        this._isRotationDirty = false;
        this._isPositionDirty = false;
      }
      return this.shape.bounds;
    }

    ///  <summary>
    ///  the bounds of this Collider when it was registered with the Physics system.
    ///  Storing this allows us to always be able to
    ///  safely remove the Collider from the Physics system
    ///  even if it was moved before attempting to remove it.
    ///  </summary>
    public registeredPhysicsBounds: RectangleF;

    public onEnabledChanged() {
      if (this._isEnabled && this.entity.enabled) {
        this.onEnable();
      } else {
        this.onDisable();
      }
    }

    public setLocalOffset(offsetX: number, offsetY: number): Collider {
      if (this._localOffset.x !== offsetX || this._localOffset.y !== offsetY) {
        const registered = this._isColliderRegistered;
        if (registered) {
          this.unregisterColliderWithPhysicsSystem();
        }
        this._localOffset.setTo(offsetX, offsetY);
        this._localOffsetLength = this._localOffset.magnitude();
        this._isPositionDirty = true;
        if (registered) {
          this.registerColliderWithPhysicsSystem();
        }
      }

      return this;
    }

    ///  <summary>
    ///  if set to true, the Collider will scale and rotate following the Transform it is attached to
    ///  </summary>
    ///  <returns>The should collider scale and rotate with transform.</returns>
    ///  <param name="shouldColliderScaleAndRotateWithTransform">If set to
    ///  <c>true</c> should collider scale and rotate with transform.</param>
    public setShouldColliderScaleAndRotateWithTransform(
      shouldColliderScaleAndRotateWithTransform: boolean
    ): Collider {
      this.shouldColliderScaleAndRotateWithTransform = shouldColliderScaleAndRotateWithTransform;
      this._isRotationDirty = true;
      this._isPositionDirty = true;
      return this;
    }

    public onAddedToEntity() {
      if (this._colliderRequiresAutoSizing) {
        //  we only deal with boxes and circles here
        const bounds = this._entity.spriteBounds;
        const renderableBounds = new RectangleF(
          bounds.x,
          bounds.y,
          bounds.width,
          bounds.height
        );
        // we need the size * inverse scale here because
        // when we autosize the Collider it needs to be without a scaled Renderable
        const width = renderableBounds.width / this._entity.scaleX;
        const height = renderableBounds.height / this._entity.scaleY;
        //  circle colliders need special care with the origin
        if (this instanceof CircleCollider) {
          const circleCollider = this as CircleCollider;
          circleCollider.radius = Math.max(width, height) * 0.5;
          // fetch the Renderable's center,
          // transfer it to local coordinates and use that
          // as the localOffset of our collider
          this.localOffset = renderableBounds.center.sub(
            new Vector(this._entity.x, this._entity.y)
          );
        } else if (this instanceof BoxCollider) {
          const boxCollider = this as BoxCollider;
          boxCollider.width = width;
          boxCollider.height = height;
          // fetch the Renderable's center,
          // transfer it to local coordinates and use that
          // as the localOffset of our collider
          this.localOffset = renderableBounds.center.sub(
            new Vector(this._entity.x, this._entity.y)
          );
        }
      }

      this._isParentEntityAddedToScene = true;
      this.registerColliderWithPhysicsSystem();
    }

    public onRemovedFromEntity() {
      this.unregisterColliderWithPhysicsSystem();
      this._isParentEntityAddedToScene = false;
    }

    public onEntityTransformChanged(comp: TransformComponent) {
      //  set the appropriate dirty flags
      switch (comp) {
        case TransformComponent.position:
          this._isPositionDirty = true;
          break;
        case TransformComponent.scale:
          this._isPositionDirty = true;
          break;
        case TransformComponent.rotation:
          this._isRotationDirty = true;
          break;
      }

      if (this._isColliderRegistered) {
        Physics.updateCollider(this);
      }
    }

    public registerColliderWithPhysicsSystem() {
      //  entity could be null if properties such as origin are changed before we are added to an Entity
      if (this._isParentEntityAddedToScene && !this._isColliderRegistered) {
        Physics.addCollider(this);
        this._isColliderRegistered = true;
      }
    }

    ///  <summary>
    ///  the parent Entity will call this at various times (when removed from a scene, disabled, etc)
    ///  </summary>
    public unregisterColliderWithPhysicsSystem() {
      if (this._isParentEntityAddedToScene && this._isColliderRegistered) {
        Physics.removeCollider(this);
      }
      this._isColliderRegistered = false;
    }

    public overlaps(other: Collider): boolean {
      return this.shape.overlaps(other.shape);
    }

    ///  <summary>
    ///  checks to see if this Collider collides with collider.
    ///  If it does, true will be returned and result will be populated
    ///  with collision data
    ///  </summary>
    ///  <returns><c>true</c>, if with was collidesed, <c>false</c> otherwise.</returns>
    ///  <param name="collider">Collider.</param>
    ///  <param name="result">Result.</param>
    public collidesWith(collider: Collider, result: CollisionResult): boolean {
      if (this.shape.collidesWithShape(collider.shape, result)) {
        result.collider = collider;
        return true;
      }

      result.collider = null;
      return false;
    }

    ///  <summary>
    ///  checks to see if this Collider with motion applied (delta movement vector)
    /// collides with collider. If it does, true will be
    ///  returned and result will be populated with collision data.
    ///  </summary>
    ///  <returns><c>true</c>, if with was collidesed,
    ///  <c>false</c> otherwise.</returns>
    ///  <param name="collider">Collider.</param>
    ///  <param name="motion">Motion.</param>
    ///  <param name="result">Result.</param>
    public willCollideWith(
      collider: Collider,
      motion: Vector,
      result: CollisionResult
    ): boolean {
      //  alter the shapes position so that it is in the place
      //  it would be after movement so we can check for overlaps
      const oldPosition = this.shape.position;
      this.shape.position = this.shape.position.add(motion);
      const didCollide = this.shape.collidesWithShape(collider.shape, result);
      if (didCollide) {
        result.collider = collider;
      }

      //  return the shapes position to where it was before the check
      this.shape.position = oldPosition;
      return didCollide;
    }

    ///  <summary>
    ///  checks to see if this Collider collides with any other Colliders in the Scene.
    ///  The first Collider it intersects will have its collision
    ///  data returned in the CollisionResult.
    ///  </summary>
    ///  <returns><c>true</c>, if with was collidesed, <c>false</c> otherwise.</returns>
    ///  <param name="result">Result.</param>
    public collidesWithAny(
      result: CollisionResult,
      includeTrigger?: boolean
    ): boolean {
      //  fetch anything that we might collide with at our new position
      const neighbors: Collider[] = Physics.boxcastBroadphaseExcludingSelf(
        this,
        this.bounds,
        this.collidesWithLayers
      );
      for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i];
        if (neighbor.isTrigger && !includeTrigger) {
          continue;
        }

        if (this.collidesWith(neighbor, result)) {
          return true;
        }
      }

      return false;
    }

    ///  <summary>
    ///  checks to see if this Collider with motion applied (delta movement vector)
    ///  collides with any collider. If it does, true will be
    ///  returned and result will be populated with collision data.
    ///  Motion will be set to the maximum distance the Collider can travel
    ///  before colliding.
    ///  </summary>
    ///  <returns><c>true</c>, if with was collidesed, <c>false</c> otherwise.</returns>
    ///  <param name="motion">Motion.</param>
    ///  <param name="result">Result.</param>
    public willCollideWithAny(
      motion: Vector,
      result: CollisionResult,
      ignoredColliders?: Set<Collider>
    ): boolean {
      //  fetch anything that we might collide with at our new position
      const colliderBounds = this.bounds;
      colliderBounds.x = colliderBounds.x + motion.x;
      colliderBounds.y = colliderBounds.y + motion.y;
      const neighbors: Collider[] = Physics.boxcastBroadphaseExcludingSelf(
        this,
        colliderBounds,
        this.collidesWithLayers
      );
      //  alter the shapes position so that
      // it is in the place it would be after movement so we can check for overlaps
      const oldPosition = this.shape.position;
      this.shape.position = this.shape.position.add(motion);
      let didCollide = false;
      for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i];
        if (
          neighbor.isTrigger ||
          (ignoredColliders && ignoredColliders.has(neighbor))
        ) {
          continue;
        }

        if (this.collidesWith(neighbor, result)) {
          //  hit. back off our motion and our Shape.position
          motion.subEqual(result.minimumTranslationVector);
          this.shape.position = this.shape.position.sub(
            result.minimumTranslationVector
          );
          didCollide = true;
        }
      }

      //  return the shapes position to where it was before the check
      this.shape.position = oldPosition;
      return didCollide;
    }

    public enableDebug() {
      if (!this._debugCollider) {
        this._debugCollider = new Laya.Sprite();
      }
      this.debugDraw();
    }

    protected onEnable() {
      this.registerColliderWithPhysicsSystem();
      this._isRotationDirty = true;
      this._isPositionDirty = true;
    }

    protected onDisable() {
      this.unregisterColliderWithPhysicsSystem();
    }

    private debugDraw() {
      if (this._debugCollider) {
        this._debugCollider.removeSelf();
        // tslint:disable-next-line:no-string-literal
        const entitySprite = this.entity['_sprite'];
        if (entitySprite.parent) {
          entitySprite.parent.addChild(this._debugCollider);
        } else {
          Laya.stage.addChild(this._debugCollider);
        }
        const sprite = this._debugCollider;
        sprite.graphics.clear();
        sprite.alpha = 0.3;
        sprite.zOrder = entitySprite.zOrder + 1;
        if (this instanceof BoxCollider) {
          const bounds = this.shape.bounds;
          sprite.graphics.drawRect(
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height,
            '#212121'
          );
        } else if (this instanceof CircleCollider) {
          const bounds = this.shape.bounds;
          sprite.graphics.drawCircle(
            bounds.center.x,
            bounds.center.y,
            bounds.width / 2,
            '#212121'
          );
        }
      }
    }

    protected _colliderRequiresAutoSizing: boolean;
    // flag to keep track of if our Entity was added to a Scene
    protected _isParentEntityAddedToScene: boolean;
    // flag to keep track of if we registered ourself with the Physics system
    protected _isColliderRegistered: boolean;
    protected _isPositionDirty: boolean = true;
    protected _isRotationDirty: boolean = true;

    protected _entity: Entity;
    protected _isEnabled: boolean = true;
    protected _localOffsetLength: number;
    protected _localOffset: Vector = new Vector(0, 0);
    private _debugCollider: Laya.Sprite;
  }
}
