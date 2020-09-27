const stateBufferSize: number = 20;

class ClientNetwork extends GameObject {
  public syncSnapShot(snapshot: ISnapshot) {
    if (this._needCorrectionOnNextState) {
      this._needCorrectionOnNextState = false;
      this._entity.pos(snapshot.position.x, snapshot.position.y);
      this._states = [];
    }

    if (this._states.length === 0) {
      this._states.push(snapshot);
      this._currentLastKnownState = this._states[0];
    } else {
      if (snapshot.timestamp < this._currentLastKnownState.timestamp) {
        return;
      }

      if (this._states.length >= stateBufferSize) {
        this._states.pop();
      }
      this._states.unshift(snapshot);
      this._currentLastKnownState = this._states[0];
    }
  }

  public fixedUpdate() {
    if (this._states.length === 0) {
      return;
    }

    if (
      this._states.length === 1 ||
      !Demo.instance.enableNetworkInterpolation
    ) {
      this._entity.pos(
        this._currentLastKnownState.position.x,
        this._currentLastKnownState.position.y
      );
      return;
    }

    const interpolationStartTime =
      this.getServerTime() - Demo.instance.interpolationDelayTime;
    if (interpolationStartTime < this._currentLastKnownState.timestamp) {
      this.doInterpolation(interpolationStartTime);
    } else if (
      interpolationStartTime <
      this._currentLastKnownState.timestamp + Demo.instance.maxExtrapolationTime
    ) {
      this.doExtrapolation(interpolationStartTime);
    }
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
  }

  // algorithm is based on https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking
  private doInterpolation(interpolationStartTime: number) {
    for (let i = 0; i < this._states.length; i++) {
      const state = this._states[i];
      if (
        state.timestamp <= interpolationStartTime ||
        i === this._states.length - 1
      ) {
        const latterState = this._states[Math.max(i - 1, 0)];
        const earlierState = state;
        const length = latterState.timestamp - earlierState.timestamp;
        let t = 0;
        if (length > 0) {
          t =
            (Math.max(interpolationStartTime, earlierState.timestamp) -
              earlierState.timestamp) /
            length;
        }
        const targetPosition = Muse.Vector.lerp(
          earlierState.position,
          latterState.position,
          t
        );
        const currentPosition = new Muse.Vector(this._entity.x, this._entity.y);
        if (Muse.Vector.sqrDistance(targetPosition, currentPosition) < 5) {
          this._entity.pos(targetPosition.x, targetPosition.y);
        } else {
          const position = Muse.Vector.lerp(
            currentPosition,
            targetPosition,
            0.2
          );
          this._entity.pos(position.x, position.y);
        }

        return;
      }
    }
  }

  private doExtrapolation(time: number) {
    const delta = this._currentLastKnownState.velocity.scale(
      time - this._currentLastKnownState.timestamp
    );
    const targetPosition = new Muse.Vector(
      this._entity.x + delta.x,
      this._entity.y + delta.y
    );

    if (
      Muse.Vector.distance(
        targetPosition,
        this._currentLastKnownState.position
      ) > Demo.instance.tolerantDistance
    ) {
      this._needCorrectionOnNextState = true;
    } else {
      this._entity.x = targetPosition.x;
      this._entity.y = targetPosition.y;
    }
  }

  private getServerTime(): number {
    return Muse.timer.fixedTime - Demo.instance.latencyMilliseconds;
  }

  private _currentSimulateTime: number;
  private _needCorrectionOnNextState: boolean;
  private _currentLastKnownState: ISnapshot;
  private _states: ISnapshot[] = [];

  private _velocity: Muse.Vector;
}
