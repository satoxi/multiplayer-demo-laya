const platformHeight: number = 10;

class GameObject {
  constructor() {
    this._entity = new Laya.Sprite();
  }

  public fixedUpdate() {}

  protected _entity: Laya.Sprite;
}
