namespace Muse {
  export enum PointSectors {
    Center = 0,
    Top = 1,
    Bottom = 2,
    TopLeft = 9,
    TopRight = 5,
    Left = 8,
    Right = 4,
    BottomLeft = 10,
    BottomRight = 6,
  }

  export class Collisions {
    public static lineToLine(
      a1: Vector,
      a2: Vector,
      b1: Vector,
      b2: Vector
    ): boolean {
      const b = a2.sub(a1);
      const d = b2.sub(b1);
      const bDotDPerp = b.x * d.y - b.y * d.x;
      // if b dot d === 0, it means the lines are parallel
      // so have infinite intersection points
      if (bDotDPerp === 0) {
        return false;
      }

      const c = b1.sub(a1);
      const t = (c.x * d.y - c.y * d.x) / bDotDPerp;
      if (t < 0 || t > 1) {
        return false;
      }

      const u = (c.x * b.y - c.y * b.x) / bDotDPerp;
      if (u < 0 || u > 1) {
        return false;
      }

      return true;
    }

    public static closestPointOnLine(
      lineA: Vector,
      lineB: Vector,
      closestTo: Vector
    ): Vector {
      const v = lineB.sub(lineA);
      const w = closestTo.sub(lineA);
      let t = w.dot(v) / v.dot(v);
      t = Muse.MathUtils.clamp(t, 0, 1);
      return lineA.add(v.scale(t));
    }

    public static circleToCircle(
      circleCenter1: Vector,
      circleRadius1: number,
      circleCenter2: Vector,
      circleRadius2: number
    ): boolean {
      return (
        Vector.sqrDistance(circleCenter1, circleCenter2) <
        (circleRadius1 + circleRadius2) * (circleRadius1 + circleRadius2)
      );
    }

    public static circleToLine(
      circleCenter: Vector,
      radius: number,
      lineFrom: Vector,
      lineTo: Vector
    ): boolean {
      return (
        Vector.sqrDistance(
          circleCenter,
          this.closestPointOnLine(lineFrom, lineTo, circleCenter)
        ) <
        radius * radius
      );
    }

    public static circleToPoint(
      circleCenter: Vector,
      radius: number,
      point: Vector
    ): boolean {
      return Vector.sqrDistance(circleCenter, point) < radius * radius;
    }

    public static rectToCircle(
      rectX: number,
      rectY: number,
      rectWidth: number,
      rectHeight: number,
      circleCenter: Vector,
      radius: number
    ): boolean {
      // Check if the rectangle contains the circle's center-point
      if (
        Collisions.rectToPoint(
          rectX,
          rectY,
          rectWidth,
          rectHeight,
          circleCenter
        )
      ) {
        return true;
      }

      //  Check the circle against the relevant edges
      let edgeFrom: Vector;
      let edgeTo: Vector;
      const sector = Collisions.getSector(
        rectX,
        rectY,
        rectWidth,
        rectHeight,
        circleCenter
      );
      if ((sector & PointSectors.Top) !== 0) {
        edgeFrom = new Vector(rectX, rectY);
        edgeTo = new Vector(rectX + rectWidth, rectY);
        if (this.circleToLine(circleCenter, radius, edgeFrom, edgeTo)) {
          return true;
        }
      }

      if ((sector & PointSectors.Bottom) !== 0) {
        edgeFrom = new Vector(rectX, rectY + rectHeight);
        edgeTo = new Vector(rectX + rectWidth, rectY + rectHeight);
        if (this.circleToLine(circleCenter, radius, edgeFrom, edgeTo)) {
          return true;
        }
      }

      if ((sector & PointSectors.Left) !== 0) {
        edgeFrom = new Vector(rectX, rectY);
        edgeTo = new Vector(rectX, rectY + rectHeight);
        if (this.circleToLine(circleCenter, radius, edgeFrom, edgeTo)) {
          return true;
        }
      }

      if ((sector & PointSectors.Right) !== 0) {
        edgeFrom = new Vector(rectX + rectWidth, rectY);
        edgeTo = new Vector(rectX + rectWidth, rectY + rectHeight);
        if (this.circleToLine(circleCenter, radius, edgeFrom, edgeTo)) {
          return true;
        }
      }

      return false;
    }

    public static rectToLine(
      rectX: number,
      rectY: number,
      rectWidth: number,
      rectHeight: number,
      lineFrom: Vector,
      lineTo: Vector
    ): boolean {
      const fromSector = Collisions.getSector(
        rectX,
        rectY,
        rectWidth,
        rectHeight,
        lineFrom
      );
      const toSector = Collisions.getSector(
        rectX,
        rectY,
        rectWidth,
        rectHeight,
        lineTo
      );
      if (
        fromSector === PointSectors.Center ||
        toSector === PointSectors.Center
      ) {
        return true;
      } else if ((fromSector & toSector) !== 0) {
        return false;
      } else {
        const both = fromSector | toSector;
        let edgeFrom: Vector;
        let edgeTo: Vector;
        //  Do line checks against the edgesedgeFrom: Vector;edgeTo: Vector;
        if ((both & PointSectors.Top) !== 0) {
          edgeFrom = new Vector(rectX, rectY);
          edgeTo = new Vector(rectX + rectWidth, rectY);
          if (Collisions.lineToLine(edgeFrom, edgeTo, lineFrom, lineTo)) {
            return true;
          }
        }

        if ((both & PointSectors.Bottom) !== 0) {
          edgeFrom = new Vector(rectX, rectY + rectHeight);
          edgeTo = new Vector(rectX + rectWidth, rectY + rectHeight);
          if (Collisions.lineToLine(edgeFrom, edgeTo, lineFrom, lineTo)) {
            return true;
          }
        }

        if ((both & PointSectors.Left) !== 0) {
          edgeFrom = new Vector(rectX, rectY);
          edgeTo = new Vector(rectX, rectY + rectHeight);
          if (Collisions.lineToLine(edgeFrom, edgeTo, lineFrom, lineTo)) {
            return true;
          }
        }

        if ((both & PointSectors.Right) !== 0) {
          edgeFrom = new Vector(rectX + rectWidth, rectY);
          edgeTo = new Vector(rectX + rectWidth, rectY + rectHeight);
          if (Collisions.lineToLine(edgeFrom, edgeTo, lineFrom, lineTo)) {
            return true;
          }
        }
      }

      return false;
    }

    public static rectToPoint(
      rX: number,
      rY: number,
      rW: number,
      rH: number,
      point: Vector
    ): boolean {
      return (
        point.x >= rX && point.y >= rY && point.x < rX + rW && point.y < rY + rH
      );
    }

    /*
     *  Bitflags and helpers for using the Cohen–Sutherland algorithm
     *  http://en.wikipedia.org/wiki/Cohen%E2%80%93Sutherland_algorithm
     *
     *  Sector bitflags:
     *      1001  1000  1010
     *      0001  0000  0010
     *      0101  0100  0110
     */
    public static getSector(
      rX: number,
      rY: number,
      rW: number,
      rH: number,
      point: Vector
    ): PointSectors {
      let sector = PointSectors.Center;

      if (point.x < rX) {
        sector = sector | PointSectors.Left;
      } else if (point.x >= rX + rW) {
        sector = sector | PointSectors.Right;
      }

      if (point.y < rY) {
        sector = sector | PointSectors.Top;
      } else if (point.y >= rY + rH) {
        sector = sector | PointSectors.Bottom;
      }

      return sector;
    }
  }
}
