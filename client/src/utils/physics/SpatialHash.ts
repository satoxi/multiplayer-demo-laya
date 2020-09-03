namespace Muse {
  export class SpatialHash {
    public gridBounds: RectangleF = new RectangleF(0, 0, 0, 0);

    public constructor(cellSize: number = 100) {
      this._cellSize = cellSize;
      this._inverseCellSize = 1 / this._cellSize;
      this._raycastParser = new RaycastResultParser();
    }

    ///  <summary>
    ///  gets the cell x,y values for a world-space x,y value
    ///  </summary>
    ///  <returns>The coords.</returns>
    ///  <param name="x">The x coordinate.</param>
    ///  <param name="y">The y coordinate.</param>
    public cellCoords(x: number, y: number): Vector {
      return new Vector(
        Math.floor(x * this._inverseCellSize),
        Math.floor(y * this._inverseCellSize)
      );
    }

    ///  <summary>
    ///  gets the cell at the world-space x,y value.
    ///  If the cell is empty and createCellIfEmpty is true a new cell will be created.
    ///  </summary>
    ///  <returns>The at position.</returns>
    ///  <param name="x">The x coordinate.</param>
    ///  <param name="y">The y coordinate.</param>
    ///  <param name="createCellIfEmpty">If set to <c>true</c> create cell if empty.</param>
    public cellAtPosition(
      x: number,
      y: number,
      createCellIfEmpty: boolean = false
    ): Collider[] {
      let cell: Collider[] = this._cellDict.getValue(x, y);
      if (!cell) {
        if (createCellIfEmpty) {
          cell = [];
          this._cellDict.add(x, y, cell);
        }
      }
      return cell;
    }

    ///  <summary>
    ///  adds the object to the SpatialHash
    ///  </summary>
    ///  <param name="collider">Object.</param>
    public register(collider: Collider) {
      const bounds = collider.bounds;
      collider.registeredPhysicsBounds = bounds;
      const p1 = this.cellCoords(bounds.x, bounds.y);
      const p2 = this.cellCoords(bounds.right, bounds.bottom);
      //  update our bounds to keep track of our grid size
      if (!this.gridBounds.contains(p1.x, p1.y)) {
        this.gridBounds = RectangleF.unionPoint(this.gridBounds, p1);
      }

      if (!this.gridBounds.contains(p2.x, p2.y)) {
        this.gridBounds = RectangleF.unionPoint(this.gridBounds, p2);
      }

      for (let x = p1.x; x <= p2.x; x++) {
        for (let y = p1.y; y <= p2.y; y++) {
          //  we need to create the cell if there is none
          const c = this.cellAtPosition(x, y, true);
          c.push(collider);
        }
      }
    }

    ///  <summary>
    ///  removes the object from the SpatialHash
    ///  </summary>
    ///  <param name="collider">Collider.</param>
    public remove(collider: Collider) {
      const bounds = collider.registeredPhysicsBounds;
      const p1 = this.cellCoords(bounds.x, bounds.y);
      const p2 = this.cellCoords(bounds.right, bounds.bottom);
      for (let x = p1.x; x <= p2.x; x++) {
        for (let y = p1.y; y <= p2.y; y++) {
          // the cell should always exist since this collider
          // should be in all queryed cells
          const cell = this.cellAtPosition(x, y);
          if (cell) {
            const index = cell.indexOf(collider);
            if (index > -1) {
              cell.splice(index, 1);
            }
          }
        }
      }
    }

    ///  <summary>
    ///  removes the object from the SpatialHash using a brute force approach
    ///  </summary>
    ///  <param name="obj">Object.</param>
    public removeWithBruteForce(obj: Collider) {
      this._cellDict.remove(obj);
    }

    public clear() {
      this._cellDict.clear();
    }

    ///  <summary>
    ///  returns all the Colliders in the SpatialHash
    ///  </summary>
    ///  <returns>The all objects.</returns>
    public getAllObjects(): Set<Collider> {
      return this._cellDict.getAllObjects();
    }

    public aabbBroadphase(
      bounds: RectangleF,
      excludeCollider: Collider,
      layerMask: number
    ): Collider[] {
      this._tempHashset.clear();
      const p1 = this.cellCoords(bounds.x, bounds.y);
      const p2 = this.cellCoords(bounds.right, bounds.bottom);
      for (let x = p1.x; x <= p2.x; x++) {
        for (let y = p1.y; y <= p2.y; y++) {
          const cell = this.cellAtPosition(x, y);
          if (!cell) {
            continue;
          }

          //  we have a cell. loop through and fetch all the Colliders
          for (let i = 0; i < cell.length; i++) {
            const collider = cell[i];
            //  skip this collider if it is our excludeCollider or if it doesnt match our layerMask
            if (
              collider === excludeCollider ||
              !Flags.isFlagSet(layerMask, collider.physicsLayer)
            ) {
              continue;
            }

            if (bounds.intersects(collider.bounds)) {
              this._tempHashset.add(collider);
            }
          }
        }
      }

      return Array.from(this._tempHashset);
    }

    ///  <summary>
    ///  casts a line through the spatial hash and fills the hits array up with any colliders that the line hits
    ///  </summary>
    ///  <returns>the number of Colliders returned</returns>
    ///  <param name="start">Start.</param>
    ///  <param name="end">End.</param>
    ///  <param name="hits">Hits.</param>
    ///  <param name="layerMask">Layer mask.</param>
    public linecast(
      start: Vector,
      end: Vector,
      hits: RaycastHit[],
      layerMask: number,
      ignoredColliders: Set<Collider>
    ): number {
      start = start.clone();
      const ray = new Ray2D(start, end);
      this._raycastParser.start(ray, hits, layerMask, ignoredColliders);
      //  get our start/end position in the same space as our grid
      start.x = start.x * this._inverseCellSize;
      start.y = start.y * this._inverseCellSize;
      const endCell = this.cellCoords(end.x, end.y);
      // TODO: check gridBounds to ensure the ray starts/ends in the grid.
      // watch out for end cells since they report out of bounds due to int comparison
      // what voxel are we on
      let intX = Math.floor(start.x);
      let intY = Math.floor(start.y);
      //  which way we go
      let stepX = Math.sign(ray.direction.x);
      let stepY = Math.sign(ray.direction.y);
      //  we make sure that if we're on the same line or row we don't step
      //  in the unneeded direction
      if (intX === endCell.x) {
        stepX = 0;
      }

      if (intY === endCell.y) {
        stepY = 0;
      }

      // Calculate cell boundaries. when the step is positive,
      // the next cell is after this one meaning we add 1.
      // If negative, cell is before this one in which case dont add to boundary
      const boundaryX = intX + (stepX > 0 ? 1 : 0);
      const boundaryY = intY + (stepY > 0 ? 1 : 0);

      //  determine the value of t at which the ray crosses the first vertical
      //  voxel boundary. same for y/horizontal.
      //  The minimum of these two values will indicate
      //  how much we can travel along the ray and still remain in the current voxel
      //  may be infinite for near vertical/horizontal rays
      let tMaxX = (boundaryX - start.x) / ray.direction.x;
      let tMaxY = (boundaryY - start.y) / ray.direction.y;
      if (ray.direction.x === 0 || stepX === 0) {
        tMaxX = Number.POSITIVE_INFINITY;
      }
      if (ray.direction.y === 0 || stepY === 0) {
        tMaxY = Number.POSITIVE_INFINITY;
      }

      // how far do we have to walk before crossing a cell
      // from a cell boundary. may be infinite for near vertical/horizontal rays
      const tDeltaX = stepX / ray.direction.x;
      const tDeltaY = stepY / ray.direction.y;
      //  start walking and returning the intersecting cells.
      let cell = this.cellAtPosition(intX, intY);
      // debugDrawCellDetails( intX, intY, cell ? cell.length : 0 );
      if (cell && this._raycastParser.checkRayIntersection(intX, intY, cell)) {
        this._raycastParser.reset();
        return this._raycastParser.hitCounter;
      }

      let n = 0;
      while ((intX !== endCell.x || intY !== endCell.y) && n < 100) {
        if (tMaxX < tMaxY) {
          intX = intX + stepX;
          tMaxX = tMaxX + tDeltaX;
        } else {
          intY = intY + stepY;
          tMaxY = tMaxY + tDeltaY;
        }

        cell = this.cellAtPosition(intX, intY);
        if (
          cell &&
          this._raycastParser.checkRayIntersection(intX, intY, cell)
        ) {
          this._raycastParser.reset();
          return this._raycastParser.hitCounter;
        }
        n++;
      }

      //  make sure we are reset
      this._raycastParser.reset();
      return this._raycastParser.hitCounter;
    }

    ///  <summary>
    ///  gets all the colliders that fall within the specified rect
    ///  </summary>
    ///  <returns>the number of Colliders returned</returns>
    ///  <param name="rect">Rect.</param>
    ///  <param name="results">Results.</param>
    ///  <param name="layerMask">Layer mask.</param>
    public overlapRectangle(
      rect: RectangleF,
      results: Collider[],
      layerMask: number
    ): number {
      this._overlapTestBox.updateBox(rect.width, rect.height);
      this._overlapTestBox.position = rect.location;
      let resultCounter = 0;
      const potentials = this.aabbBroadphase(rect, null, layerMask);
      potentials.forEach(collider => {
        if (collider instanceof BoxCollider) {
          results[resultCounter] = collider;
          resultCounter++;
        } else if (collider instanceof CircleCollider) {
          if (
            Collisions.rectToCircle(
              rect.x,
              rect.y,
              rect.width,
              rect.height,
              collider.bounds.center,
              collider.bounds.width * 0.5
            )
          ) {
            results[resultCounter] = collider;
            resultCounter++;
          }
        } else if (collider instanceof PolygonCollider) {
          if (collider.shape.overlaps(this._overlapTestBox)) {
            results[resultCounter] = collider;
            resultCounter++;
          }
        } else {
          throw new Error(
            'overlapRectangle against this collider type is not implemented!'
          );
        }

        //  if our results array is full return
        if (resultCounter === results.length) {
          return resultCounter;
        }
      });

      return resultCounter;
    }

    ///  <summary>
    ///  gets all the colliders that fall within the specified circle
    ///  </summary>
    ///  <returns>the number of Colliders returned</returns>
    ///  <param name="circleCenter">Circle center.</param>
    ///  <param name="radius">Radius.</param>
    ///  <param name="results">Results.</param>
    ///  <param name="layerMask">Layer mask.</param>
    public overlapCircle(
      circleCenter: Vector,
      radius: number,
      results: Collider[],
      layerMask: number
    ): number {
      const bounds = new RectangleF(
        circleCenter.x - radius,
        circleCenter.y - radius,
        radius * 2,
        radius * 2
      );
      this._overlapTestCirce.radius = radius;
      this._overlapTestCirce.position = circleCenter;
      let resultCounter = 0;
      const potentials = this.aabbBroadphase(bounds, null, layerMask);
      potentials.forEach(collider => {
        if (collider instanceof BoxCollider) {
          results[resultCounter] = collider;
          resultCounter++;
        } else if (collider instanceof CircleCollider) {
          if (collider.shape.overlaps(this._overlapTestCirce)) {
            results[resultCounter] = collider;
            resultCounter++;
          }
        } else if (collider instanceof PolygonCollider) {
          if (collider.shape.overlaps(this._overlapTestCirce)) {
            results[resultCounter] = collider;
            resultCounter++;
          }
        } else {
          throw new Error(
            'overlapCircle against this collider type is not implemented!'
          );
        }

        //  if our results array is full return
        if (resultCounter === results.length) {
          return resultCounter;
        }
      });

      return resultCounter;
    }

    private _raycastParser: RaycastResultParser;

    ///  <summary>
    ///  the size of each cell in the hash
    ///  </summary>
    private _cellSize: number;

    ///  <summary>
    ///  1 over the cell size. cached result due to it being used a lot.
    ///  </summary>
    private _inverseCellSize: number;

    ///  <summary>
    ///  cached box used for overlap checks
    ///  </summary>
    private _overlapTestBox: Box = new Box(0, 0);

    ///  <summary>
    ///  cached circle used for overlap checks
    ///  </summary>
    private _overlapTestCirce: Circle = new Circle(0);

    ///  <summary>
    ///  the Dictionary that holds all of the data
    ///  </summary>
    private _cellDict: IntIntDictionary = new IntIntDictionary();

    ///  <summary>
    ///  shared HashSet used to return collision info
    ///  </summary>
    private _tempHashset: Set<Collider> = new Set<Collider>();
  }

  ///  <summary>
  ///  wraps a Unit32,List<Collider> Dictionary.
  ///  It's main purpose is to hash the int,int x,y coordinates into a single
  ///  Uint32 key which hashes perfectly resulting in an O(1) lookup.
  ///  </summary>
  class IntIntDictionary {
    public getKey(x: number, y: number): string {
      return `${x} ${y}`;
    }

    public add(x: number, y: number, list: Collider[]) {
      this._store[this.getKey(x, y)] = list;
    }

    ///  <summary>
    ///  removes the collider from the Lists the Dictionary stores
    ///  using a brute force approach
    ///  </summary>
    ///  <param name="obj">Object.</param>
    public remove(obj: Collider) {
      const keys = Object.keys(this._store);
      keys.forEach(key => {
        const list = this._store[key];
        const index = list.indexOf(obj);
        if (index > -1) {
          list.splice(index, 1);
        }
      });
    }

    public getValue(x: number, y: number): Collider[] {
      return this._store[this.getKey(x, y)];
    }

    ///  <summary>
    ///  gets all the Colliders currently in the dictionary
    ///  </summary>
    ///  <returns>The all objects.</returns>
    public getAllObjects(): Set<Collider> {
      const set = new Set<Collider>();
      const keys = Object.keys(this._store);
      keys.forEach(key => {
        const list = this._store[key];
        SetExt.union(set, list);
      });
      return set;
    }

    ///  <summary>
    ///  clears the backing dictionary
    ///  </summary>
    public clear() {
      this._store = {};
    }

    private _store: any = {};
  }

  class RaycastResultParser {
    public hitCounter: number;

    private _hits: RaycastHit[];
    private _tempHit: RaycastHit = new RaycastHit();
    private _checkedColliders: Collider[] = [];
    private _cellHits: RaycastHit[] = [];
    private _ray: Ray2D;
    private _layerMask: number;
    private _ignoredColliders: Set<Collider>;

    public start(
      ray: Ray2D,
      hits: RaycastHit[],
      layerMask: number,
      ignoredColliders: Set<Collider>
    ) {
      this._ray = ray;
      this._hits = hits;
      this._layerMask = layerMask;
      this._ignoredColliders = ignoredColliders;
      this.hitCounter = 0;
    }

    ///  <summary>
    ///  returns true if the hits array gets filled. cell must not be null!
    ///  </summary>
    ///  <returns><c>true</c>, if ray intersection was checked,
    ///  <c>false</c> otherwise.</returns>
    ///  <param name="ray">Ray.</param>
    ///  <param name="cellX">Cell x.</param>
    ///  <param name="cellY">Cell y.</param>
    ///  <param name="cell">Cell.</param>
    ///  <param name="hits">Hits.</param>
    ///  <param name="hitCounter">Hit counter.</param>
    public checkRayIntersection(
      cellX: number,
      cellY: number,
      cell: Collider[]
    ): boolean {
      for (let i = 0; i < cell.length; i++) {
        const potential = cell[i];
        //  manage which colliders we already processed
        if (this._checkedColliders.indexOf(potential) > -1) {
          continue;
        }

        this._checkedColliders.push(potential);
        //  only hit triggers if we are set to do so
        if (potential.isTrigger && !Physics.raycastsHitTriggers) {
          continue;
        }

        //  make sure the Collider is on the layerMask
        if (!Flags.isFlagSet(this._layerMask, potential.physicsLayer)) {
          continue;
        }

        // ignore ignored colliders
        if (this._ignoredColliders && this._ignoredColliders.has(potential)) {
          continue;
        }

        //  TODO: is rayIntersects performant enough? profile it.
        //  Collisions.rectToLine might be faster
        //  TODO: if the bounds check returned more data
        //  we wouldnt have to do any more for a BoxCollider check
        //  first a bounds check before doing a shape test
        const colliderBounds = potential.bounds;
        const res = colliderBounds.rayIntersects(this._ray);
        if (res.intersected && res.distance <= 1) {
          if (
            potential.shape.collidesWithLine(
              this._ray.start,
              this._ray.end,
              this._tempHit
            )
          ) {
            //  check to see if the raycast started inside the collider
            //  if we should excluded those rays
            if (
              !Physics.raycastsStartInColliders &&
              potential.shape.containsPoint(this._ray.start)
            ) {
              continue;
            }

            // TODO: make sure the collision point is in the current cell
            // and if it isnt store it off for later evaluation
            // this would be for giant objects with odd shapes that
            // bleed into adjacent cells
            // _hitTesterRect.x = cellX * _cellSize;
            // _hitTesterRect.y = cellY * _cellSize;
            // if( !_hitTesterRect.Contains( this._tempHit.point ) )
            this._tempHit.collider = potential;
            this._cellHits.push(this._tempHit.clone());
          }
        }
      }

      if (this._cellHits.length === 0) {
        return false;
      }

      // all done processing the cell.
      // sort the results and pack the hits into the result array
      if (this._cellHits.length > 1) {
        this._cellHits.sort((a, b) => {
          if (a.distance !== b.distance) {
            return a.distance - b.distance;
          } else {
            return a.collider.castSortOrder - b.collider.castSortOrder;
          }
        });
      }
      for (let i = 0; i < this._cellHits.length; i++) {
        this._hits[this.hitCounter] = this._cellHits[i];
        // increment the hit counter
        // and if it has reached the array size limit
        // we are done
        this.hitCounter++;
        if (this.hitCounter === this._hits.length) {
          return true;
        }
      }

      return false;
    }

    public reset() {
      this._hits = null;
      this._checkedColliders = [];
      this._cellHits = [];
      this._ignoredColliders = null;
    }
  }
}
