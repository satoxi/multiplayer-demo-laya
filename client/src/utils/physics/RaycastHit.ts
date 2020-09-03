namespace Muse {
  export class RaycastHit {
    ///  <summary>
    ///  The collider hit by the ray
    ///  </summary>
    public collider: Collider;

    ///  <summary>
    ///  Fraction of the distance along the ray that the hit occurred.
    ///  </summary>
    public fraction: number;

    ///  <summary>
    ///  The distance from the ray origin to the impact point
    ///  </summary>
    public distance: number;

    ///  <summary>
    ///  The point in world space where the ray hit the collider's surface
    ///  </summary>
    public point: Vector;

    ///  <summary>
    ///  The normal vector of the surface hit by the ray
    ///  </summary>
    public normal: Vector;

    ///  <summary>
    ///  The centroid of the primitive used to perform the cast. Where the shape would be positioned for it to contact.
    ///  </summary>
    public centroid: Vector = new Vector(0, 0);

    public setAllValues(
      collider: Collider,
      fraction: number,
      distance: number,
      point: Vector,
      normal: Vector
    ) {
      this.collider = collider;
      this.fraction = fraction;
      this.distance = distance;
      this.point = point;
      this.normal = normal;
    }

    public setValues(
      fraction: number,
      distance: number,
      point: Vector,
      normal: Vector
    ) {
      this.fraction = fraction;
      this.distance = distance;
      this.point = point;
      this.normal = normal;
    }

    public reset() {
      this.collider = null;
      this.distance = 0;
      this.fraction = 0;
    }

    public clone(): RaycastHit {
      const hit = new RaycastHit();
      hit.setAllValues(
        this.collider,
        this.fraction,
        this.distance,
        this.point,
        this.normal
      );
      return hit;
    }

    public toString(): string {
      return `[RaycastHit]
      fraction: ${this.fraction},
      distance: ${this.distance},
      normal: ${this.normal},
      centroid: ${this.centroid},
      point: ${this.point}`;
    }
  }
}
