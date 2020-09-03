namespace Muse {
  export class Camera2D {
    public get node(): Laya.Sprite {
      return this._node;
    }

    public constructor() {
      this._node = new Laya.Sprite();
    }

    public get x(): number {
      return -this._node.x;
    }

    public get y(): number {
      return -this._node.y;
    }

    public get position(): Vector {
      return new Vector(
        -this._node.x / this._node.scaleX,
        -this._node.y / this._node.scaleY
      );
    }

    public get scale(): number {
      return this._node.scaleX;
    }

    public set scale(value: number) {
      this._node.scale(value, value);
    }

    public setRotation(angle: number) {
      this._node.rotation = -angle;
    }

    public setTranslation(x, y) {
      this._node.pos(-x * this._node.scaleX, -y * this._node.scaleY);
    }

    public viewportToWorldPoint(
      p: Vector,
      createNewVector: boolean = false
    ): Vector {
      const screenX = p.x * Laya.stage.width;
      const screenY = p.y * Laya.stage.height;
      this._tmp.setTo(screenX, screenY);
      this._tmp = this._node.globalToLocal(this._tmp);
      if (createNewVector) {
        return new Vector(this._tmp.x, this._tmp.y);
      } else {
        p.x = this._tmp.x;
        p.y = this._tmp.y;
        return p;
      }
    }

    public screenToWorldPoint(
      p: Vector,
      createNewVector: boolean = false
    ): Vector {
      this._tmp.setTo(p.x, p.y);
      this._tmp = this._node.globalToLocal(this._tmp);
      if (createNewVector) {
        return new Vector(this._tmp.x, this._tmp.y);
      } else {
        p.x = this._tmp.x;
        p.y = this._tmp.y;
        return p;
      }
    }

    private _tmp: Laya.Point = new Laya.Point();
    private _node: Laya.Sprite;
  }
}
