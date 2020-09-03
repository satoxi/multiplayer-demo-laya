namespace Muse {
  export abstract class Shape {
    ///  <summary>
    ///  having a separate position field lets us alter the position of the shape
    ///  for collisions checks as opposed to having to change the
    ///  Entity.position which triggers collider/bounds/hash updates.
    ///  </summary>
    public position: Vector = new Vector(0, 0);

    ///  <summary>
    ///  center is kind of a misnomer.
    ///  This value isnt necessarily the center of an object.
    ///  It is more accurately the Collider.localOffset
    ///  with any Transform rotations applied
    ///  </summary>
    public center: Vector = new Vector(0, 0);

    ///  <summary>
    ///  cached bounds for the Shape
    ///  </summary>
    public bounds: RectangleF = new RectangleF(0, 0, 0, 0);

    public abstract recalculateBounds(collider: Collider);
    public abstract overlaps(other: Shape): boolean;
    public abstract collidesWithShape(
      other: Shape,
      result: CollisionResult
    ): boolean;
    public abstract collidesWithLine(
      start: Vector,
      end: Vector,
      hit: RaycastHit
    ): boolean;

    public abstract containsPoint(point: Vector): boolean;
    public abstract pointCollidesWithShape(point: Vector, result): boolean;

    public clone(): Shape {
      return Object.assign({}, this);
    }
  }
}
