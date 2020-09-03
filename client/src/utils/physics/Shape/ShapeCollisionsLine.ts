namespace Muse.ShapeCollisions {
  export function lineToPoly(
    start: Vector,
    end: Vector,
    polygon: Polygon,
    hit: RaycastHit
  ): boolean {
    let normal = Vector.zero;
    let intersectionPoint = Vector.zero;
    let fraction = Number.MAX_VALUE;
    let hasIntersection = false;
    for (
      let i = 0, j = polygon.points.length - 1;
      i < polygon.points.length;
      j = i, i++
    ) {
      const edge1 = polygon.position.add(polygon.points[j]);
      const edge2 = polygon.position.add(polygon.points[i]);
      const intersection = new Vector(0, 0);
      if (ShapeCollisions.lineToLine(edge1, edge2, start, end, intersection)) {
        hasIntersection = true;
        //  TODO: is this the correct and most efficient way to get the fraction?
        //  check x fraction first. if it is NaN use y instead
        let distanceFraction = (intersection.x - start.x) / (end.x - start.x);
        if (
          Number.isNaN(distanceFraction) ||
          !Number.isFinite(distanceFraction)
        ) {
          distanceFraction = (intersection.y - start.y) / (end.y - start.y);
        }

        if (distanceFraction < fraction) {
          const edge = edge2.sub(edge1);
          normal = new Vector(edge.y, edge.x * -1);
          fraction = distanceFraction;
          intersectionPoint = intersection;
        }
      }
    }

    if (hasIntersection) {
      normal = normal.normalize();
      const distance = Vector.distance(start, intersectionPoint);
      hit.setValues(fraction, distance, intersectionPoint, normal);
      return true;
    }

    return false;
  }

  // algorithm based on web page
  // https://stackoverflow.com/questions/1073336/circle-line-segment-collision-detection-algorithm
  export function lineToCircle(
    start: Vector,
    end: Vector,
    s: Circle,
    hit: RaycastHit
  ): boolean {
    const d = end.sub(start);
    const f = start.sub(s.position);
    const a = d.dot(d);
    const b = 2 * f.dot(d);
    const c = f.dot(f) - s.radius * s.radius;

    //  exit if ray's origin outside of s (c > 0) and ray pointing away from s (b > 0)
    if (c > 0 && b > 0) {
      return false;
    }

    let discriminant = b * b - 4 * a * c;
    //  a negative descriminant means the line misses the circle
    if (discriminant < 0) {
      return false;
    }

    // ray didn't totally miss sphere,
    // so there is a solution to
    // the equation.
    discriminant = Math.sqrt(discriminant);
    // either solution may be on or off the ray so need to test both
    // t1 is always the smaller value, because BOTH discriminant and
    // a are nonnegative.
    const t1 = (-b - discriminant) / (2 * a);
    const t2 = (-b + discriminant) / (2 * a);

    // 3x HIT cases:
    // Impale(t1 hit,t2 hit), Poke(t1 hit,t2>1), ExitWound(t1<0, t2 hit),

    // 3x MISS cases:
    // FallShort (t1>1,t2>1), Past (t1<0,t2<0), CompletelyInside(t1<0, t2>1)

    if (t1 >= 0 && t1 <= 1) {
      // t1 is the intersection, and it's closer than t2
      // (since t1 uses -b - discriminant)
      // Impale, Poke
      hit.fraction = t1;
      hit.point = start.add(d.scale(hit.fraction));
      hit.distance = Vector.distance(start, hit.point);
      hit.normal = hit.point.sub(s.position).normalize();
      return true;
    }

    // here t1 didn't intersect so we are either started
    // inside the sphere or completely past it
    if (t2 >= 0 && t2 <= 1) {
      hit.fraction = t2;
      hit.point = start.add(d.scale(hit.fraction));
      hit.distance = Vector.distance(start, hit.point);
      hit.normal = hit.point.sub(s.position).normalize();
      return true;
    }

    // no intn: FallShort, Past, CompletelyInside
    return false;
  }

  export function lineToLine(
    a1: Vector,
    a2: Vector,
    b1: Vector,
    b2: Vector,
    intersection: Vector
  ): boolean {
    intersection.x = intersection.y = 0;
    const b = a2.sub(a1);
    const d = b2.sub(b1);
    const bDotDPerp = b.x * d.y - b.y * d.x;
    //  if b dot d === 0, it means the lines are parallel so have infinite intersection points
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

    const v = a1.add(b.scale(t));
    intersection.x = v.x;
    intersection.y = v.y;
    return true;
  }
}
