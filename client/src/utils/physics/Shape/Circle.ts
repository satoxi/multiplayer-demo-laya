namespace Muse {
  export class Circle extends Shape {
    public radius: number;
    public _originalRadius: number;

    public constructor(radius: number) {
      super();
      this.radius = radius;
      this._originalRadius = radius;
    }

    public set(radius: number, position: Vector) {
      this._originalRadius = radius;
      this.radius = radius;
      this.position = position;
      this.bounds = new RectangleF(
        position.x - this.radius,
        position.y - this.radius,
        this.radius * 2,
        this.radius * 2
      );
    }

    public recalculateBounds(collider: Collider) {
      // if we dont have rotation or dont care about TRS
      // we use localOffset as the center so we'll start with that
      this.center = collider.localOffset;
      if (collider.shouldColliderScaleAndRotateWithTransform) {
        //  we only scale lineraly being a circle so we'll use the max value
        const { scaleX, scaleY } = collider.entity;
        const hasUnitScale = scaleX === 1 && scaleY === 1;
        const maxScale = Math.max(scaleX, scaleY);
        this.radius = this._originalRadius * maxScale;
        if (collider.entity.rotation !== 0) {
          // to deal with rotation with an offset origin
          // we just move our center in a circle around 0,0 with our offset
          // making the 0 angle
          const offsetAngle =
            Math.atan2(collider.localOffset.y, collider.localOffset.x) *
            MathUtils.rad2Deg;
          const offsetLength = hasUnitScale
            ? collider.localOffsetLength
            : new Vector(
                collider.localOffset.x * scaleX,
                collider.localOffset.y * scaleY
              ).magnitude();
          this.center = MathUtils.pointOnCircle(
            Vector.zero,
            offsetLength,
            collider.entity.rotation + offsetAngle
          );
        }
      }
      this.position = collider.position.add(this.center);
      this.bounds = new RectangleF(
        this.position.x - this.radius,
        this.position.y - this.radius,
        this.radius * 2,
        this.radius * 2
      );
    }

    public overlaps(other: Shape): boolean {
      //  Box is only optimized for unrotated
      if (other instanceof Box && other.isUnrotated) {
        return Collisions.rectToCircle(
          other.bounds.x,
          other.bounds.y,
          other.bounds.width,
          other.bounds.height,
          this.position,
          this.radius
        );
      }

      if (other instanceof Circle) {
        return Collisions.circleToCircle(
          this.position,
          this.radius,
          other.position,
          other.radius
        );
      }

      const result: CollisionResult = new CollisionResult();
      if (other instanceof Polygon) {
        return ShapeCollisions.circleToPolygon(this, other, result);
      }

      throw new Error(`overlaps of Circle to ${other} are not supported`);
    }

    public collidesWithShape(other: Shape, result: CollisionResult): boolean {
      if (other instanceof Box && other.isUnrotated) {
        return ShapeCollisions.circleToBox(this, other, result);
      }

      if (other instanceof Circle) {
        return ShapeCollisions.circleToCircle(this, other, result);
      }

      if (other instanceof Polygon) {
        return ShapeCollisions.circleToPolygon(this, other, result);
      }

      throw new Error(`Collisions of Circle to ${other} are not supported`);
    }

    public collidesWithLine(
      start: Vector,
      end: Vector,
      hit: RaycastHit
    ): boolean {
      return ShapeCollisions.lineToCircle(start, end, this, hit);
    }

    public getPointAlongEdge(angle: number): Vector {
      return new Vector(
        this.position.x + this.radius * Math.cos(angle),
        this.position.y + this.radius * Math.sin(angle)
      );
    }

    ///  <summary>
    ///  Gets whether or not the provided coordinates
    ///  lie within the bounds of this <see cref="Circle"/>.
    ///  </summary>
    ///  <param name="x">The x coordinate of the point to check for containment.</param>
    ///  <param name="y">The y coordinate of the point to check for containment.</param>
    ///  <returns><c>true</c> if the provided coordinates lie inside this <see cref="Circle"/>;
    ///  <c>false</c> otherwise.</returns>
    public containsPoint(point: Vector): boolean {
      return (
        point.sub(this.position).sqrMagnitude() <= this.radius * this.radius
      );
    }

    public pointCollidesWithShape(
      point: Vector,
      result: CollisionResult
    ): boolean {
      return ShapeCollisions.pointToCircle(point, this, result);
    }
  }
}
