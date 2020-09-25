class Server extends GameObject {
  public fixedUpdate() {
    const dtSecs = Muse.timer.fixedDeltaTime / 1000;

    this.applyVerticalMove(dtSecs);

    if (Muse.timer.fixedTime - this._lastTickTime > Demo.instance.frameTime) {
      if (this._pendingInputs.length > 0) {
        this._pendingInputs.forEach(data => {
          if (data) {
            this.applyHorizontalInput(dtSecs, data);
            this._lastProcessedInputID = data.inputID;
            Debug.warn('server apply input ', data.inputID, this._entity.x);
          }
        });
        this._pendingInputs = [];

        this.tick();
        this._lastTickTime = Muse.timer.fixedTime;
      }
    }
  }

  public tick() {
    const snapshot: ISnapshot = {
      position: new Muse.Vector(this._entity.x, this._entity.y),
      velocity: this._velocity,
      timestamp: Muse.timer.fixedTime,
      lastProcessedInput: this._lastProcessedInputID,
    };
    Demo.instance.call(Target.clientLocal, 'syncSnapshot', snapshot);
    Demo.instance.call(Target.clientNetwork, 'syncSnapshot', snapshot);
  }

  public syncInput(data: IInputData) {
    this._pendingInputs.push(data);
  }

  public jump() {
    if (this._isGrounded) {
      this._velocity.y = Demo.instance.jumpSpeed;
    }
  }

  constructor() {
    super();
    const parent = new Laya.Sprite();
    parent.pos(0, Laya.stage.height / 3);
    parent.size(Laya.stage.width, Laya.stage.height / 3);
    Laya.stage.addChild(parent);

    this._platform = new Laya.Sprite();
    this._platform.graphics.drawRect(
      0,
      0,
      Laya.stage.width,
      platformHeight,
      '#000000'
    );
    this._platform.pos(0, parent.height - platformHeight);
    parent.addChild(this._platform);

    const label = new Laya.Label();
    label.text = '服务器';
    label.fontSize = 25;
    label.pos(10, 10);
    parent.addChild(label);

    const size = 50;
    this._entity.graphics.drawRect(0, 0, size, size, '#00ff00');
    this._entity.pivotX = size / 2;
    this._entity.pivotY = size;
    this._entity.pos(size / 2, this._platform.y);
    parent.addChild(this._entity);
  }

  private applyVerticalMove(dtSecs: number) {
    this._isGrounded = this.checkIfGrounded();

    if (this._isGrounded && this._velocity.y < 0) {
      this._velocity.y = 0;
      this._entity.y = this._platform.y;
    }

    this._entity.y -= this._velocity.y * dtSecs;

    if (!this._isGrounded) {
      this._velocity.y -= Demo.instance.gravity * dtSecs;
    }
  }

  private applyHorizontalInput(dtSecs: number, data: IInputData) {
    if (data && data.input !== 0) {
      this._velocity.x = Math.sign(data.input) * Demo.instance.horizontalSpeed;
    } else {
      this._velocity.x = 0;
    }

    this._entity.x += this._velocity.x * dtSecs;
  }

  private checkIfGrounded(): boolean {
    return this._entity.y >= this._platform.y;
  }

  private _velocity: Muse.Vector = Muse.Vector.zero;
  private _isGrounded: boolean;
  private _lastTickTime: number = 0;
  private _lastProcessedInputID: number = 0;

  private _pendingInputs: IInputData[] = [];

  private _platform: Laya.Sprite;
}
