///  <summary>
///  various collision routines for Shapes.
///  Most of these expect the first Shape to be
///  in the space of the second (i.e. shape1.pos should
///  be set to shape1.pos - shape2.pos).
///  </summary>
namespace Muse.ShapeCollisions {
  ///  <summary>
  ///  checks the result of a box being moved by deltaMovement with second
  ///  </summary>
  ///  <returns><c>true</c>, if to box cast was boxed, <c>false</c> otherwise.</returns>
  ///  <param name="first">First.</param>
  ///  <param name="second">Second.</param>
  ///  <param name="deltaMovement">Delta movement.</param>
  ///  <param name="hit">Hit.</param>
  export function boxToBoxCast(
    first: Box,
    second: Box,
    movement: Vector,
    hit: RaycastHit
  ): boolean {
    //  http://hamaluik.com/posts/swept-aabb-collision-using-minkowski-difference/
    //  first we check for an overlap. if we have an overlap we dont do the sweep test
    const minkowskiDiff = ShapeCollisions.minkowskiDifference(first, second);
    if (minkowskiDiff.contains(0, 0)) {
      //  calculate the MTV. if it is zero then we can just call this a non-collision
      const mtv = minkowskiDiff.getClosestPointOnBoundsToOrigin();
      if (mtv.equals(Vector.zero, 0)) {
        return false;
      }

      hit.normal = mtv.scale(-1);
      hit.normal = hit.normal.normalize();
      hit.distance = 0;
      hit.fraction = 0;
      return true;
    } else {
      //  ray-cast the movement vector against the Minkowski AABB
      const ray = new Ray2D(Vector.zero, movement.scale(-1));
      const res = minkowskiDiff.rayIntersects(ray);
      if (res.intersected && res.distance <= 1) {
        hit.fraction = res.distance;
        hit.distance = movement.magnitude() * res.distance;
        hit.normal = movement.scale(-1);
        hit.normal.normalize();
        hit.centroid = first.bounds.center.add(movement.scale(res.distance));
        return true;
      }
    }

    return false;
  }

  export function boxToBox(
    first: Box,
    second: Box,
    result: CollisionResult
  ): boolean {
    const minkowskiDiff = ShapeCollisions.minkowskiDifference(first, second);
    if (minkowskiDiff.contains(0, 0)) {
      //  calculate the MTV. if it is zero then we can just call this a non-collision
      result.minimumTranslationVector = minkowskiDiff.getClosestPointOnBoundsToOrigin();
      if (result.minimumTranslationVector.equals(Vector.zero, 0)) {
        return false;
      }

      result.normal = result.minimumTranslationVector.scale(-1);
      result.normal = result.normal.normalize();
      return true;
    }

    return false;
  }

  export function minkowskiDifference(first: Box, second: Box): RectangleF {
    // we need the top-left of our first box but it must include our motion.
    // Collider only modifies position with the motion so we
    // need to figure out what the motion was using just the position.
    const positionOffset = first.position.sub(first.bounds.center);
    const topLeft = first.bounds.location.add(
      positionOffset.sub(second.bounds.max)
    );
    const fullSize = first.bounds.size.add(second.bounds.size);
    return new RectangleF(topLeft.x, topLeft.y, fullSize.x, fullSize.y);
  }
}
