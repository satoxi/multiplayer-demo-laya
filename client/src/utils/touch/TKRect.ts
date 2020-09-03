namespace Muse {
  ///  <summary>
  ///  replacement for the Unity Rect class that is TouchKit and resolution-aware.
  ///  Creating one will automatically scale all values
  ///  if TouchKit autoScaleRectsAndDistances is true
  ///   based on your designTimeResolution.
  ///
  ///  Note the TKRects use the bottom-left as the origin.
  ///  </summary>
  export class TKRect {
    public x: number;
    public y: number;
    public width: number;
    public height: number;

    public get xMin(): number {
      return this.x;
    }

    public get xMax(): number {
      return this.x + this.width;
    }

    public get yMin(): number {
      return this.y;
    }

    public get yMax(): number {
      return this.y + this.height;
    }

    public get center(): Vector {
      return new Vector(this.x + this.width / 2, this.y + this.height / 2);
    }

    public constructor(x: number, y: number, width: number, height: number) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.updateRectWithRuntimeScaleModifier();
    }

    private updateRectWithRuntimeScaleModifier() {
      const multiplier = TouchConfig.runtimeScaleModifier;
      this.x = this.x * multiplier.x;
      this.y = this.y * multiplier.y;
      this.width = this.width * multiplier.x;
      this.height = this.height * multiplier.y;
    }

    public copyWithExpansion(xExpansion: number, yExpansion: number): TKRect {
      xExpansion = xExpansion * TouchConfig.runtimeScaleModifier.x;
      yExpansion = yExpansion * TouchConfig.runtimeScaleModifier.y;
      const rect = new TKRect(
        this.x - xExpansion,
        this.y - yExpansion,
        this.width + xExpansion * 2,
        this.height + yExpansion * 2
      );
      return rect;
    }

    public contains(point: Vector): boolean {
      if (
        this.x <= point.x &&
        (this.y <= point.y && (this.xMax >= point.x && this.yMax >= point.y))
      ) {
        return true;
      }

      return false;
    }

    public clone(): TKRect {
      return new TKRect(this.x, this.y, this.width, this.height);
    }

    public toString(): string {
      return `TKRect: x: ${this.x}, xMax: ${this.xMax},
         y: ${this.y}, yMax: ${this.yMax},
         width: ${this.width}, height: ${this.height}, center: ${this.center}`;
    }
  }
}
