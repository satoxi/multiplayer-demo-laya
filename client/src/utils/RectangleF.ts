/// <reference path='./Matrix2D.ts' />

namespace Muse {
  export enum Edge {
    Top,
    Bottom,
    Left,
    Right,
  }

  export interface IRectangle {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  ///  <summary>
  ///  Describes a 2D-rectangle.
  ///  </summary>
  export class RectangleF {
    ///  <summary>
    ///  The x coordinate of the top-left corner of this <see cref="RectangleF"/>.
    ///  </summary>
    public x: number;

    ///  <summary>
    ///  The y coordinate of the top-left corner of this <see cref="RectangleF"/>.
    ///  </summary>
    public y: number;

    ///  <summary>
    ///  The width of this <see cref="RectangleF"/>.
    ///  </summary>
    public width: number;

    ///  <summary>
    ///  The height of this <see cref="RectangleF"/>.
    ///  </summary>
    public height: number;

    ///  <summary>
    ///  returns a RectangleF of float.Min/Max values
    ///  </summary>
    ///  <value>The max rect.</value>
    public static get maxRect(): RectangleF {
      return new RectangleF(
        Number.MIN_VALUE / 2,
        Number.MIN_VALUE / 2,
        Number.MAX_VALUE,
        Number.MAX_VALUE
      );
    }

    ///  <summary>
    ///  Returns the x coordinate of the left edge of this <see cref="RectangleF"/>.
    ///  </summary>
    public get left(): number {
      return this.x;
    }

    ///  <summary>
    ///  Returns the x coordinate of the right edge of this <see cref="RectangleF"/>.
    ///  </summary>
    public get right(): number {
      return this.x + this.width;
    }

    ///  <summary>
    ///  Returns the y coordinate of the top edge of this <see cref="RectangleF"/>.
    ///  </summary>
    public get top(): number {
      return this.y;
    }

    ///  <summary>
    ///  Returns the y coordinate of the bottom edge of this <see cref="RectangleF"/>.
    ///  </summary>
    public get bottom(): number {
      return this.y + this.height;
    }

    ///  <summary>
    ///  gets the max point of the rectangle, the bottom-right corner
    ///  </summary>
    ///  <value>The max.</value>
    public get max(): Vector {
      return new Vector(this.right, this.bottom);
    }

    ///  <summary>
    ///  Whether or not this <see cref="RectangleF"/> has a <see cref="Width"/> and
    ///  <see cref="Height"/> of 0, and a <see cref="Location"/> of (0, 0).
    ///  </summary>
    public get isEmpty(): boolean {
      return (
        this.width === 0 && this.height === 0 && this.x === 0 && this.y === 0
      );
    }

    ///  <summary>
    ///  The top-left coordinates of this <see cref="RectangleF"/>.
    ///  </summary>
    public get location(): Vector {
      return new Vector(this.x, this.y);
    }
    public set location(value: Vector) {
      this.x = value.x;
      this.y = value.y;
    }

    ///  <summary>
    ///  The width-height coordinates of this <see cref="RectangleF"/>.
    ///  </summary>
    public get size(): Vector {
      return new Vector(this.width, this.height);
    }
    public set size(value: Vector) {
      this.width = value.x;
      this.height = value.y;
    }

    ///  <summary>
    ///  A <see cref="Point"/> located in the center of this <see cref="RectangleF"/>.
    ///  </summary>
    ///  <remarks>
    ///  If <see cref="Width"/> or <see cref="Height"/> is an odd number,
    ///  the center point will be rounded down.
    ///  </remarks>
    public get center(): Vector {
      return new Vector(this.x + this.width / 2, this.y + this.height / 2);
    }

    public constructor(x: number, y: number, width: number, height: number) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }

    ///  <summary>
    ///  creates a RectangleF given min/max points (top-left, bottom-right points)
    ///  </summary>
    ///  <returns>The minimum max points.</returns>
    ///  <param name="min">Minimum.</param>
    ///  <param name="max">Max.</param>
    public static fromMinMax(
      minX: number,
      minY: number,
      maxX: number,
      maxY: number
    ): RectangleF {
      return new RectangleF(minX, minY, maxX - minX, maxY - minY);
    }

    ///  <summary>
    ///  given the points of a polygon calculates the bounds
    ///  </summary>
    ///  <returns>The from polygon points.</returns>
    ///  <param name="points">Points.</param>
    public static rectEncompassingPoints(points: Vector[]): RectangleF {
      //  we need to find the min/max x/y values
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        if (pt.x < minX) {
          minX = pt.x;
        }

        if (pt.x > maxX) {
          maxX = pt.x;
        }

        if (pt.y < minY) {
          minY = pt.y;
        }

        if (pt.y > maxY) {
          maxY = pt.y;
        }
      }

      return RectangleF.fromMinMax(minX, minY, maxX, maxY);
    }

    public getSide(edge: Edge): number {
      switch (edge) {
        case Edge.Top:
          return this.top;
        case Edge.Bottom:
          return this.bottom;
        case Edge.Left:
          return this.left;
        case Edge.Right:
          return this.right;
        default:
          throw new Error('argument out of range');
      }
    }

    ///  <summary>
    ///  Gets whether or not the provided coordinates lie within the bounds of this <see cref="RectangleF"/>.
    ///  </summary>
    ///  <param name="x">The x coordinate of the point to check for containment.</param>
    ///  <param name="y">The y coordinate of the point to check for containment.</param>
    ///  <returns><c>true</c> if the provided coordinates lie inside this
    ///  <see cref="RectangleF"/>; <c>false</c> otherwise.</returns>
    public contains(x: number, y: number): boolean {
      return (
        this.x <= x &&
        x < this.x + this.width &&
        this.y <= y &&
        y < this.y + this.height
      );
    }

    ///  <summary>
    ///  Adjusts the edges of this <see cref="RectangleF"/> by specified horizontal and vertical amounts.
    ///  </summary>
    ///  <param name="horizontalAmount">Value to adjust the left and right edges.</param>
    ///  <param name="verticalAmount">Value to adjust the top and bottom edges.</param>
    public inflate(horizontalAmount: number, verticalAmount: number) {
      this.x = this.x - horizontalAmount;
      this.y = this.y - verticalAmount;
      this.width = this.width + horizontalAmount * 2;
      this.height = this.height + verticalAmount * 2;
    }

    ///  <summary>
    ///  Gets whether or not the other <see cref="RectangleF"/> intersects with this rectangle.
    ///  </summary>
    ///  <param name="value">The other rectangle for testing.</param>
    ///  <returns><c>true</c> if other <see cref="RectangleF"/> intersects with
    ///  this rectangle; <c>false</c> otherwise.</returns>
    public intersects(value: RectangleF): boolean {
      return (
        value.left < this.right &&
        (this.left < value.right &&
          (value.top < this.bottom && this.top < value.bottom))
      );
    }

    public rayIntersects(
      ray: Ray2D
    ): { intersected: boolean; distance: number } {
      const res = { intersected: false, distance: 0 };
      let maxValue = Number.MAX_VALUE;
      if (Math.abs(ray.direction.x) < 1e-6) {
        if (ray.start.x < this.x || ray.start.x > this.x + this.width) {
          return res;
        }
      } else {
        const num11 = 1 / ray.direction.x;
        let num8 = (this.x - ray.start.x) * num11;
        let num7 = (this.x + (this.width - ray.start.x)) * num11;
        if (num8 > num7) {
          const num14 = num8;
          num8 = num7;
          num7 = num14;
        }

        res.distance = Math.max(num8, res.distance);
        maxValue = Math.min(num7, maxValue);
        if (res.distance > maxValue) {
          return res;
        }
      }

      if (Math.abs(ray.direction.y) < 1e-6) {
        if (ray.start.y < this.y || ray.start.y > this.y + this.height) {
          return res;
        }
      } else {
        const num10 = 1 / ray.direction.y;
        let num6 = (this.y - ray.start.y) * num10;
        let num5 = (this.y + (this.height - ray.start.y)) * num10;
        if (num6 > num5) {
          const num13 = num6;
          num6 = num5;
          num5 = num13;
        }

        res.distance = Math.max(num6, res.distance);
        maxValue = Math.min(num5, maxValue);
        if (res.distance > maxValue) {
          return res;
        }
      }

      res.intersected = true;
      return res;
    }

    public getClosestPointOnBoundsToOrigin(): Vector {
      const max = this.max;
      let minDist = Math.abs(this.location.x);
      const boundsPoint = new Vector(this.location.x, 0);
      if (Math.abs(max.x) < minDist) {
        minDist = Math.abs(max.x);
        boundsPoint.x = max.x;
        boundsPoint.y = 0;
      }

      if (Math.abs(max.y) < minDist) {
        minDist = Math.abs(max.y);
        boundsPoint.x = 0;
        boundsPoint.y = max.y;
      }

      if (Math.abs(this.location.y) < minDist) {
        minDist = Math.abs(this.location.y);
        boundsPoint.x = 0;
        boundsPoint.y = this.location.y;
      }

      return boundsPoint;
    }

    ///  <summary>
    ///  returns the closest point that is in or on the RectangleF to the given point
    ///  </summary>
    ///  <returns>The closest point on rectangle to point.</returns>
    ///  <param name="point">Point.</param>
    public getClosestPointOnRectangleFToPoint(point: Vector): Vector {
      //  for each axis, if the point is outside the box clamp it
      //  to the box else leave it alone
      const res = new Vector(0, 0);
      res.x = MathUtils.clamp(point.x, this.left, this.right);
      res.y = MathUtils.clamp(point.y, this.top, this.bottom);
      return res;
    }

    ///  <summary>
    ///  gets the closest point that is on the rectangle border to the given point
    ///  </summary>
    ///  <returns>The closest point on rectangle border to point.</returns>
    ///  <param name="point">Point.</param>
    public getClosestPointOnRectangleBorderToPoint(
      point: Vector,
      edgeNormal: Vector
    ): Vector {
      edgeNormal.x = edgeNormal.y = 0;
      //  for each axis, if the point is outside the box
      //  clamp it to the box else leave it alone
      const res = new Vector(0, 0);
      res.x = MathUtils.clamp(point.x, this.left, this.right);
      res.y = MathUtils.clamp(point.y, this.top, this.bottom);
      //  if point is inside the rectangle we need to push res
      //  to the border since it will be inside the rect
      if (this.contains(res.x, res.y)) {
        const dl = res.x - this.left;
        const dr = this.right - res.x;
        const dt = res.y - this.top;
        const db = this.bottom - res.y;
        const min = Math.min(dl, dr, dt, db);
        if (min === dt) {
          res.y = this.top;
          edgeNormal.y = -1;
        } else if (min === db) {
          res.y = this.bottom;
          edgeNormal.y = 1;
        } else if (min === dl) {
          res.x = this.left;
          edgeNormal.x = -1;
        } else {
          res.x = this.right;
          edgeNormal.x = 1;
        }
      } else {
        if (res.x === this.left) {
          edgeNormal.x = -1;
        }

        if (res.x === this.right) {
          edgeNormal.x = 1;
        }

        if (res.y === this.top) {
          edgeNormal.y = -1;
        }

        if (res.y === this.bottom) {
          edgeNormal.y = 1;
        }
      }

      return res;
    }

    ///  <summary>
    ///  Creates a new RectangleF that contains overlapping region of two other rectangles.
    ///  </summary>
    ///  <param name="value1">The first <see cref="RectangleF"/>.</param>
    ///  <param name="value2">The second <see cref="RectangleF"/>.</param>
    ///  <param name="result">Overlapping region of the two rectangles as an output parameter.</param>
    public static intersect(
      value1: RectangleF,
      value2: RectangleF
    ): RectangleF {
      if (value1.intersects(value2)) {
        const right_side = Math.min(
          value1.x + value1.width,
          value2.x + value2.width
        );
        const left_side = Math.max(value1.x, value2.x);
        const top_side = Math.max(value1.y, value2.y);
        const bottom_side = Math.min(
          value1.y + value1.height,
          value2.y + value2.height
        );
        return new RectangleF(
          left_side,
          top_side,
          right_side - left_side,
          bottom_side - top_side
        );
      } else {
        return new RectangleF(0, 0, 0, 0);
      }
    }

    ///  <summary>
    ///  Changes the <see cref="Location"/> of this <see cref="RectangleF"/>.
    ///  </summary>
    ///  <param name="offsetX">The x coordinate to add to this <see cref="RectangleF"/>.</param>
    ///  <param name="offsetY">The y coordinate to add to this <see cref="RectangleF"/>.</param>
    public offset(offsetX: number, offsetY: number) {
      this.x = this.x + offsetX;
      this.y = this.y + offsetY;
    }

    ///  <summary>
    ///  Creates a new <see cref="RectangleF"/> that completely contains two other rectangles.
    ///  </summary>
    ///  <param name="value1">The first <see cref="RectangleF"/>.</param>
    ///  <param name="value2">The second <see cref="RectangleF"/>.</param>
    ///  <param name="result">The union of the two rectangles as an output parameter.</param>
    public static union(value1: RectangleF, value2: RectangleF): RectangleF {
      const result = new RectangleF(0, 0, 0, 0);
      result.x = Math.min(value1.x, value2.x);
      result.y = Math.min(value1.y, value2.y);
      result.width = Math.max(value1.right, value2.right) - result.x;
      result.height = Math.max(value1.bottom, value2.bottom) - result.y;
      return result;
    }

    public static unionPoint(first: RectangleF, point: Vector): RectangleF {
      const rect = new RectangleF(point.x, point.y, 0, 0);
      return RectangleF.union(first, rect);
    }

    ///  <summary>
    ///  Creates a new <see cref="RectangleF"/> where the rectangles overlap.
    ///  </summary>
    ///  <param name="value1">The first <see cref="RectangleF"/>.</param>
    ///  <param name="value2">The second <see cref="RectangleF"/>.</param>
    ///  <returns>The overlap of the two rectangles.</returns>
    public static overlap(value1: RectangleF, value2: RectangleF): RectangleF {
      const x = Math.max(Math.max(value1.x, value2.x), 0);
      const y = Math.max(Math.max(value1.y, value2.y), 0);
      return new RectangleF(
        x,
        y,
        Math.max(Math.min(value1.right, value2.right) - x, 0),
        Math.max(Math.min(value1.bottom, value2.bottom) - y, 0)
      );
    }

    private static _tempMat: Matrix2D = new Matrix2D();
    private static _transformMat: Matrix2D = new Matrix2D();
    public calculateBounds(
      parentPosition: Vector,
      position: Vector,
      origin: Vector,
      scale: Vector,
      rotation: number,
      width: number,
      height: number
    ) {
      if (rotation === 0) {
        this.x = parentPosition.x + (position.x - origin.x * scale.x);
        this.y = parentPosition.y + (position.y - origin.y * scale.y);
        this.width = width * scale.x;
        this.height = height * scale.y;
      } else {
        //  special care for rotated bounds. we need to find our absolute min/max values and create the bounds from that
        const worldPosX = parentPosition.x + position.x;
        const worldPosY = parentPosition.y + position.y;
        //  set the reference point to world reference taking origin into account
        Matrix2D.createTranslation(
          (worldPosX - origin.x) * -1,
          (worldPosY - origin.y) * -1,
          RectangleF._transformMat
        );
        Matrix2D.createScale(scale.x, scale.y, RectangleF._tempMat);
        Matrix2D.multiply(
          RectangleF._transformMat,
          RectangleF._tempMat,
          RectangleF._transformMat
        );
        Matrix2D.createRotation(
          MathUtils.deg2Rad * rotation,
          RectangleF._tempMat
        );
        Matrix2D.multiply(
          RectangleF._transformMat,
          RectangleF._tempMat,
          RectangleF._transformMat
        );
        Matrix2D.createTranslation(worldPosX, worldPosY, RectangleF._tempMat);
        //  translate back
        Matrix2D.multiply(
          RectangleF._transformMat,
          RectangleF._tempMat,
          RectangleF._transformMat
        );
        //  TODO: this is a bit silly. we can just leave the worldPos translation in the Matrix and avoid this
        //  get all four corners in world space
        let topLeft = new Vector(worldPosX, worldPosY);
        let topRight = new Vector(worldPosX + width, worldPosY);
        let bottomLeft = new Vector(worldPosX, worldPosY + height);
        let bottomRight = new Vector(worldPosX + width, worldPosY + height);
        //  transform the corners into our work space
        topLeft = topLeft.transform(RectangleF._transformMat);
        topRight = topRight.transform(RectangleF._transformMat);
        bottomLeft = bottomLeft.transform(RectangleF._transformMat);
        bottomRight = bottomRight.transform(RectangleF._transformMat);
        //  find the min and max values so we can concoct our bounding box
        const minX = Math.min(
          topLeft.x,
          bottomRight.x,
          topRight.x,
          bottomLeft.x
        );
        const maxX = Math.max(
          topLeft.x,
          bottomRight.x,
          topRight.x,
          bottomLeft.x
        );
        const minY = Math.min(
          topLeft.y,
          bottomRight.y,
          topRight.y,
          bottomLeft.y
        );
        const maxY = Math.max(
          topLeft.y,
          bottomRight.y,
          topRight.y,
          bottomLeft.y
        );
        this.location = new Vector(minX, minY);
        this.width = maxX - minX;
        this.height = maxY - minY;
      }
    }

    ///  <summary>
    ///  returns a RectangleF that spans the current rect and the provided delta positions
    ///  </summary>
    ///  <returns>The swept broadphase box.</returns>
    ///  <param name="velocityX">Velocity x.</param>
    ///  <param name="velocityY">Velocity y.</param>
    public getSweptBroadphaseBounds(
      deltaX: number,
      deltaY: number
    ): RectangleF {
      const broadphasebox = new RectangleF(0, 0, 0, 0);
      broadphasebox.x = deltaX > 0 ? this.x : this.x + deltaX;
      broadphasebox.y = deltaY > 0 ? this.y : this.y + deltaY;
      broadphasebox.width =
        deltaX > 0 ? deltaX + this.width : this.width - deltaX;
      broadphasebox.height =
        deltaY > 0 ? deltaY + this.height : this.height - deltaY;
      return broadphasebox;
    }

    ///  <summary>
    ///  returns true if the boxes are colliding
    ///  moveX and moveY will return the movement that
    ///  b1 must move to avoid the collision
    ///  </summary>
    ///  <param name="other">Other.</param>
    ///  <param name="moveX">Move x.</param>
    ///  <param name="moveY">Move y.</param>
    public collisionCheck(
      other: RectangleF
    ): { collided: boolean; moveX: number; moveY: number } {
      const res = { collided: false, moveX: 0, moveY: 0 };
      const l = other.x - (this.x + this.width);
      const r = other.x + other.width - this.x;
      const t = other.y - (this.y + this.height);
      const b = other.y + other.height - this.y;
      //  check that there was a collision
      if (l > 0 || (r < 0 || (t > 0 || b < 0))) {
        return res;
      }

      //  find the offset of both sides
      res.moveX = Math.abs(l) < r ? l : r;
      res.moveY = Math.abs(t) < b ? t : b;
      //  only use whichever offset is the smallest
      if (Math.abs(res.moveX) < Math.abs(res.moveY)) {
        res.moveY = 0;
      } else {
        res.moveX = 0;
      }

      return res;
    }

    ///  <summary>
    ///  Calculates the signed depth of intersection between two rectangles.
    ///  </summary>
    ///  <returns>
    ///  The amount of overlap between two intersecting rectangles.
    ///  These depth values can be negative depending on which sides the rectangles
    ///  intersect. This allows callers to determine the correct direction to
    ///  push objects in order to resolve collisions.
    ///  If the rectangles are not intersecting, Vector.zero is returned.
    ///  </returns>
    public static getIntersectionDepth(
      rectA: RectangleF,
      rectB: RectangleF
    ): Vector {
      //  calculate half sizes
      const halfWidthA = rectA.width / 2;
      const halfHeightA = rectA.height / 2;
      const halfWidthB = rectB.width / 2;
      const halfHeightB = rectB.height / 2;
      //  calculate centers
      const centerA = new Vector(
        rectA.left + halfWidthA,
        rectA.top + halfHeightA
      );
      const centerB = new Vector(
        rectB.left + halfWidthB,
        rectB.top + halfHeightB
      );
      //  calculate current and minimum-non-intersecting distances between centers
      const distanceX = centerA.x - centerB.x;
      const distanceY = centerA.y - centerB.y;
      const minDistanceX = halfWidthA + halfWidthB;
      const minDistanceY = halfHeightA + halfHeightB;
      //  if we are not intersecting at all, return (0, 0)
      if (
        Math.abs(distanceX) >= minDistanceX ||
        Math.abs(distanceY) >= minDistanceY
      ) {
        return Vector.zero;
      }

      //  calculate and return intersection depths
      const depthX =
        distanceX > 0 ? minDistanceX - distanceX : -minDistanceX - distanceX;
      const depthY =
        distanceY > 0 ? minDistanceY - distanceY : -minDistanceY - distanceY;
      return new Vector(depthX, depthY);
    }

    public toString(): string {
      return `X:${this.x}, Y:${this.y}, Width: ${this.width}, Height: ${
        this.height
      }`;
    }

    public static equals(a: RectangleF, b: RectangleF): boolean {
      return (
        a.x === b.x &&
        (a.y === b.y && (a.width === b.width && a.height === b.height))
      );
    }

    public clone(): RectangleF {
      return new RectangleF(this.x, this.y, this.width, this.height);
    }

    public copyFrom(r: IRectangle) {
      this.x = r.x;
      this.y = r.y;
      this.width = r.width;
      this.height = r.height;
    }
  }
}
