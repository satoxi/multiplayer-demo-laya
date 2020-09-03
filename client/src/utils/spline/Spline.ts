namespace Muse {
  export enum SplineType {
    StraightLine,
    QuadraticBezier,
    CubicBezier,
    CatmullRom,
    Bezier,
  }

  export class Spline {
    public get currentSegment(): number {
      return this._currentSegment;
    }

    public get isClosed(): boolean {
      return this._isClosed;
    }

    public get splineType(): SplineType {
      return this._splineType;
    }

    //  used by the visual path editor
    public get nodes(): Vector[] {
      return this._solver.nodes;
    }

    public get pathLength(): number {
      return this._solver.pathLength;
    }

    ///  <summary>
    ///  generates an arc from start to end with a separate axis for the start and and points
    ///  </summary>
    ///  <returns>The arc.</returns>
    ///  <param name="start">Start.</param>
    ///  <param name="end">End.</param>
    ///  <param name="curvature">how far away from the line from start to end the arc extends</param>
    ///  <param name="startCurvatureAxis">Start curvature axis.</param>
    ///  <param name="endCurvatureAxis">End curvature axis.</param>
    public static generateArc(
      start: Vector,
      end: Vector,
      curvature: number,
      startCurvatureAxis: Vector,
      endCurvatureAxis: Vector
    ): Spline {
      startCurvatureAxis = startCurvatureAxis.normalize();
      endCurvatureAxis = endCurvatureAxis.normalize();
      const nodes = [
        start,
        start.add(startCurvatureAxis.scale(curvature)),
        end.add(endCurvatureAxis.scale(curvature)),
        end,
      ];
      return new Spline(nodes);
    }

    ///  <summary>
    ///  Default constructor. Creates and initializes a spline from a List of nodes
    ///  </summary>
    ///  <param name="nodes">Nodes.</param>
    ///  <param name="useBezierIfPossible">If set to <c>true</c> use bezier if possible.</param>
    ///  <param name="useStraightLines">If set to <c>true</c> use straight lines.</param>
    public constructor(
      nodes: Vector[],
      useBezierIfPossible: boolean = false,
      useStraightLines: boolean = false
    ) {
      // determine spline type and solver based on number of nodes
      if (useStraightLines || nodes.length === 2) {
        this._splineType = SplineType.StraightLine;
        this._solver = new StraightLineSplineSolver(nodes);
      } else if (nodes.length === 3) {
        this._splineType = SplineType.QuadraticBezier;
        this._solver = new QuadraticBezierSplineSolver(nodes);
      } else if (nodes.length === 4) {
        this._splineType = SplineType.CubicBezier;
        this._solver = new CubicBezierSplineSolver(nodes);
      } else if (useBezierIfPossible) {
        this._splineType = SplineType.Bezier;
        this._solver = new BezierSplineSolver(nodes);
      } else {
        this._splineType = SplineType.CatmullRom;
        this._solver = new CatmullRomSplineSolver(nodes);
      }
    }

    ///  <summary>
    ///  gets the last node. used to setup relative tweens
    ///  </summary>
    public getLastNode(): Vector {
      return this._solver.nodes[this._solver.nodes.length];
    }

    ///  <summary>
    ///  responsible for calculating total length, segmentStartLocations and segmentDistances
    ///  </summary>
    public buildPath() {
      this._solver.buildPath();
    }

    ///  <summary>
    ///  directly gets the point for the current spline type with no lookup table to adjust for constant speed
    ///  </summary>
    private getPoint(t: number): Vector {
      return this._solver.getPoint(t);
    }

    ///  <summary>
    ///  returns the point that corresponds to the given t where t >= 0 and t <= 1 making sure that the
    ///  path is traversed at a constant speed.
    ///  </summary>
    public getPointOnPath(t: number): Vector {
      //  if the path is closed, we will allow t to wrap. if is not we need to clamp t
      if (t < 0 || t > 1) {
        if (this.isClosed) {
          if (t < 0) {
            t++;
          } else {
            t--;
          }
        } else {
          t = Muse.MathUtils.clamp(t, 0, 1);
        }
      }

      return this._solver.getPointOnPath(t);
    }

    ///  <summary>
    ///  closes the path adding a new node at the end that is equal to the start node if it isn't already equal
    ///  </summary>
    public closePath() {
      //  dont let this get closed twice!
      if (this.isClosed) {
        return;
      }

      this._isClosed = true;
      this._solver.closePath();
    }

    ///  <summary>
    ///  reverses the order of the nodes
    ///  </summary>
    public reverseNodes() {
      if (!this._isReversed) {
        this._solver.reverseNodes();
        this._isReversed = true;
      }
    }

    ///  <summary>
    ///  unreverses the order of the nodes if they were reversed
    ///  </summary>
    public unreverseNodes() {
      if (this._isReversed) {
        this._solver.reverseNodes();
        this._isReversed = false;
      }
    }

    public getTotalPointsBetweenPoints(t: number, t2: number): number {
      return this._solver.getTotalPointsBetweenPoints(t, t2);
    }

    public drawGizmos(
      posX: number = 0,
      posY: number = 0,
      scaleX: number = 1,
      scaleY: number = 1,
      resolution: number = 50,
      lineColor: string = '#ff0000',
      lineWidth: number = 3
    ) {
      if (this._solver.nodes.length === 0) {
        return;
      }

      const sprite = new Laya.Sprite();
      Laya.stage.addChild(sprite);

      let previousPoint = this._solver.getPointOnPath(0);
      resolution *= this._solver.nodes.length;
      for (let i = 1; i <= resolution; i++) {
        const t = i / resolution;
        const currentPoint = this._solver.getPointOnPath(t);
        sprite.graphics.drawLine(
          currentPoint.x * scaleX + posX,
          currentPoint.y * scaleY + posY,
          previousPoint.x * scaleX + posX,
          previousPoint.y * scaleY + posY,
          lineColor,
          lineWidth
        );
        previousPoint = currentPoint;
      }
    }

    private _currentSegment: number;
    private _isClosed: boolean;
    private _splineType: SplineType;
    //  internal flag that lets us know if our nodes are reversed or not
    private _isReversed: boolean;
    private _solver: AbstractSplineSolver;
  }
}
