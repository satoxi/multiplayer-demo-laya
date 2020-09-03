/// <reference path='../ecs/Component.ts' />

namespace Muse {
  ///  <summary>
  ///  Note that this is not a full, multi-iteration physics system!
  /// This can be used for simple, arcade style physics.
  ///  Based on http://elancev.name/oliver/2D%20polygon.htm#tut5
  ///  </summary>
  export class ArcadeRigidbody extends EntityComponent {
    ///  <summary>
    ///  mass of this rigidbody.
    /// A 0 mass will make this an immovable object.
    ///  </summary>
    ///  <value>The mass.</value>
    public get mass(): number {
      return this._mass;
    }
    public set mass(value: number) {
      this.setMass(value);
    }

    ///  <summary>
    ///  0 - 1 range where 0 is no bounce and 1 is perfect reflection
    ///  </summary>
    public get elasticity(): number {
      return this._elasticity;
    }
    public set elasticity(value: number) {
      this.setElasticity(value);
    }

    ///  <summary>
    ///  0 - 1 range. 0 means no friction, 1 means the object will stop dead on
    ///  </summary>
    public get friction(): number {
      return this._friction;
    }
    public set friction(value: number) {
      this.setFriction(value);
    }

    ///  <summary>
    ///  0 - 9 range. When a collision occurs and
    ///  it has risidual motion along the surface of collision
    ///  if its square magnitude is less
    ///  than glue friction will be set to the maximum for the collision resolution.
    ///  </summary>
    public get glue(): number {
      return this._glue;
    }
    public set glue(value: number) {
      this.setGlue(value);
    }

    ///  <summary>
    ///  if true, Physics.gravity will be taken into account each frame
    ///  </summary>
    public shouldUseGravity: boolean = true;

    ///  <summary>
    ///  velocity of this rigidbody
    ///  </summary>
    public velocity: Vector;

    ///  <summary>
    ///  rigidbodies with a mass of 0 are considered immovable.
    ///  Changing velocity and collisions will have no effect on them.
    ///  </summary>
    ///  <value><c>true</c> if is immovable; otherwise, <c>false</c>.</value>
    public get isImmovable(): boolean {
      return this._mass < 0.0001;
    }

    public constructor() {
      super();
      this._inverseMass = 1 / this._mass;
    }

    public setMass(mass: number): ArcadeRigidbody {
      this._mass = Math.max(mass, 0);
      if (this._mass > 0.0001) {
        this._inverseMass = 1 / this._mass;
      } else {
        this._inverseMass = 0;
      }

      return this;
    }

    ///  <summary>
    ///  0 - 1 range where 0 is no bounce and 1 is perfect reflection
    ///  </summary>
    ///  <returns>The elasticity.</returns>
    ///  <param name="value">Value.</param>
    public setElasticity(value: number): ArcadeRigidbody {
      this._elasticity = MathUtils.clamp(value, 0, 1);
      return this;
    }

    ///  <summary>
    ///  0 - 1 range. 0 means no friction, 1 means the object will stop dead on
    ///  </summary>
    ///  <returns>The friction.</returns>
    ///  <param name="value">Value.</param>
    public setFriction(value: number): ArcadeRigidbody {
      this._friction = MathUtils.clamp(value, 0, 1);
      return this;
    }

    ///  <summary>
    ///  0 - 9 range. When a collision occurs and
    ///  it has risidual motion along the surface of collision
    ///  if its square magnitude is less
    ///  than glue friction will be set to the maximum for the collision resolution.
    ///  </summary>
    ///  <returns>The glue.</returns>
    ///  <param name="value">Value.</param>
    public setGlue(value: number): ArcadeRigidbody {
      this._glue = MathUtils.clamp(value, 0, 10);
      return this;
    }

    ///  <summary>
    ///  velocity of this rigidbody
    ///  </summary>
    ///  <returns>The velocity.</returns>
    ///  <param name="velocity">Velocity.</param>
    public setVelocity(velocity: Vector): ArcadeRigidbody {
      this.velocity = velocity;
      return this;
    }

    public addImpulse(force: Vector, dt: number) {
      if (!this.isImmovable) {
        this.velocity.addEqual(
          force.scale(100000 * (this._inverseMass * (dt * dt)))
        );
      }
    }

    public onAddedToEntity() {
      this._collider = this.entity.collider;
      if (!this._collider) {
        console.warn('ArcadeRigidbody has no Collider');
      }
    }

    public update(dt: number) {
      if (this.isImmovable || this._collider == null) {
        this.velocity = Vector.zero;
        return;
      }

      if (this.shouldUseGravity) {
        this.velocity.addEqual(Physics.gravity.scale(dt));
      }

      this.entity.pos(
        this.entity.x + this.velocity.x * dt,
        this.entity.y + this.velocity.y * dt
      );
      const collisionResult: CollisionResult = new CollisionResult();
      //  fetch anything that we might collide with at our new position
      const neighbors = Physics.boxcastBroadphaseExcludingSelf(
        this._collider,
        this._collider.bounds,
        this._collider.collidesWithLayers
      );
      for (const neighbor of neighbors) {
        //  if the neighbor collider is of the same entity, ignore it
        if (neighbor.entity === this.entity) {
          continue;
        }

        if (this._collider.collidesWith(neighbor, collisionResult)) {
          //  if the neighbor has an ArcadeRigidbody
          //  we handle full collision response.
          //  If not, we calculate things based on the
          //  neighbor being immovable.
          const neighborRigidbody = neighbor.entity.getComponent<
            ArcadeRigidbody
          >(SystemEntityComponentType.rigidbody);
          if (neighborRigidbody != null) {
            this.processOverlap(
              neighborRigidbody,
              collisionResult.minimumTranslationVector
            );
            this.processCollision(
              neighborRigidbody,
              collisionResult.minimumTranslationVector
            );
          } else {
            //  neighbor has no ArcadeRigidbody so we assume its immovable and only move ourself

            this.entity.pos(
              this.entity.x - collisionResult.minimumTranslationVector.x,
              this.entity.y - collisionResult.minimumTranslationVector.y
            );
            const relativeVelocity = this.calculateResponseVelocity(
              this.velocity,
              collisionResult.minimumTranslationVector
            );
            this.velocity.addEqual(relativeVelocity);
          }
        }
      }
    }

    ///  <summary>
    ///  separates two overlapping rigidbodies. Handles the case of either being immovable as well.
    ///  </summary>
    ///  <param name="other">Other.</param>
    ///  <param name="minimumTranslationVector"></param>
    private processOverlap(
      other: ArcadeRigidbody,
      minimumTranslationVector: Vector
    ) {
      if (this.isImmovable) {
        other.entity.pos(
          other.entity.x + minimumTranslationVector.x,
          other.entity.y + minimumTranslationVector.y
        );
      } else if (other.isImmovable) {
        this.entity.pos(
          this.entity.x - minimumTranslationVector.x,
          this.entity.y - minimumTranslationVector.y
        );
      } else {
        this.entity.pos(
          this.entity.x - minimumTranslationVector.x * 0.5,
          this.entity.y - minimumTranslationVector.y * 0.5
        );
        other.entity.pos(
          other.entity.x + minimumTranslationVector.x * 0.5,
          other.entity.y + minimumTranslationVector.y * 0.5
        );
      }
    }

    ///  <summary>
    ///  handles the collision of two non-overlapping rigidbodies.
    ///  New velocities will be assigned to each rigidbody as appropriate.
    ///  </summary>
    ///  <param name="other">Other.</param>
    ///  <param name="inverseMTV">Inverse MT.</param>
    private processCollision(
      other: ArcadeRigidbody,
      minimumTranslationVector: Vector
    ) {
      //  we compute a response for the two colliding objects.
      //  The calculations are based on the relative velocity of the objects
      //  which gets reflected along the collided surface normal.
      //  Then a part of the response gets added to each object based on mass.
      let relativeVelocity = this.velocity.sub(other.velocity);
      relativeVelocity = this.calculateResponseVelocity(
        relativeVelocity,
        minimumTranslationVector
      );
      //  now we use the masses to linearly scale the response on both rigidbodies
      const totalInverseMass = this._inverseMass + other._inverseMass;
      const ourResponseFraction = this._inverseMass / totalInverseMass;
      const otherResponseFraction = other._inverseMass / totalInverseMass;
      this.velocity.addEqual(relativeVelocity.scale(ourResponseFraction));
      other.velocity.subEqual(relativeVelocity.scale(otherResponseFraction));
    }

    ///  <summary>
    ///  given the relative velocity between the two objects and
    ///  the MTV this method modifies the relativeVelocity to make it a collision
    ///  response.
    ///  </summary>
    ///  <param name="relativeVelocity">Relative velocity.</param>
    ///  <param name="minimumTranslationVector">Minimum translation vector.</param>
    private calculateResponseVelocity(
      /* ref */ relativeVelocity: Vector,
      /* ref */ minimumTranslationVector: Vector
    ): Vector {
      //  first, we get the normalized MTV in the opposite direction: the surface normal
      const inverseMTV = minimumTranslationVector.scale(-1);
      const normal: Vector = inverseMTV.normalize();
      //  the velocity is decomposed along the normal of the collision
      //  and the plane of collision.
      //  The elasticity will affect the response
      //  along the normal (normalVelocityComponent) and the friction will affect
      //  the tangential component of the velocity (tangentialVelocityComponent)
      const n: number = relativeVelocity.dot(normal);
      let normalVelocityComponent = normal.scale(n);
      const tangentialVelocityComponent = relativeVelocity.sub(
        normalVelocityComponent
      );
      if (n > 0) {
        normalVelocityComponent = Vector.zero;
      }

      //  if the squared magnitude of the tangential component
      // is less than glue then we bump up the friction to the max
      let coefficientOfFriction = this._friction;
      if (tangentialVelocityComponent.sqrMagnitude() < this._glue) {
        coefficientOfFriction = 1.01;
      }

      //  elasticity affects the normal component of the velocity and
      //  friction affects the tangential component
      return normalVelocityComponent
        .scale(1 + this._elasticity)
        .sub(tangentialVelocityComponent.scale(coefficientOfFriction))
        .scale(-1);
    }

    private _mass: number = 10;
    private _elasticity: number = 0.5;
    private _friction: number = 0.5;
    private _glue: number = 0.01;
    private _inverseMass: number;
    private _collider: Collider;
  }
}
