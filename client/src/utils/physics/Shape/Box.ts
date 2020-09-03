/// <reference path='./Polygon.ts' />

namespace Muse {
  export class Box extends Polygon {
    public width: number;
    public height: number;

    public constructor(width: number, height: number) {
      super(Box.buildBox(width, height), true);
      this.isBox = true;
      this.width = width;
      this.height = height;
    }

    ///  <summary>
    ///  helper that builds the points a Polygon needs in the shape of a box
    ///  </summary>
    ///  <returns>The box.</returns>
    ///  <param name="width">Width.</param>
    ///  <param name="height">Height.</param>
    public static buildBox(width: number, height: number): Vector[] {
      //  we create our points around a center of 0,0
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      const verts = new Array(4);
      verts[0] = new Vector(halfWidth * -1, halfHeight * -1);
      verts[1] = new Vector(halfWidth, halfHeight * -1);
      verts[2] = new Vector(halfWidth, halfHeight);
      verts[3] = new Vector(halfWidth * -1, halfHeight);
      return verts;
    }

    ///  <summary>
    ///  updates the Box points, recalculates the center and sets the width/height
    ///  </summary>
    ///  <param name="width">Width.</param>
    ///  <param name="height">Height.</param>
    public updateBox(width: number, height: number) {
      this.width = width;
      this.height = height;
      //  we create our points around a center of 0,0
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      this.points[0] = new Vector(halfWidth * -1, halfHeight * -1);
      this.points[1] = new Vector(halfWidth, halfHeight * -1);
      this.points[2] = new Vector(halfWidth, halfHeight);
      this.points[3] = new Vector(halfWidth * -1, halfHeight);
      for (let i = 0; i < this.points.length; i++) {
        this._originalPoints[i] = this.points[i];
      }
    }

    public overlaps(other: Shape): boolean {
      //  special, high-performance cases. otherwise we fall back to Polygon.
      if (this.isUnrotated) {
        if (other instanceof Box && (other as Box).isUnrotated) {
          return this.bounds.intersects((other as Box).bounds);
        }

        if (other instanceof Circle) {
          return Collisions.rectToCircle(
            this.bounds.x,
            this.bounds.y,
            this.bounds.width,
            this.bounds.height,
            other.position,
            (other as Circle).radius
          );
        }
      }

      //  fallthrough to standard cases
      return super.overlaps(other);
    }

    public collidesWithShape(other: Shape, result: CollisionResult): boolean {
      //  special, high-performance cases. otherwise we fall back to Polygon.
      if (
        this.isUnrotated &&
        other instanceof Box &&
        (other as Box).isUnrotated
      ) {
        return ShapeCollisions.boxToBox(this, other, result);
      }

      //  TODO: get Minkowski working for circle to box
      // if( other is Circle )
      //  fallthrough to standard cases
      return super.collidesWithShape(other, result);
    }

    public containsPoint(point: Vector): boolean {
      if (this.isUnrotated) {
        return this.bounds.contains(point.x, point.y);
      }

      return super.containsPoint(point);
    }

    public pointCollidesWithShape(
      point: Vector,
      result: CollisionResult
    ): boolean {
      if (this.isUnrotated) {
        return ShapeCollisions.pointToBox(point, this, result);
      }

      return super.pointCollidesWithShape(point, result);
    }
  }
}
