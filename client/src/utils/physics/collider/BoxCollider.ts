/// <reference path='./Collider.ts' />

namespace Muse {
  export class BoxCollider extends Collider {
    public get width(): number {
      return (this.shape as Box).width;
    }
    public set width(value: number) {
      this.setWidth(value);
    }

    public get height(): number {
      return (this.shape as Box).height;
    }
    public set height(value: number) {
      this.setHeight(value);
    }

    ///  <summary>
    ///  creates a BoxCollider and uses the x/y components as the localOffset
    ///  if width/heigth is zero
    ///  constructor requires that a Sprite be on the entity
    ///  so that the collider can size itself when the
    ///  entity is added to the scene.
    ///  </summary>
    ///  <param name="x">The x coordinate.</param>
    ///  <param name="y">The y coordinate.</param>
    ///  <param name="width">Width.</param>
    ///  <param name="height">Height.</param>
    public constructor(
      width?: number,
      height?: number,
      x: number = 0,
      y: number = 0
    ) {
      super();
      if (!width || !height) {
        //  we stick a 1x1 box in here as a placeholder
        // until the next frame when the Collider is added to the Entity
        // and can get more accurate auto-sizing data
        this.shape = new Box(1, 1);
        this._colliderRequiresAutoSizing = true;
      } else {
        this._localOffset = new Vector(x + width / 2, y + height / 2);
        this.shape = new Box(width, height);
      }
    }

    public setSize(width: number, height: number): BoxCollider {
      this._colliderRequiresAutoSizing = false;
      const box = this.shape as Box;
      if (width !== box.width || height !== box.height) {
        // update the box, dirty our bounds and
        // if we need to update our bounds in the Physics system
        box.updateBox(width, height);
        this._isPositionDirty = true;
        if (
          this.entity &&
          this._isParentEntityAddedToScene &&
          this._isColliderRegistered
        ) {
          Physics.updateCollider(this);
        }
      }

      return this;
    }

    ///  <summary>
    ///  sets the width of the BoxCollider
    ///  </summary>
    ///  <returns>The width.</returns>
    ///  <param name="width">Width.</param>
    public setWidth(width: number): BoxCollider {
      this._colliderRequiresAutoSizing = false;
      const box = this.shape as Box;
      if (width !== box.width) {
        // update the box, dirty our bounds and
        // if we need to update our bounds in the Physics system
        box.updateBox(width, box.height);
        this._isPositionDirty = true;
        if (
          this.entity &&
          this._isParentEntityAddedToScene &&
          this._isColliderRegistered
        ) {
          Physics.updateCollider(this);
        }
      }

      return this;
    }

    ///  <summary>
    ///  sets the height of the BoxCollider
    ///  </summary>
    ///  <returns>The height.</returns>
    ///  <param name="height">Height.</param>
    public setHeight(height: number): BoxCollider {
      this._colliderRequiresAutoSizing = false;
      const box = this.shape as Box;
      if (height !== box.height) {
        // update the box, dirty our bounds and
        // if we need to update our bounds in the Physics system
        box.updateBox(box.width, height);
        this._isPositionDirty = true;
        if (
          this.entity &&
          this._isParentEntityAddedToScene &&
          this._isColliderRegistered
        ) {
          Physics.updateCollider(this);
        }
      }

      return this;
    }

    public toString(): string {
      return `[BoxCollider: bounds: ${this.bounds}`;
    }
  }
}
