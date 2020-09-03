namespace Muse.ShapeCollisions {
  ///  <summary>
  ///  checks for a collision between two Polygons
  ///  </summary>
  ///  <returns>The collision.</returns>
  ///  <param name="first">Polygon a.</param>
  ///  <param name="second">Polygon b.</param>
  export function polygonToPolygon(
    first: Polygon,
    second: Polygon,
    result: CollisionResult
  ): boolean {
    let isIntersecting = true;
    const firstEdges = first.edgeNormals;
    const secondEdges = second.edgeNormals;
    let minIntervalDistance = Number.POSITIVE_INFINITY;
    let translationAxis = new Vector(0, 0);
    const polygonOffset = first.position.sub(second.position);
    let axis: Vector;
    //  Loop through all the edges of both polygons
    for (
      let edgeIndex = 0;
      edgeIndex < firstEdges.length + secondEdges.length;
      edgeIndex++
    ) {
      //  1. Find if the polygons are currently intersecting
      //  Polygons have the normalized axis perpendicular to the current edge cached for us
      axis =
        edgeIndex < firstEdges.length
          ? firstEdges[edgeIndex]
          : secondEdges[edgeIndex - firstEdges.length];

      //  Find the projection of the polygon on the current axis
      let intervalDist = 0;
      let { min: minA, max: maxA } = getInterval(axis, first);
      const { min: minB, max: maxB } = getInterval(axis, second);
      //  get our interval to be space of the second Polygon.
      //  Offset by the difference in position projected on the axis.
      const relativeIntervalOffset = polygonOffset.dot(axis);
      minA = minA + relativeIntervalOffset;
      maxA = maxA + relativeIntervalOffset;
      //  check if the polygon projections are currentlty intersecting
      intervalDist = intervalDistance(minA, maxA, minB, maxB);
      if (intervalDist > 0) {
        isIntersecting = false;
      }

      //  for Poly-to-Poly casts add a Vector? parameter called deltaMovement.
      //  In the interest of speed we do not use it here
      //  2. Now find if the polygons *will* intersect. only bother checking
      //  if we have some velocity
      // if( deltaMovement.HasValue )
      // {
      //     // Project the velocity on the current axis
      //     var velocityProjection = Vector.Dot( axis, deltaMovement.Value );
      //     // Get the projection of polygon A during the movement
      //     if( velocityProjection < 0 )
      //         minA += velocityProjection;
      //     else
      //         maxA += velocityProjection;
      //     // Do the same test as above for the new projection
      //     intervalDist = intervalDistance( minA, maxA, minB, maxB );
      //     if( intervalDist > 0 )
      //         willIntersect = false;
      // }
      //  If the polygons are not intersecting and won't intersect, exit the loop
      if (!isIntersecting) {
        return false;
      }

      //  Check if the current interval distance is the minimum one.
      //  If so store the interval distance and the current distance.
      //  This will be used to calculate the minimum translation vector
      intervalDist = Math.abs(intervalDist);
      if (intervalDist < minIntervalDistance) {
        minIntervalDistance = intervalDist;
        translationAxis.setTo(axis.x, axis.y);
        if (translationAxis.dot(polygonOffset) < 0) {
          translationAxis = translationAxis.scale(-1);
        }
      }
    }

    //  The minimum translation vector can be used to push the polygons appart.
    result.normal = translationAxis;
    result.minimumTranslationVector = translationAxis.scale(
      minIntervalDistance * -1
    );
    return true;
  }

  ///  <summary>
  ///  Calculates the distance between [minA, maxA] and [minB, maxB].
  ///  The distance will be negative if the intervals overlap
  ///  </summary>
  ///  <returns>The distance.</returns>
  ///  <param name="minA">Minimum a.</param>
  ///  <param name="maxA">Max a.</param>
  ///  <param name="minB">Minimum b.</param>
  ///  <param name="maxB">Max b.</param>
  function intervalDistance(
    minA: number,
    maxA: number,
    minB: number,
    maxB: number
  ): number {
    if (minA < minB) {
      return minB - maxA;
    }

    return minA - maxB;
  }

  ///  <summary>
  ///  Calculates the projection of a polygon on an axis and returns it as a [min, max] interval
  ///  </summary>
  ///  <param name="axis">Axis.</param>
  ///  <param name="polygon">Polygon.</param>
  ///  <param name="min">Minimum.</param>
  ///  <param name="max">Max.</param>
  function getInterval(
    axis: Vector,
    polygon: Polygon
  ): { min: number; max: number } {
    const res = { min: 0, max: 0 };
    //  To project a point on an axis use the dot product
    let dot: number;
    dot = polygon.points[0].dot(axis);
    res.max = dot;
    res.min = dot;
    for (let i = 1; i < polygon.points.length; i++) {
      dot = polygon.points[i].dot(axis);
      if (dot < res.min) {
        res.min = dot;
      } else if (dot > res.max) {
        res.max = dot;
      }
    }
    return res;
  }
}
