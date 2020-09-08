class ClientNetwork extends GameObject {
  public fixedUpdate() {}

  public syncSnapshot(s: ISnapshot) {
    console.warn('2 sync snapshot ');
  }

  constructor() {
    super();
    const parent = new Laya.Sprite();
    parent.pos(0, (Laya.stage.height * 2) / 3);
    parent.size(Laya.stage.width, Laya.stage.height / 3);
    Laya.stage.addChild(parent);

    const platform = new Laya.Sprite();
    platform.graphics.drawRect(
      0,
      0,
      Laya.stage.width,
      platformHeight,
      '#000000'
    );
    platform.pos(0, parent.height - platformHeight);
    parent.addChild(platform);

    const label = new Laya.Label();
    label.text = '远程玩家';
    label.fontSize = 25;
    label.pos(10, 10);
    parent.addChild(label);

    const size = 50;
    this._entity.graphics.drawRect(0, 0, size, size, '#0000ff');
    this._entity.pivotX = size / 2;
    this._entity.pivotY = size;
    this._entity.pos(size / 2, parent.height - platformHeight);
    parent.addChild(this._entity);

    GameObject.prototype['syncSnapshot'] = this.syncSnapshot.bind(this);
  }
}
