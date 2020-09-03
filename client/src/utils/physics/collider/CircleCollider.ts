namespace Muse {
  export class CircleCollider extends Collider {
    public get radius(): number {
      return (this.shape as Circle).radius;
    }
    public set radius(value: number) {
      this.setRadius(value);
    }

    public constructor(radius?: number) {
      super();
      if (radius) {
        this.shape = new Circle(radius);
      } else {
        this.shape = new Circle(1);
        this._colliderRequiresAutoSizing = true;
      }
    }

    public setRadius(radius: number): CircleCollider {
      this._colliderRequiresAutoSizing = false;
      const circle = this.shape as Circle;
      if (radius !== circle.radius) {
        circle.radius = radius;
        circle._originalRadius = radius;
        this._isPositionDirty = true;
        if (
          this.entity &&
          this._isParentEntityAddedToScene &&
          this._isColliderRegistered
        ) {
          Physics.updateCollider(this);
        }
      }

      return this;
    }

    public toString(): string {
      return `[CircleCollider: bounds: ${this.bounds}, radius: ${
        (this.shape as Circle).radius
      }`;
    }
  }
}
