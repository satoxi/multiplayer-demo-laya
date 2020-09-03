namespace Muse.ShapeCollisions {
  export function circleToCircleCast(
    first: Circle,
    second: Circle,
    deltaMovement: Vector,
    hit: RaycastHit
  ): boolean {
    // http://ericleong.me/research/circle-circle/
    // Find the closest point on the movement vector of the moving circle (first)
    // to the center of the non-moving circle
    let endPointOfCast = first.position.add(deltaMovement);
    let d = ShapeCollisions.closestPointOnLine(
      first.position,
      endPointOfCast,
      second.position
    );
    // Then find the distance between the closest point
    // and the center of the non-moving circle
    let closestDistanceSquared = Vector.sqrDistance(second.position, d);
    const sumOfRadiiSquared =
      (first.radius + second.radius) * (first.radius + second.radius);
    // If it is smaller than the sum of the sum of the radii,
    // then a collision has occurred
    if (closestDistanceSquared <= sumOfRadiiSquared) {
      const normalizedDeltaMovement = deltaMovement.normalize();
      // edge case: if the end point is equal to the closest point
      // on the line then a line from it to the second.position
      // will not be perpindicular to the ray. We need it to be to use Pythagorus
      if (d === endPointOfCast) {
        // extend the end point of the cast radius distance
        // so we get a point that is perpindicular and recalc everything
        endPointOfCast = first.position.add(
          deltaMovement.add(normalizedDeltaMovement.scale(second.radius))
        );
        d = ShapeCollisions.closestPointOnLine(
          first.position,
          endPointOfCast,
          second.position
        );
        closestDistanceSquared = Vector.sqrDistance(second.position, d);
      }

      const backDist = Math.sqrt(sumOfRadiiSquared - closestDistanceSquared);
      hit.centroid = d.sub(normalizedDeltaMovement.scale(backDist));
      hit.normal = hit.centroid.sub(second.position).normalize();
      hit.fraction = (hit.centroid.x - first.position.x) / deltaMovement.x;
      hit.distance = Vector.distance(first.position, hit.centroid);
      hit.point = second.position.add(hit.normal.scale(second.radius));
      return true;
    }

    return false;
  }

  export function circleToCircle(
    first: Circle,
    second: Circle,
    result: CollisionResult
  ): boolean {
    //  avoid the square root until we actually need it
    const distanceSquared = Vector.sqrDistance(first.position, second.position);
    const sumOfRadii = first.radius + second.radius;
    const collided = distanceSquared < sumOfRadii * sumOfRadii;
    if (collided) {
      result.normal = first.position.sub(second.position).normalize();
      const depth = sumOfRadii - Math.sqrt(distanceSquared);
      result.minimumTranslationVector = result.normal.scale(-depth);
      result.point = second.position.add(result.normal.scale(second.radius));
      // this gets the actual point of collision
      // which may or may not be useful so we'll leave it here for now
      // var collisionPointX =
      //   (first.position.X * second.radius + second.position.X * first.radius) /
      //   sumOfRadii;
      // var collisionPointY =
      //   (first.position.Y * second.radius + second.position.Y * first.radius) /
      //   sumOfRadii;
      // result.point = new Vector( collisionPointX, collisionPointY );
      return true;
    }

    return false;
  }

  ///  <summary>
  ///  works for circles whos center is in the box as well as just overlapping with the center out of the box.
  ///  </summary>
  ///  <returns><c>true</c>, if to box was circled, <c>false</c> otherwise.</returns>
  ///  <param name="circle">First.</param>
  ///  <param name="box">Second.</param>
  ///  <param name="result">Result.</param>
  export function circleToBox(
    circle: Circle,
    box: Box,
    result: CollisionResult
  ): boolean {
    const closestPointOnBounds = box.bounds.getClosestPointOnRectangleBorderToPoint(
      circle.position,
      result.normal
    );
    //  deal with circles whos center is in the box first since its cheaper to see if we are contained
    if (box.containsPoint(circle.position)) {
      result.point = closestPointOnBounds;
      //  calculate mtv. Find the safe, non-collided position and get the mtv from that.
      const safePlace = closestPointOnBounds.add(
        result.normal.scale(circle.radius)
      );
      result.minimumTranslationVector = circle.position.sub(safePlace);
      return true;
    }

    const sqrDistance = Vector.sqrDistance(
      closestPointOnBounds,
      circle.position
    );
    //  see if the point on the box is less than radius from the circle
    if (sqrDistance === 0) {
      result.minimumTranslationVector = result.normal.scale(circle.radius);
    } else if (sqrDistance <= circle.radius * circle.radius) {
      result.normal = circle.position.sub(closestPointOnBounds);
      const depth = result.normal.magnitude() - circle.radius;
      result.point = closestPointOnBounds;
      result.normal = result.normal.normalize();
      result.minimumTranslationVector = result.normal.scale(depth);
      return true;
    }

    return false;
  }

  export function circleToPolygon(
    circle: Circle,
    polygon: Polygon,
    result: CollisionResult
  ): boolean {
    //  circle position in the polygons coordinates
    const poly2Circle = circle.position.sub(polygon.position);
    //  first, we need to find the closest distance from the circle to the polygon
    const res = Polygon.getClosestPointOnPolygonToPoint(
      polygon.points,
      poly2Circle
    );
    result.normal = res.edgeNormal;
    // make sure the squared distance is less than our radius squared
    // else we are not colliding. Note that if the Circle is fully
    // contained in the Polygon the distance could be larger than the radius.
    // Because of that we also  make sure the circle position
    // is not inside the poly.
    const circleCenterInsidePoly = polygon.containsPoint(circle.position);
    if (
      res.distanceSquared > circle.radius * circle.radius &&
      !circleCenterInsidePoly
    ) {
      return false;
    }

    // figure out the mtv. We have to be careful to deal with circles
    // fully contained in the polygon or with their center contained.
    let mtv: Vector;
    if (circleCenterInsidePoly) {
      mtv = result.normal.scale(Math.sqrt(res.distanceSquared) - circle.radius);
    } else {
      //  if we have no distance that means the circle center is on the polygon edge. Move it only by its radius
      if (res.distanceSquared === 0) {
        mtv = result.normal.scale(circle.radius);
      } else {
        const distance = Math.sqrt(res.distanceSquared);
        mtv = poly2Circle
          .sub(res.closestPoint)
          .scale(((circle.radius - distance) / distance) * -1);
      }
    }

    result.minimumTranslationVector = mtv;
    result.point = res.closestPoint.add(polygon.position);
    return true;
  }

  export function closestPointOnLine(
    lineA: Vector,
    lineB: Vector,
    closestTo: Vector
  ): Vector {
    const v = lineB.sub(lineA);
    const w = closestTo.sub(lineA);
    let t = w.dot(v) / v.dot(v);
    t = MathUtils.clamp(t, 0, 1);
    return lineA.add(v.scaleEqual(t));
  }
}
