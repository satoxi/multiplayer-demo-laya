namespace Muse {
  const MaxDeltaTime = 100;

  type updateFunction = (dt: number) => void;

  export interface IUpdatable {
    caller: object;
    update: updateFunction;
    paused: boolean;
  }

  export function l(message?: any, ...optionalParams: any[]) {
    console.log(`[${timer.fixedFrame}]`, message, optionalParams);
  }

  export function w(message?: any, ...optionalParams: any[]) {
    console.warn(`[${timer.fixedFrame}]`, message, optionalParams);
  }

  const fixedTimeStep: number = 17;

  class UpdatableMgr {
    public constructor() {
      this._updatables = [];
      this._fixedUpdatables = [];
      this._lastUpdateTime = 0;
      this._lastFixedUpdateTime = 0;
      this._lastUpdateRealTime = 0;
      this._time = new Time();
      this._fixedTime = new Time();
    }

    public enableFixedUpdate: boolean = true;
    public maxFixedUpdatePerFrame: number = 2;
    public timeToIngorePhysicsUpdate: number = 50;

    public get realTimeSinceStartUp(): number {
      return this._realTimeSinceStartup;
    }

    public get time(): number {
      return this._time.time;
    }

    public get deltaTime(): number {
      return this._time.deltaTime;
    }

    public get timeScale(): number {
      return this._time.timeScale;
    }

    public set timeScale(value: number) {
      this._time.timeScale = value;
      this._fixedTime.timeScale = value;
    }

    public get fixedTime(): number {
      return this._fixedTime.time;
    }

    public get fixedDeltaTime(): number {
      return this._fixedTime.deltaTime;
    }

    public get fixedFrame(): number {
      return this._fixedFrame;
    }

    public start() {
      this._lastUpdateTime = 0;
      this._lastFixedUpdateTime = 0;
      this._realTimeSinceStartup = 0;
      this._lastUpdateRealTime = 0;
      this._fixedFrame = 0;
      Laya.timer.frameLoop(1, this, this.update);
      this._onShowCallback = this.onShow.bind(this);
      this._onHideCallback = this.onHide.bind(this);
      wx.onShow(this._onShowCallback);
      wx.onHide(this._onHideCallback);
    }

    public destroy() {
      Laya.timer.clearAll(this);
    }

    public add(caller: object, update: updateFunction) {
      if (
        this._updatables.findIndex(
          u => u.update === update && u.caller === caller
        ) === -1
      ) {
        this._updatables.push({ caller, update, paused: false });
      }
    }

    public remove(caller: object, update: updateFunction) {
      const index = this.getUpdatableIndex(caller, update);
      if (index >= 0) {
        this._updatables.splice(index, 1);
      }
    }

    public addFixedUpdate(caller: object, update: updateFunction) {
      if (
        this._fixedUpdatables.findIndex(
          u => u.update === update && u.caller === caller
        ) === -1
      ) {
        this._fixedUpdatables.push({ caller, update, paused: false });
      }
    }

    public removeFixedUpdate(caller: object, update: updateFunction) {
      const index = this._fixedUpdatables.findIndex(
        u => u.update === update && u.caller === caller
      );
      if (index >= 0) {
        this._fixedUpdatables.splice(index, 1);
      }
    }

    public pause(caller: object, update: updateFunction) {
      const index = this.getUpdatableIndex(caller, update);
      if (index >= 0) {
        this._updatables[index].paused = true;
      }
    }

    public unpause(caller: object, update: updateFunction) {
      const index = this.getUpdatableIndex(caller, update);
      if (index >= 0) {
        this._updatables[index].paused = false;
      }
    }

    public clear(caller: object) {
      for (let i = this._updatables.length - 1; i >= 0; i--) {
        const u = this._updatables[i];
        if (u.caller === caller) {
          this._updatables.splice(i, 1);
        }
      }
      for (let i = this._fixedUpdatables.length - 1; i >= 0; i--) {
        const u = this._fixedUpdatables[i];
        if (u.caller === caller) {
          this._fixedUpdatables.splice(i, 1);
        }
      }
    }

    public clearAll() {
      this._updatables = [];
      this._fixedUpdatables = [];
    }

    private getUpdatableIndex(caller: object, update: Function): number {
      return this._updatables.findIndex(
        u => u.update === update && u.caller === caller
      );
    }

    private onShow() {
      Laya.timer.scale = 1;
      Laya.scaleTimer.scale = 1;
      this._fixedTime.timeScale = 1;
      this._lastUpdateTime = 0;
      this._lastFixedUpdateTime = 0;
    }

    private onHide() {
      Laya.timer.scale = 0;
      Laya.scaleTimer.scale = 0;
      this._fixedTime.timeScale = 0;
    }

    private update() {
      if (this._lastUpdateTime === 0) {
        this._lastUpdateTime = Laya.timer.currTimer;
        this._lastFixedUpdateTime = Laya.timer.currTimer;
        return;
      }

      const dt = Laya.timer.currTimer - this._lastUpdateTime;
      const realNow = Date.now();
      const realtimeDt = realNow - this._lastUpdateRealTime;
      if (realtimeDt < MaxDeltaTime && realtimeDt >= 0) {
        this._realTimeSinceStartup += realtimeDt;
      }
      if (dt < MaxDeltaTime && dt > 0) {
        if (this.enableFixedUpdate) {
          this.applyFixedUpdate(dt);
        } else {
          this.applyQualityFrameUpdate(dt);
        }

        this._time.update(dt);
        for (let i = this._updatables.length - 1; i >= 0; i--) {
          const u = this._updatables[i];
          if (!u.paused) {
            if (u.caller) {
              u.update.call(u.caller, this._time.deltaTime);
            } else {
              u.update(this._time.deltaTime);
            }
          }
        }
      } else {
        if (dt >= MaxDeltaTime) {
          this._lastFixedUpdateTime = Laya.timer.currTimer;
        }
      }
      this._lastUpdateTime = Laya.timer.currTimer;
      this._lastUpdateRealTime = realNow;
    }

    private applyFixedUpdate(dt: number) {
      if (dt > this.timeToIngorePhysicsUpdate) {
        this._lastFixedUpdateTime = Laya.timer.currTimer;
        return;
      }
      const delta =
        dt >= fixedTimeStep * 2 && this.maxFixedUpdatePerFrame > 2
          ? fixedTimeStep * 2
          : fixedTimeStep;
      let n = 0;
      while (this._lastFixedUpdateTime + delta < Laya.timer.currTimer) {
        this._lastFixedUpdateTime += delta;
        if (n < this.maxFixedUpdatePerFrame) {
          this.oneFixedUpdate(delta);
        }
        n++;
      }
    }

    private applyQualityFrameUpdate(dt: number) {
      if (dt > 45) {
        const delta = 30;
        let t = this._lastUpdateTime;
        while (t + delta < Laya.timer.currTimer) {
          t += delta;
          this.oneFixedUpdate(delta);
        }
        this.oneFixedUpdate(Laya.timer.currTimer - t);
      } else {
        this.oneFixedUpdate(dt);
      }
      this._lastFixedUpdateTime = Laya.timer.currTimer;
    }

    private oneFixedUpdate(dt: number) {
      this._fixedTime.update(dt);
      for (let i = this._fixedUpdatables.length - 1; i >= 0; i--) {
        const u = this._fixedUpdatables[i];
        if (!u.paused) {
          if (u.caller) {
            u.update.call(u.caller, this._fixedTime.deltaTime);
          } else {
            u.update(this._fixedTime.deltaTime);
          }
        }
      }
      ++this._fixedFrame;
    }

    private _updatables: IUpdatable[];
    private _time: Time;
    private _lastUpdateTime: number;
    private _lastUpdateRealTime: number;
    private _realTimeSinceStartup: number;

    private _lastFixedUpdateTime: number;
    private _fixedUpdatables: IUpdatable[];
    private _fixedTime: Time;
    private _fixedFrame: number;

    private _onShowCallback: Function;
    private _onHideCallback: Function;
  }

  /// <summary>
  /// provides frame timing information
  /// </summary>
  export class Time {
    /// <summary>
    /// total time the game has been running
    /// </summary>
    public get time(): number {
      return this._time;
    }

    /// <summary>
    /// delta time from the previous frame to the current, scaled by timeScale
    /// </summary>
    public get deltaTime(): number {
      return this._deltaTime;
    }

    /// <summary>
    /// unscaled version of deltaTime. Not affected by timeScale
    /// </summary>
    public get unscaledDeltaTime(): number {
      return this._unscaledDeltaTime;
    }

    /// <summary>
    /// time scale of deltaTime
    /// </summary>
    public get timeScale() {
      return this._timeScale;
    }

    public set timeScale(value: number) {
      this._timeScale = value;
    }

    /// <summary>
    /// total number of frames that have passed
    /// </summary>
    public get frameCount(): number {
      return this._frameCount;
    }

    public constructor() {
      this._time = 0;
      this._deltaTime = 0;
      this._timeScale = 1;
      this._unscaledDeltaTime = 0;
      this._frameCount = 0;
    }

    public update(dt: number) {
      this._time += dt * this._timeScale;
      this._deltaTime = dt * this._timeScale;
      this._unscaledDeltaTime = dt;
      this._frameCount++;
    }

    private _time: number;
    private _deltaTime: number;
    private _timeScale: number;
    private _unscaledDeltaTime: number;
    private _frameCount: number;
  }

  export let timer: UpdatableMgr = null;

  export function init() {
    timer = new UpdatableMgr();
    const tweenMgr = new TweenMgr();
    timer.add(tweenMgr, tweenMgr.update);
    timer.start();
  }
}
