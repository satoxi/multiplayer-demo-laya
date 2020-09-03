namespace Muse {
  export abstract class AbstractSplineSolver {
    public get nodes(): Vector[] {
      return this._nodes;
    }

    public get pathLength(): number {
      return this._pathLength;
    }

    //  holds data in the form [time:distance] as a lookup table
    //  the default implementation breaks the spline
    //  down into segments and approximates distance by adding up
    //  the length of each segment
    public buildPath() {
      const totalSudivisions =
        this._nodes.length * this.totalSubdivisionsPerNodeForLookupTable;
      this._pathLength = 0;
      const timePerSlice: number = 1 / totalSudivisions;
      //  we dont care about the first node for distances
      // because they are always t:0 and len:0
      this._segmentTimeForDistance = new Dictionary<number>();
      let lastPoint = this.getPoint(0);
      //  skip the first node and wrap 1 extra node
      for (let i = 1; i < totalSudivisions + 1; i++) {
        //  what is the current time along the path?
        const currentTime: number = timePerSlice * i;
        const currentPoint = this.getPoint(currentTime);
        this._pathLength =
          this._pathLength + Vector.distance(currentPoint, lastPoint);
        lastPoint = currentPoint;
        this._segmentTimeForDistance.add(
          this.timeToKey(currentTime),
          this._pathLength
        );
      }
    }

    public abstract closePath();

    //  gets the raw point not taking into account constant speed.
    //  used for drawing gizmos
    public abstract getPoint(t: number): Vector;

    //  gets the point taking in to account constant speed.
    //  the default implementation approximates the length of the spline
    //  by walking it and calculating the distance between each node
    public getPointOnPath(t: number): Vector {
      //  we know exactly how far along the path we want to be from the passed in t
      const targetDistance = this._pathLength * t;
      //  store the previous and next nodes in our lookup table
      let previousNodeTime = 0;
      let previousNodeKey: string = '';
      let previousNodeLength = 0;
      let nextNodeTime = 0;
      let nextNodeLength = 0;
      //  loop through all the values in our lookup table and
      //  find the two nodes our targetDistance falls between
      for (
        let k: number = 0;
        k < this._segmentTimeForDistance.keys.length;
        k++
      ) {
        const key: string = this._segmentTimeForDistance.keys[k];
        const value: number = this._segmentTimeForDistance.getItem(key);
        const time = this.keyToTime(key);
        //  have we passed our targetDistance yet?
        if (value >= targetDistance) {
          nextNodeTime = time;
          nextNodeLength = value;
          if (previousNodeTime > 0) {
            previousNodeLength = this._segmentTimeForDistance.getItem(
              previousNodeKey
            );
          }

          break;
        }

        previousNodeTime = time;
        previousNodeKey = key;
      }

      //  translate the values from the lookup table estimating the arc length
      //  between our known nodes from the lookup table
      const segmentTime = nextNodeTime - previousNodeTime;
      const segmentLength = nextNodeLength - previousNodeLength;
      const distanceIntoSegment = targetDistance - previousNodeLength;
      t =
        previousNodeTime + (distanceIntoSegment / segmentLength) * segmentTime;
      return this.getPoint(t);
    }

    public reverseNodes() {
      this._nodes.reverse();
    }

    public getTotalPointsBetweenPoints(t: number, t2: number): number {
      let totalPoints: number = 0;
      //  we know exactly how far along the path we want to be from the passed in t
      const targetDistance = this._pathLength * t;
      const targetDistance2 = this._pathLength * t2;
      //  store the previous and next nodes in our lookup table
      let nextNodeLength = 0;
      //  loop through all the values in our lookup table and
      //  find the two nodes our targetDistance falls between
      for (
        let k: number = 0;
        k < this._segmentTimeForDistance.keys.length;
        k++
      ) {
        const key: string = this._segmentTimeForDistance.keys[k];
        const value: number = this._segmentTimeForDistance.getItem(key);
        //  have we passed our targetDistance yet?
        if (value >= targetDistance) {
          nextNodeLength = value;
          break;
        }
      }

      //  store the previous and next nodes in our lookup table
      let previousNodeTime = 0;
      let previousNodeLength = 0;
      //  loop through all the values in our lookup table and
      //  find the two nodes our targetDistance falls between
      for (
        let k: number = 0;
        k < this._segmentTimeForDistance.keys.length;
        k++
      ) {
        const key: string = this._segmentTimeForDistance.keys[k];
        const value: number = this._segmentTimeForDistance.getItem(key);
        const time = this.keyToTime(key);
        //  have we passed our targetDistance yet?
        if (value >= targetDistance2) {
          if (previousNodeTime > 0) {
            previousNodeLength = this._segmentTimeForDistance[previousNodeTime];
          }

          break;
        }

        previousNodeTime = time;
      }

      // round the float values, we just want an approximation to the amount of nodes
      // not a very strict and real value
      totalPoints = Math.round(nextNodeLength) + Math.round(previousNodeLength);
      return totalPoints;
    }

    private timeToKey(time: number): string {
      return Math.floor(time * 1000).toString();
    }

    private keyToTime(key: string): number {
      return parseInt(key, 10) / 1000;
    }

    protected _nodes: Vector[];
    protected _pathLength: number;

    //  how many subdivisions should we divide each segment into?
    //  higher values take longer to build and lookup but
    //  result in closer to actual constant velocity
    protected readonly totalSubdivisionsPerNodeForLookupTable: number = 5;
    protected _segmentTimeForDistance: Dictionary<number>;
  }

  export class StraightLineSplineSolver extends AbstractSplineSolver {
    public constructor(nodes: Vector[]) {
      super();
      this._nodes = nodes;
    }

    public buildPath() {
      //  we need at least 3 nodes (more than 1 segment) to bother with building
      if (this._nodes.length < 3) {
        return;
      }

      //  we dont care about the first node for distances
      //  because they are always t:0 and len:0 and
      //  we dont need the first or last for locations
      this._segmentDistances = [];
      this._pathLength = 0;
      for (let i = 0; i < this._nodes.length - 1; i++) {
        //  calculate the distance to the next node
        const distance = Vector.distance(this._nodes[i], this._nodes[i + 1]);
        this._segmentDistances.push(distance);
        this._pathLength = this._pathLength + distance;
      }

      //  now that we have the total length we can loop back through
      //  and calculate the segmentStartLocations
      let accruedRouteLength = 0;
      this._segmentStartLocations = new Array(this._segmentDistances.length);
      this._segmentStartLocations[0] = -1;
      for (let i = 0; i < this._segmentDistances.length - 1; i++) {
        accruedRouteLength += this._segmentDistances[i];
        this._segmentStartLocations[i + 1] =
          accruedRouteLength / this._pathLength;
      }
    }

    public closePath() {
      //  add a node to close the route if necessary
      if (!this._nodes[0].equals(this._nodes[this._nodes.length - 1])) {
        this._nodes.push(this._nodes[0]);
      }
    }

    public getPoint(t: number): Vector {
      return this.getPointOnPath(t);
    }

    public getPointOnPath(t: number): Vector {
      //  we need at least 3 nodes (more than 1 segment)
      //  to bother using the look up tables. else we just lerp directly from
      //  node 1 to node 2
      if (this._nodes.length < 3) {
        return Vector.lerp(this._nodes[0], this._nodes[1], t);
      }

      //  which segment are we on?
      this._currentSegment = 0;
      for (let k: number = 1; k < this._segmentStartLocations.length; k++) {
        const value: number = this._segmentStartLocations[k];
        if (value >= 0 && value < t) {
          this._currentSegment = k;
          continue;
        }

        break;
      }

      //  now we need to know the total distance travelled in all previous segments so we can subtract it from the total
      //  travelled to get exactly how far along the current segment we are
      let totalDistanceTravelled = t * this._pathLength;
      let i = this._currentSegment - 1;
      //  we want all the previous segment lengths
      while (i >= 0) {
        totalDistanceTravelled -= this._segmentDistances[i];
        --i;
      }

      return Vector.lerp(
        this._nodes[this._currentSegment],
        this._nodes[this._currentSegment + 1],
        totalDistanceTravelled / this._segmentDistances[this._currentSegment]
      );
    }

    private _segmentStartLocations: number[];
    private _segmentDistances: number[];
    private _currentSegment: number;
  }

  export class CubicBezierSplineSolver extends AbstractSplineSolver {
    public constructor(nodes: Vector[]) {
      super();
      this._nodes = nodes;
    }

    public closePath() {}

    public getPoint(t: number): Vector {
      const d = 1 - t;
      return this._nodes[0]
        .scale(d * d * d)
        .add(this._nodes[1].scale(3 * d * d * t))
        .add(this._nodes[2].scale(3 * d * t * t))
        .add(this._nodes[3].scale(t * t * t));
    }
  }

  export class QuadraticBezierSplineSolver extends AbstractSplineSolver {
    public constructor(nodes: Vector[]) {
      super();
      this._nodes = nodes;
    }

    public closePath() {}

    public getPoint(t: number): Vector {
      const d = 1 - t;
      return this._nodes[0]
        .scale(d * d)
        .add(this._nodes[1].scale(2 * d * t).add(this._nodes[2].scale(t * t)));
    }
  }

  export class BezierSplineSolver extends AbstractSplineSolver {
    // how many bezier curves in this path?
    public constructor(nodes: Vector[]) {
      super();
      this._nodes = nodes;
      this._curveCount = (this._nodes.length - 1) / 3;
    }

    //  http://www.gamedev.net/topic/551455-length-of-a-generalized-quadratic-bezier-curve-in-3d/
    protected quadBezierLength(
      startPoint: Vector,
      controlPoint: Vector,
      endPoint: Vector
    ): number {
      //  ASSERT: all inputs are distinct points.
      const A: Vector[] = new Array(2);
      A[0] = controlPoint.sub(startPoint);
      A[1] = startPoint.sub(controlPoint.scale(2)).add(endPoint);
      let length: number;
      if (!A[1].equals(Vector.zero)) {
        //  Coefficients of f(t) = c*t^2 + b*t + a.
        const c: number = 4 * A[1].dot(A[1]);
        //  A[1].Dot(A[1]);  // c > 0 to be in this block of code
        const b: number = 8 * A[0].dot(A[1]);
        //  A[0].Dot(A[1]);
        const a: number = 4 * A[0].dot(A[0]);
        //  A[0].Dot(A[0]);  // a > 0 by assumption
        const q: number = 4 * (a * c) - b * b;
        //  = 16*|Cross(A0,A1)| >= 0
        const twoCpB: number = 2 * c + b;
        const sumCBA: number = c + (b + a);
        const mult0: number = 0.25 / c;
        const mult1: number = q / (8 * Math.pow(c, 1.5));
        length =
          mult0 * (twoCpB * Math.sqrt(sumCBA) - b * Math.sqrt(a)) +
          mult1 *
            (Math.log(2 * Math.sqrt(c * sumCBA) + twoCpB) -
              Math.log(2 * Math.sqrt(c * a) + b));
      } else {
        length = 2 * A[0].magnitude();
      }

      return length;
    }

    public closePath() {
      //  if the first and last node are not the same move them to the midpoint between them
      if (!this._nodes[0].equals(this._nodes[this._nodes.length - 1])) {
        const midPoint = Vector.lerp(
          this._nodes[0],
          this._nodes[this._nodes.length - 1],
          0.5
        );
        const deltaMove = midPoint.sub(this._nodes[0]);
        this._nodes[this._nodes.length - 1] = midPoint;
        this._nodes[0] = midPoint;
        //  shift the ctrl points
        this._nodes[1] = this._nodes[1].add(deltaMove);
        this._nodes[this._nodes.length - 2] = this._nodes[
          this._nodes.length - 2
        ].sub(deltaMove);
      }

      //  normalize the ctrl points
      const firstCtrlPoint = this._nodes[1];
      const middlePoint = this._nodes[0];
      const enforcedTangent = middlePoint.sub(firstCtrlPoint);
      this._nodes[this._nodes.length - 2] = middlePoint.add(enforcedTangent);
    }

    ///  <summary>
    ///  calculates the point on the path with t representing the absolute position from 0 - 1 on the entire spline
    ///  </summary>
    ///  <returns>The bezier point.</returns>
    ///  <param name="t">T.</param>
    public getPoint(t: number): Vector {
      //  wrap t if it is over 1 or less than 0
      if (t > 1) {
        t = 1 - t;
      } else if (t < 0) {
        t = 1 + t;
      }

      let currentCurve: number;
      if (t === 1) {
        t = 1;
        currentCurve = this._curveCount - 1;
      } else {
        //  grab our curve than set t to the remainder along the current curve
        t = t * this._curveCount;
        currentCurve = Math.floor(t);
        t = t - currentCurve;
      }

      return this.getPointByCurveIndexT(currentCurve, t);
    }

    ///  <summary>
    ///  Calculates a point on the path.
    ///  </summary>
    ///  <returns>The bezier point.</returns>
    ///  <param name="curveIndex">The index of the curve that the point is on.
    ///  For example, the second curve (index 1) is the curve
    ///  with controlpoints 3, 4, 5, and 6.</param>
    ///  <param name="t">indicates where on the curve the point is.
    ///  0 corresponds  to the "left" point, 1 corresponds to the "right"
    ///  end point.</param>
    private getPointByCurveIndexT(curveIndex: number, t: number): Vector {
      const nodeIndex = curveIndex * 3;
      const p0 = this._nodes[nodeIndex];
      const p1 = this._nodes[nodeIndex + 1];
      const p2 = this._nodes[nodeIndex + 2];
      const p3 = this._nodes[nodeIndex + 3];
      return this.getPointByControlPoints(t, p0, p1, p2, p3);
    }

    ///  <summary>
    ///  Calculates a point on the Bezier curve represented with the four control points given.
    ///  </summary>
    ///  <returns>The bezier point.</returns>
    ///  <param name="t">T.</param>
    ///  <param name="p0">P0.</param>
    ///  <param name="p1">P1.</param>
    ///  <param name="p2">P2.</param>
    ///  <param name="p3">P3.</param>
    private getPointByControlPoints(
      t: number,
      p0: Vector,
      p1: Vector,
      p2: Vector,
      p3: Vector
    ): Vector {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;
      let p = p0.scale(uuu);
      // first term
      p = p.add(p1.scale(3 * (uu * t)));
      // second term
      p = p.add(p2.scale(3 * (u * tt)));
      // third term
      p = p.add(p3.scale(ttt));
      // fourth term
      return p;
    }

    private _curveCount: number;
  }

  export class CatmullRomSplineSolver extends AbstractSplineSolver {
    public constructor(nodes: Vector[]) {
      super();
      this._nodes = nodes;
    }

    public closePath() {
      //  first, remove the control points
      this._nodes.splice(0, 1);
      this._nodes.splice(this._nodes.length - 1, 1);
      //  if the first and last node are not the same add one
      if (!this._nodes[0].equals(this._nodes[this._nodes.length - 1])) {
        this._nodes.push(this._nodes[0]);
      }

      //  figure out the distances from node 0 to the first node
      //  and the second to last node (remember above
      //  we made the last node equal to the first so node 0 and _nodes.Count - 1 are identical)
      const distanceToFirstNode = Vector.distance(
        this._nodes[0],
        this._nodes[1]
      );
      const distanceToLastNode = Vector.distance(
        this._nodes[0],
        this._nodes[this._nodes.length - 2]
      );
      //  handle the first node. we want to use the distance to the LAST
      //  (opposite segment) node to figure out where this control point should be
      const distanceToFirstTarget =
        distanceToLastNode / Vector.distance(this._nodes[1], this._nodes[0]);
      const lastControlNode = this._nodes[0].add(
        this._nodes[1].sub(this._nodes[0]).scale(distanceToFirstTarget)
      );
      //  handle the last node. for this one, we want the distance
      //  to the first node for the control point but it should
      //  be along the vector to the last node
      const distanceToLastTarget =
        distanceToFirstNode /
        Vector.distance(this._nodes[this._nodes.length - 2], this._nodes[0]);
      const firstControlNode = this._nodes[0].add(
        this._nodes[this._nodes.length - 2]
          .sub(this._nodes[0])
          .scale(distanceToLastTarget)
      );
      this._nodes.splice(0, 0, firstControlNode);
      this._nodes.push(lastControlNode);
    }

    public getPoint(t: number): Vector {
      const numSections = this._nodes.length - 3;
      const currentNode = Math.min(
        Math.floor(t * numSections),
        numSections - 1
      );
      const u = t * numSections - currentNode;
      const a = this._nodes[currentNode];
      const b = this._nodes[currentNode + 1];
      const c = this._nodes[currentNode + 2];
      const d = this._nodes[currentNode + 3];
      const v = new Vector(0, 0);
      v.x =
        0.5 *
        ((a.x * -1 + (3 * b.x - 3 * c.x + d.x)) * (u * (u * u)) +
          ((2 * a.x - 5 * b.x + (4 * c.x - d.x)) * (u * u) +
            ((a.x * -1 + c.x) * u + 2 * b.x)));
      v.y =
        0.5 *
        ((a.y * -1 + (3 * b.y - 3 * c.y + d.y)) * (u * (u * u)) +
          ((2 * a.y - 5 * b.y + (4 * c.y - d.y)) * (u * u) +
            ((a.y * -1 + c.y) * u + 2 * b.y)));
      return v;
    }
  }
}
