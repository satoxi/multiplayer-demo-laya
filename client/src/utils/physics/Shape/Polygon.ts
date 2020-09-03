/// <reference path='./Shape.ts' />

namespace Muse {
  export class Polygon extends Shape {
    ///  <summary>
    ///  the points that make up the Polygon. They should be CW and convex.
    ///  </summary>
    public points: Vector[];

    ///  <summary>
    ///  edge normals are used for SAT collision detection.
    ///  We cache them to avoid the squareroots. Note that Boxes will only have
    ///  2 edgeNormals since the other two sides are parallel.
    ///  </summary>
    public get edgeNormals(): Vector[] {
      if (this._areEdgeNormalsDirty) {
        this.buildEdgeNormals();
      }
      return this._edgeNormals;
    }

    //  used as an optimization for unrotated Box collisions
    public isBox: boolean;
    public isUnrotated: boolean = true;

    ///  <summary>
    ///  constructs a Polygon from points.
    ///  points should be specified in clockwise fashion
    ///  without duplicating the first/last point and
    ///  they should be centered around 0,0.
    ///  </summary>
    ///  <param name="points">Points.</param>
    public constructor(points: Vector[], isBox?: boolean) {
      super();
      this.points = points;
      this.isBox = isBox;
      this.recalculateCenterAndEdgeNormals();
      this._originalPoints = [];
      this.points.forEach(p => {
        this._originalPoints.push(p.clone());
      });
    }

    ///  <summary>
    ///  creates a symmetrical polygon based on the radius and vertCount passed in
    ///  </summary>
    ///  <param name="vertCount">Vert count.</param>
    ///  <param name="radius">Radius.</param>
    public create(vertCount: number, radius: number) {
      Polygon.buildSymmetricalPolygon(vertCount, radius);
    }

    ///  <summary>
    ///  recalculates the Polygon centers.
    ///  This must be called if the points are changed!
    ///  </summary>
    public recalculateCenterAndEdgeNormals() {
      this._polygonCenter = Polygon.findPolygonCenter(this.points);
      this._areEdgeNormalsDirty = true;
    }

    ///  <summary>
    ///  builds the Polygon edge normals.
    ///  These are lazily created and updated only by the edgeNormals getter
    ///  </summary>
    private buildEdgeNormals() {
      //  for boxes we only require 2 edges since the other 2 are parallel
      const totalEdges = this.isBox ? 2 : this.points.length;
      if (!this._edgeNormals || this._edgeNormals.length !== totalEdges) {
        this._edgeNormals = new Array(totalEdges);
      }

      let p2: Vector;
      for (let i = 0; i < totalEdges; i++) {
        const p1 = this.points[i];
        // tslint:disable-next-line:prefer-conditional-expression
        if (i + 1 >= this.points.length) {
          p2 = this.points[0];
        } else {
          p2 = this.points[i + 1];
        }
        this._edgeNormals[i] = Vector.perpendicular(p1, p2).normalize();
      }
      this._areEdgeNormalsDirty = false;
    }

    public static buildSymmetricalPolygon(
      vertCount: number,
      radius: number
    ): Vector[] {
      const verts = new Array<Vector>(vertCount);
      for (let i = 0; i < vertCount; i++) {
        const a = 2 * (Math.PI * (i / vertCount));
        verts[i] = new Vector(Math.cos(a), Math.sin(a)).scale(radius);
      }

      return verts;
    }

    ///  <summary>
    ///  recenters the points of the polygon
    ///  </summary>
    ///  <param name="points">Points.</param>
    public static recenterPolygonVerts(points: Vector[]) {
      const center = Polygon.findPolygonCenter(points);
      for (let i = 0; i < points.length; i++) {
        points[i] = points[i].sub(center);
      }
    }

    ///  <summary>
    ///  finds the center of the Polygon.
    ///  Note that this will be accurate for regular polygons.
    ///  Irregular polygons have no center.
    ///  </summary>
    ///  <returns>The polygon center.</returns>
    ///  <param name="points">Points.</param>
    public static findPolygonCenter(points: Vector[]): Vector {
      let y: number = 0;
      let x: number = 0;
      for (let i = 0; i < points.length; i++) {
        x = x + points[i].x;
        y = y + points[i].y;
      }

      return new Vector(x / points.length, y / points.length);
    }

    //  Dont know adjancent vertices so take each vertex
    //  If you know adjancent vertices, perform hill climbing algorithm
    public static getFarthestPointInDirection(
      points: Vector[],
      direction: Vector
    ): Vector {
      let index = 0;
      let dot: number;
      let maxDot = points[index].dot(direction);
      for (let i = 1; i < points.length; i++) {
        dot = points[i].dot(direction);
        if (dot > maxDot) {
          maxDot = dot;
          index = i;
        }
      }

      return points[index];
    }

    ///  <summary>
    ///  iterates all the edges of the polygon and
    ///  gets the closest point on any edge to point.
    ///  Returns via out the squared distance
    ///  to the closest point and the normal of the edge it is on.
    ///  point should be in the space of the Polygon (point - poly.position)
    ///  </summary>
    ///  <returns>The closest point on polygon to point.</returns>
    ///  <param name="point">Point.</param>
    ///  <param name="distanceSquared">Distance squared.</param>
    ///  <param name="edgeNormal">Edge normal.</param>
    public static getClosestPointOnPolygonToPoint(
      points: Vector[],
      point: Vector
    ): { distanceSquared: number; edgeNormal: Vector; closestPoint: Vector } {
      const res = {
        distanceSquared: Number.MAX_VALUE,
        edgeNormal: Vector.zero,
        closestPoint: Vector.zero,
      };

      let tempDistanceSquared: number;
      for (let i = 0; i < points.length; i++) {
        let j = i + 1;
        if (j === points.length) {
          j = 0;
        }

        const closest = ShapeCollisions.closestPointOnLine(
          points[i],
          points[j],
          point
        );
        tempDistanceSquared = Vector.sqrDistance(point, closest);
        if (tempDistanceSquared < res.distanceSquared) {
          res.distanceSquared = tempDistanceSquared;
          res.closestPoint = closest;
          //  get the normal of the line
          const line = points[j].sub(points[i]);
          res.edgeNormal.x = line.y;
          res.edgeNormal.y = -line.x;
        }
      }

      res.edgeNormal = res.edgeNormal.normalize();
      return res;
    }

    ///  <summary>
    ///  rotates the originalPoints and copys the rotated values to rotatedPoints
    ///  </summary>
    ///  <param name="radians">Radians.</param>
    ///  <param name="originalPoints">Original points.</param>
    ///  <param name="rotatedPoints">Rotated points.</param>
    public static rotatePolygonVerts(
      radians: number,
      originalPoints: Vector[],
      rotatedPoints: Vector[]
    ) {
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      for (let i = 0; i < originalPoints.length; i++) {
        const position = originalPoints[i];
        rotatedPoints[i] = new Vector(
          position.x * cos + position.y * (sin * -1),
          position.x * sin + position.y * cos
        );
      }
    }

    public recalculateBounds(collider: Collider) {
      // if we dont have rotation or dont care about TRS
      // we use localOffset as the center so we'll start with that
      this.center = collider.localOffset;
      if (collider.shouldColliderScaleAndRotateWithTransform) {
        let hasUnitScale = true;
        const tempMat: Matrix2D = new Matrix2D();
        const combinedMatrix: Matrix2D = new Matrix2D();
        Matrix2D.createTranslation(
          this._polygonCenter.x * -1,
          this._polygonCenter.y * -1,
          combinedMatrix
        );
        if (collider.entity.scaleX !== 1 || collider.entity.scaleY !== 1) {
          Matrix2D.createScale(
            collider.entity.scaleX,
            collider.entity.scaleY,
            tempMat
          );
          Matrix2D.multiply(combinedMatrix, tempMat, combinedMatrix);
          hasUnitScale = false;
          //  scale our offset and set it as center. If we have rotation also it will be reset below
          const scaledOffset = new Vector(
            collider.localOffset.x * collider.entity.scaleX,
            collider.localOffset.y * collider.entity.scaleY
          );
          this.center = scaledOffset;
        }
        if (collider.entity.rotation !== 0) {
          Matrix2D.createRotation(
            MathUtils.deg2Rad * collider.entity.rotation,
            tempMat
          );
          Matrix2D.multiply(combinedMatrix, tempMat, combinedMatrix);
          // to deal with rotation with an offset origin
          // we just move our center in a circle around 0,0 with our offset
          // making the 0 angle
          // we have to deal with scale here as well so we scale our offset
          // to get the proper length first.
          const offsetAngle =
            Math.atan2(collider.localOffset.y, collider.localOffset.x) *
            MathUtils.rad2Deg;
          const offsetlength = hasUnitScale
            ? collider.localOffset.magnitude()
            : new Vector(
                collider.localOffset.x * collider.entity.scaleX,
                collider.localOffset.y * collider.entity.scaleY
              ).magnitude();
          this.center = MathUtils.pointOnCircle(
            Vector.zero,
            offsetlength,
            collider.entity.rotation + offsetAngle
          );
        }
        Matrix2D.createTranslation(
          this._polygonCenter.x,
          this._polygonCenter.y,
          tempMat
        );
        //  translate back center
        Matrix2D.multiply(combinedMatrix, tempMat, combinedMatrix);
        //  finaly transform our original points
        this.points = [];
        this._originalPoints.forEach(p => {
          this.points.push(p.transform(combinedMatrix));
        });
        this.isUnrotated = collider.entity.rotation === 0;
        //  we only need to rebuild our edge normals if we rotated
        if (collider.isRotationDirty) {
          this._areEdgeNormalsDirty = true;
        }
      }
      this.position = collider.position.add(this.center);
      this.bounds = RectangleF.rectEncompassingPoints(this.points);
      this.bounds.location = this.bounds.location.add(this.position);
    }

    public overlaps(other: Shape): boolean {
      const result: CollisionResult = new CollisionResult();
      if (other instanceof Polygon) {
        return ShapeCollisions.polygonToPolygon(this, other, result);
      }

      if (other instanceof Circle) {
        if (ShapeCollisions.circleToPolygon(other, this, result)) {
          result.invertResult();
          return true;
        }

        return false;
      }

      throw new Error(`overlaps of Polygon to ${other} are not supported`);
    }

    public collidesWithShape(other: Shape, result: CollisionResult): boolean {
      if (other instanceof Polygon) {
        return ShapeCollisions.polygonToPolygon(this, other, result);
      }

      if (other instanceof Circle) {
        if (ShapeCollisions.circleToPolygon(other, this, /* out */ result)) {
          result.invertResult();
          return true;
        }

        return false;
      }

      throw new Error(`overlaps of Polygon to ${other} are not supported`);
    }

    public collidesWithLine(
      start: Vector,
      end: Vector,
      hit: RaycastHit
    ): boolean {
      return ShapeCollisions.lineToPoly(start, end, this, hit);
    }

    ///  <summary>
    ///  essentially what the algorithm is doing is shooting a ray from point out.
    ///  If it intersects an odd number of polygon sides
    ///  we know it is inside the polygon.
    ///  </summary>
    ///  <returns>The point.</returns>
    ///  <param name="point">Point.</param>
    public containsPoint(point: Vector): boolean {
      //  normalize the point to be in our Polygon coordinate space
      point = point.sub(this.position);
      let isInside = false;
      for (
        let j = this.points.length - 1, i = 0;
        i < this.points.length;
        j = i++
      ) {
        if (
          this.points[i].y > point.y !== this.points[j].y > point.y &&
          point.x <
            (this.points[j].x - this.points[i].x) *
              ((point.y - this.points[i].y) /
                (this.points[j].y - this.points[i].y)) +
              this.points[i].x
        ) {
          isInside = !isInside;
        }
      }

      return isInside;
    }

    public pointCollidesWithShape(
      point: Vector,
      result: CollisionResult
    ): boolean {
      return ShapeCollisions.pointToPoly(point, this, /* out */ result);
    }

    //  we cache the original details of our polygon
    protected _originalPoints: Vector[];
    private _polygonCenter: Vector;
    private _areEdgeNormalsDirty: boolean = true;
    private _edgeNormals: Vector[];
  }
}
