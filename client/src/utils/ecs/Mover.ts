/// <reference path='../ecs/Component.ts' />

namespace Muse {
  ///  <summary>
  ///  helper class illustrating one way to handle movement
  ///  taking into account all Collisions including triggers.
  ///  The ITriggerListener interface is used to manage callbacks to any triggers
  ///  that are breached while moving. An object must move only via the Mover.move
  ///  method for triggers to be properly reported. Note that multiple Movers
  ///  interacting with each other will end up calling ITriggerListener
  ///  multiple times.
  ///  </summary>
  export class Mover extends EntityComponent {
    public constructor(id: number) {
      super();
      this.id = id;
      this._triggerHelper = new ColliderTriggerHelper();
    }

    ///  <summary>
    ///  moves the entity taking collisions into account
    ///  </summary>
    ///  <returns><c>true</c>, if move actor was newed,
    ///  <c>false</c> otherwise.</returns>
    ///  <param name="motion">Motion.</param>
    ///  <param name="collisionResult">Collision result.</param>
    public move(motion: Vector, collisionResult: CollisionResult): boolean {
      collisionResult = new CollisionResult();
      //  no collider? just move and forget about it
      if (!this.entity.collider || !this._triggerHelper) {
        this.entity.pos(this.entity.x + motion.x, this.entity.y + motion.y);
        return false;
      }

      // 1. move all non-trigger Colliders and get closest collision
      const collider = this.entity.collider;
      //  skip triggers for now. we will revisit them after we move.
      if (!collider.isTrigger) {
        //  fetch anything that we might collide with at our new position
        const bounds = collider.bounds;
        bounds.x = bounds.x + motion.x;
        bounds.y = bounds.y + motion.y;
        const neighbors = Physics.boxcastBroadphaseExcludingSelf(
          collider,
          bounds,
          collider.collidesWithLayers
        );
        for (const neighbor of neighbors) {
          //  skip triggers for now. we will revisit them after we move.
          if (neighbor.isTrigger) {
            continue;
          }

          if (collider.willCollideWith(neighbor, motion, collisionResult)) {
            //  hit. back off our motion
            motion.subEqual(collisionResult.minimumTranslationVector);
          }
        }
      }

      // 2. move entity to its new position if we have a collision
      // else move the full amount. motion is updated when a collision occurs
      this.entity.pos(this.entity.x + motion.x, this.entity.y + motion.y);
      // 3. do an overlap check of all Colliders that are triggers
      // with all broadphase colliders, triggers or not.
      // Any overlaps result in trigger events.
      const colliders = [this.entity.collider];
      this._triggerHelper.update(colliders);
      return !!collisionResult.collider;
    }

    private _triggerHelper: ColliderTriggerHelper;
  }
}
