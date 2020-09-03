namespace Muse {
  /**
   * moves taking collision into account only
   * for reporting to any ITriggerListeners.
   * The object will always move the full amount so it is up
   * to the caller to destroy it on impact if desired.
   */
  export class ProjectileMover extends EntityComponent {
    public /* override */ onAddedToEntity() {
      this._collider = this.entity.collider;
      if (!this._collider) {
        console.warn(
          'ProjectileMover has no Collider. ProjectilMover requires a Collider!'
        );
      }
    }

    ///  <summary>
    ///  moves the entity taking collisions into account
    ///  </summary>
    ///  <returns><c>true</c>, if move actor was newed, <c>false</c> otherwise.</returns>
    ///  <param name="motion">Motion.</param>
    public move(motion: Vector): boolean {
      if (this._collider == null) {
        return false;
      }

      let didCollide = false;
      //  fetch anything that we might collide with at our new position
      this.entity.pos(this.entity.x + motion.x, this.entity.y + motion.y);
      //  fetch anything that we might collide with us at our new position
      const neighbors = Physics.boxcastBroadphase(
        this._collider.bounds,
        this._collider.collidesWithLayers
      );
      for (const neighbor of neighbors) {
        if (this._collider.overlaps(neighbor)) {
          didCollide = true;
          this.notifyTriggerListeners(this._collider, neighbor);
        }
      }

      return didCollide;
    }

    private notifyTriggerListeners(self: Collider, other: Collider) {
      //  notify any listeners on the Entity of the Collider that we overlapped
      for (let i = 0; i < other.entity.triggerListeners.length; i++) {
        other.entity.triggerListeners[i].onTriggerEnter(self, other);
      }
      //  notify any listeners on this Entity
      for (let i = 0; i < this.entity.triggerListeners.length; i++) {
        this.entity.triggerListeners[i].onTriggerEnter(other, self);
      }
    }

    private _collider: Collider;
  }
}
