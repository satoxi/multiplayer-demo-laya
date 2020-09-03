namespace Muse.ShapeCollisions {
  export function pointToCircle(
    point: Vector,
    circle: Circle,
    result: CollisionResult
  ): boolean {
    // avoid the square root until we actually need it
    const distanceSquared = Vector.sqrDistance(point, circle.position);
    const sumOfRadii = 1 + circle.radius;
    const collided = distanceSquared < sumOfRadii * sumOfRadii;
    if (collided) {
      result.normal = point.sub(circle.position).normalize();
      const depth = sumOfRadii - Math.sqrt(distanceSquared);
      result.minimumTranslationVector = result.normal.scale(-depth);
      result.point = circle.position.add(result.normal.scale(circle.radius));
      return true;
    }

    return false;
  }

  export function pointToBox(
    point: Vector,
    box: Box,
    result: CollisionResult
  ): boolean {
    if (box.containsPoint(point)) {
      // get the point in the space of the Box
      result.point = box.bounds.getClosestPointOnRectangleBorderToPoint(
        point,
        result.normal
      );
      result.minimumTranslationVector = point.sub(result.point);
      return true;
    }

    return false;
  }

  export function pointToPoly(
    point: Vector,
    poly: Polygon,
    result: CollisionResult
  ): boolean {
    if (poly.containsPoint(point)) {
      const res = Polygon.getClosestPointOnPolygonToPoint(
        poly.points,
        point.sub(poly.position)
      );
      result.normal = res.edgeNormal;
      result.minimumTranslationVector = result.normal.scale(
        Math.sqrt(res.distanceSquared)
      );
      result.point = res.closestPoint.sub(poly.position);
      return true;
    }

    return false;
  }
}
