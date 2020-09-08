class ClientLocal extends GameObject {
  public fixedUpdate() {
    const dtSecs = Muse.timer.fixedDeltaTime / 1000;

    const data = this.processHorizontalInput();

    if (Demo.instance.enableLocalPrediction) {
      this.applyVerticalMove(dtSecs);
      this.applyHorizontalInput(dtSecs, data);
    }

    if (Laya.KeyBoardManager.hasKeyDown(Laya.Keyboard.UP)) {
      Demo.instance.call(Target.server, 'jump');

      if (Demo.instance.enableLocalPrediction) {
        this.jump();
      }
    }
  }

  public syncSnapshot(s: ISnapshot) {
    this._states.push(s);

    if (!Demo.instance.enableLocalPrediction) {
      this._entity.pos(s.position.x, s.position.y);
    }
  }

  constructor() {
    super();
    const parent = new Laya.Sprite();
    parent.pos(0, 0);
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
    label.text = '本地玩家';
    label.fontSize = 25;
    label.pos(10, 10);
    parent.addChild(label);

    const size = 50;
    this._entity.graphics.drawRect(0, 0, size, size, '#ff0000');
    this._entity.pivotX = size / 2;
    this._entity.pivotY = size;
    this._entity.pos(size / 2, parent.height - platformHeight);
    parent.addChild(this._entity);
  }

  private processHorizontalInput(): IInputData {
    let input = 0;
    if (Laya.KeyBoardManager.hasKeyDown(Laya.Keyboard.LEFT)) {
      input = -1;
    } else if (Laya.KeyBoardManager.hasKeyDown(Laya.Keyboard.RIGHT)) {
      input = 1;
    } else if (this._lastInput !== 0) {
      input = 0;
    } else {
      return null;
    }

    this._lastInput = input;
    this._currentInputID++;
    const data: IInputData = {
      input,
      inputID: this._currentInputID,
    };
    Demo.instance.call(Target.server, 'syncInput', data);

    this._pendingInputs.push(data);
    return data;
  }

  private applyHorizontalInput(dtSecs: number, data: IInputData) {
    if (data && data.input !== 0) {
      this._velocity.x = Math.sign(data.input) * Demo.instance.horizontalSpeed;
    } else {
      this._velocity.x = 0;
    }

    this._entity.x += this._velocity.x * dtSecs;
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

  private jump() {
    if (this._isGrounded) {
      this._velocity.y = Demo.instance.jumpSpeed;
    }
  }

  private getServerTime(): number {
    return Muse.timer.fixedTime - Demo.instance.latencyMilliseconds / 1000;
  }

  private checkIfGrounded(): boolean {
    return this._entity.y >= this._platform.y;
  }

  private _velocity: Muse.Vector = Muse.Vector.zero;
  private _pendingInputs: IInputData[] = [];
  private _states: ISnapshot[] = [];

  private _lastInput: number = 0;
  private _isGrounded: boolean;
  private _currentInputID: number = 0;

  private _platform: Laya.Sprite;
}
