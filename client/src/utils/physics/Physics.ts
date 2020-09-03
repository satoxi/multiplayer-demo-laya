/// <reference path='./RaycastHit.ts' />

namespace Muse {
  export class Physics {
    ///  <summary>
    ///  default value for all methods that accept a layerMask
    ///  </summary>
    public static readonly allLayers: number = -1;

    ///  <summary>
    ///  convenience field for storing a gravity value globally
    ///  </summary>
    public static gravity: Vector = new Vector(0, 300);

    ///  <summary>
    ///  cell size used when reset is called and a new SpatialHash is created
    ///  </summary>
    public static spatialHashCellSize: number = 100;

    ///  <summary>
    ///  Do raycasts detect Colliders configured as triggers?
    ///  </summary>
    public static raycastsHitTriggers: boolean = false;

    ///  <summary>
    ///  Do ray/line casts that start inside a collider detect those colliders?
    ///  </summary>
    public static raycastsStartInColliders: boolean = false;

    public static reset() {
      this._spatialHash = new SpatialHash(this.spatialHashCellSize);
      this._hitArray[0].reset();
      this._colliderArray[0] = null;
    }

    ///  <summary>
    ///  removes all colliders from the SpatialHash
    ///  </summary>
    public static clear() {
      this._spatialHash.clear();
      this._colliderArray[0] = null;
      this._hitArray[0].reset();
    }

    public static getAllColliders(): Set<Collider> {
      return this._spatialHash.getAllObjects();
    }

    ///  <summary>
    ///  adds the collider to the physics system
    ///  </summary>
    ///  <param name="collider">Collider.</param>
    public static addCollider(collider: Collider) {
      this._spatialHash.register(collider);
    }

    ///  <summary>
    ///  removes the collider from the physics system
    ///  </summary>
    ///  <returns>The collider.</returns>
    ///  <param name="collider">Collider.</param>
    public static removeCollider(collider: Collider) {
      this._spatialHash.remove(collider);
    }

    ///  <summary>
    ///  updates the colliders position in the physics system.
    ///  This essentially just removes then re-adds the Collider with its
    ///  new bounds
    ///  </summary>
    ///  <param name="collider">Collider.</param>
    public static updateCollider(collider: Collider) {
      this._spatialHash.remove(collider);
      this._spatialHash.register(collider);
    }

    public static linecast(
      start: Vector,
      end: Vector,
      layerMask: number = this.allLayers,
      ignoredColliders: Set<Collider> = null
    ): RaycastHit {
      //  cleanse the collider before proceeding
      this._hitArray[0].reset();
      Physics.linecastAll(
        start,
        end,
        this._hitArray,
        layerMask,
        ignoredColliders
      );
      return this._hitArray[0].clone();
    }

    ///  <summary>
    ///  casts a line through the spatial hash and fills the hits array up with any colliders that the line hits
    ///  </summary>
    ///  <returns>The all.</returns>
    ///  <param name="start">Start.</param>
    ///  <param name="end">End.</param>
    ///  <param name="hits">Hits.</param>
    ///  <param name="layerMask">Layer mask.</param>
    public static linecastAll(
      start: Vector,
      end: Vector,
      hits: RaycastHit[],
      layerMask: number = this.allLayers,
      ignoredColliders: Set<Collider> = null
    ): number {
      return this._spatialHash.linecast(
        start,
        end,
        hits,
        layerMask,
        ignoredColliders
      );
    }

    ///  <summary>
    ///  check if any collider falls within a rectangular area
    ///  </summary>
    ///  <returns>The rectangle.</returns>
    ///  <param name="rect">Rect.</param>
    ///  <param name="layerMask">Layer mask.</param>
    public static overlapRectangle(
      rect: RectangleF,
      layerMask: number = this.allLayers
    ): Collider {
      this._colliderArray[0] = null;
      this._spatialHash.overlapRectangle(rect, this._colliderArray, layerMask);
      return this._colliderArray[0];
    }

    ///  <summary>
    ///  gets all the colliders that fall within the specified rect
    ///  </summary>
    ///  <returns>the number of Colliders returned</returns>
    ///  <param name="rect">Rect.</param>
    ///  <param name="results">Results.</param>
    ///  <param name="layerMask">Layer mask.</param>
    public static overlapRectangleAll(
      rect: RectangleF,
      results: Collider[],
      layerMask: number = this.allLayers
    ): number {
      return this._spatialHash.overlapRectangle(rect, results, layerMask);
    }

    ///  <summary>
    ///  check if any collider falls within a circular area. Returns the first Collider encountered.
    ///  </summary>
    ///  <returns>The circle.</returns>
    ///  <param name="center">Center.</param>
    ///  <param name="radius">Radius.</param>
    ///  <param name="layerMask">Layer mask.</param>
    public static overlapCircle(
      center: Vector,
      radius: number,
      layerMask: number = this.allLayers
    ): Collider {
      this._colliderArray[0] = null;
      this._spatialHash.overlapCircle(
        center,
        radius,
        this._colliderArray,
        layerMask
      );
      return this._colliderArray[0];
    }

    ///  <summary>
    ///  gets all the colliders that fall within the specified circle
    ///  </summary>
    ///  <returns>the number of Colliders returned</returns>
    ///  <param name="center">Center.</param>
    ///  <param name="radius">Radius.</param>
    ///  <param name="results">Results.</param>
    ///  <param name="layerMask">Layer mask.</param>
    public static overlapCircleAll(
      center: Vector,
      radius: number,
      results: Collider[],
      layerMask: number = this.allLayers
    ): number {
      return this._spatialHash.overlapCircle(
        center,
        radius,
        results,
        layerMask
      );
    }

    ///  <summary>
    ///  returns all colliders with bounds that are intersected by collider.bounds.
    ///  Note that this is a broadphase check so it
    ///  only checks bounds and does not do individual Collider-to-Collider checks!
    ///  </summary>
    ///  <param name="bounds">Bounds.</param>
    ///  <param name="layerMask">Layer mask.</param>
    public static boxcastBroadphase(
      rect: RectangleF,
      layerMask: number = this.allLayers
    ): Collider[] {
      return this._spatialHash.aabbBroadphase(rect, null, layerMask);
    }

    ///  <summary>
    ///  returns all colliders that are intersected by bounds excluding the passed-in collider (self).
    ///  this method is useful if you want to create the swept bounds on your own for other queries
    ///  </summary>
    ///  <returns>The excluding self.</returns>
    ///  <param name="collider">Collider.</param>
    ///  <param name="bounds">Bounds.</param>
    public static boxcastBroadphaseExcludingSelf(
      collider: Collider,
      rect: RectangleF,
      layerMask: number = this.allLayers
    ): Collider[] {
      return this._spatialHash.aabbBroadphase(rect, collider, layerMask);
    }

    private static _spatialHash: SpatialHash;

    ///  <summary>
    ///  we keep this around to avoid allocating it every time a raycast happens
    ///  </summary>
    private static _hitArray: RaycastHit[] = [new RaycastHit()];

    ///  <summary>
    ///  allocation avoidance for overlap checks and shape casts
    ///  </summary>
    private static _colliderArray: Collider[] = [null];
  }
}
