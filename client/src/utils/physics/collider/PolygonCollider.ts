namespace Muse {
  export class PolygonCollider extends Collider {
    ///  <summary>
    ///  If the points are not centered
    ///  they will be centered with the difference being applied to the localOffset.
    ///  </summary>
    ///  <param name="points">Points.</param>
    public constructor(points: Vector[]) {
      super();
      //  first and last point must not be the same. we want an open polygon
      const isPolygonClosed = points[0] === points[points.length - 1];
      if (isPolygonClosed) {
        points = points.slice(0, points.length - 1);
      }

      const center = Polygon.findPolygonCenter(points);
      this.setLocalOffset(center.x, center.y);
      Polygon.recenterPolygonVerts(points);
      this.shape = new Polygon(points);
    }
  }
}
