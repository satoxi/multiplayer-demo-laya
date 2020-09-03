namespace Muse {
  export class CollisionResult {
    ///  <summary>
    ///  the collider that was collided with
    ///  </summary>
    public collider: Collider;

    ///  <summary>
    ///  The normal vector of the surface hit by the shape
    ///  </summary>
    public normal: Vector = new Vector(0, 0);

    ///  <summary>
    ///  The translation to apply to the first shape to push the shapes appart
    ///  </summary>
    public minimumTranslationVector: Vector = new Vector(0, 0);

    ///  <summary>
    ///  not used for all collisions types! Check the ShapeCollisions class before relying on this field!
    ///  </summary>
    public point: Vector;

    public reset() {
      this.collider = null;
      this.normal.setTo(0, 0);
      this.minimumTranslationVector.setTo(0, 0);
      if (this.point) {
        this.point.setTo(0, 0);
      }
    }

    public cloneTo(cr: CollisionResult) {
      cr.collider = this.collider;
      cr.normal.setTo(this.normal.x, this.normal.y);
      cr.minimumTranslationVector.setTo(
        this.minimumTranslationVector.x,
        this.minimumTranslationVector.y
      );
      if (this.point) {
        if (!cr.point) {
          cr.point = new Vector(0, 0);
        }
        cr.point.setTo(this.point.x, this.point.y);
      }
    }

    ///  <summary>
    ///  alters the minimumTranslationVector
    ///  so that it removes the x-component of the translation
    ///  if there was no movement in
    ///  the same direction.
    ///  </summary>
    ///  <param name="deltaMovement">the original movement that caused the collision</param>
    public removeHorizontalTranslation(deltaMovement: Vector) {
      //  http://dev.yuanworks.com/2013/03/19/little-ninja-physics-and-collision-detection/
      //  fix is the vector that is only in the y-direction that we want.
      //  Projecting it on the normal gives us the
      //  responseDistance that we already have (MTV).
      //  We know fix.x should be 0 so it simplifies to fix = r / normal.y
      //  fix dot normal = responseDistance
      //  check if the lateral motion is undesirable
      //  and if so remove it and fix the response
      if (
        Math.sign(this.normal.x) !== Math.sign(deltaMovement.x) ||
        (deltaMovement.x === 0 && this.normal.x !== 0)
      ) {
        const responseDistance = this.minimumTranslationVector.magnitude();
        const fix = responseDistance / this.normal.y;
        // check some edge cases. make sure we dont have normal.x === 1
        // and a super small y which will result in a huge
        // fix value since we divide by normal
        if (
          Math.abs(this.normal.x) !== 1 &&
          Math.abs(fix) < Math.abs(deltaMovement.y * 3)
        ) {
          this.minimumTranslationVector = new Vector(0, fix * -1);
        }
      }
    }

    ///  <summary>
    ///  inverts the normal and MTV
    ///  </summary>
    public invertResult() {
      this.minimumTranslationVector = this.minimumTranslationVector.negate();
      this.normal = this.normal.negate();
    }

    public toString(): string {
      return `[CollisionResult] normal: ${this.normal}, minimumTranslationVector: ${this.minimumTranslationVector}`;
    }
  }
}
