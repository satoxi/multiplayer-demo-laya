/// <reference path='./TweenInterfaces.ts' />
/// <reference path='./TweenMgr.ts' />
/// <reference path='../MathUtils.ts' />

namespace Muse {
  export enum TweenState {
    Running,
    Paused,
    Complete,
  }

  export abstract class Tween<T> implements ITweenable, ITween<T> {
    public constructor() {
      this._shouldRecycleTween = true;
      this._tweenState = TweenState.Complete;
      this._timeScale = 1;
    }

    public get toValue(): T {
      return this._toValue;
    }

    /// <summary>
    /// resets all state to defaults and sets the initial state
    /// based on the paramaters passed in. This method serves
    /// as an entry point so that Tween subclasses can call it
    /// and so that tweens can be recycled. When recycled,
    /// the constructor will not be called again
    /// so this method encapsulates what the constructor would be doing.
    /// </summary>
    /// <param name="target">Target.</param>
    /// <param name="to">To.</param>
    /// <param name="duration">Duration.</param>
    public initialize(target: ITweenTarget<T>, to: T, duration: number): void {
      // reset state in case we were recycled
      this.resetState();

      this._target = target;
      this._toValue = to;
      this._duration = duration;
    }

    public setEaseType(easeType: Function): ITween<T> {
      this._easeType = easeType;
      return this;
    }

    public setDelay(delay: number): ITween<T> {
      this._delay = delay;
      this._elapsedTime = -delay;
      return this;
    }

    public setDuration(duration: number): ITween<T> {
      this._duration = duration;
      return this;
    }

    public setTimeScale(timeScale: number): ITween<T> {
      this._timeScale = timeScale;
      return this;
    }

    public setIsTimeScaleIndependent(): ITween<T> {
      this._isTimeScaleIndependent = true;
      return this;
    }

    public setCompletionHandler(completionHandler: Function): ITween<T> {
      this._completionHandler = completionHandler;
      return this;
    }

    public setUpdateHandler(updateHandler: Function): ITween<T> {
      this._updateHandler = updateHandler;
      return this;
    }

    public setLoops(
      loopType: LoopType,
      loops: number = 1,
      delayBetweenLoops: number = 0
    ): ITween<T> {
      this._loopType = loopType;
      this._delayBetweenLoops = delayBetweenLoops;

      // double the loop count for ping-pong
      if (loopType === LoopType.PingPong) {
        loops = loops * 2;
      }
      this._loops = loops;

      return this;
    }

    public setLoopCompletionHandler(loopCompleteHandler: Function): ITween<T> {
      this._loopCompleteHandler = loopCompleteHandler;
      return this;
    }

    public setFrom(from: T): ITween<T> {
      this._isFromValueOverridden = true;
      this._fromValue = from;
      return this;
    }

    public prepareForReuse(from: T, to: T, duration: number): ITween<T> {
      this.initialize(this._target, to, duration);
      return this;
    }

    public setRecycleTween(shouldRecycleTween: boolean): ITween<T> {
      this._shouldRecycleTween = shouldRecycleTween;
      return this;
    }

    public abstract setIsRelative(): ITween<T>;

    public getContext(): object {
      return this._context;
    }

    public setContext(context: object): ITween<T> {
      this._context = context;
      return this;
    }

    public setNextTween(nextTween: ITweenable): ITween<T> {
      this._nextTween = nextTween;
      return this;
    }

    public tick(deltaTime: number): boolean {
      if (this._tweenState === TweenState.Paused) {
        return false;
      }

      // when we loop we clamp values between 0 and duration.
      // this will hold the excess that we clamped off so it can be reapplied
      let elapsedTimeExcess = 0;
      if (!this._isRunningInReverse && this._elapsedTime >= this._duration) {
        elapsedTimeExcess = this._elapsedTime - this._duration;
        this._elapsedTime = this._duration;
        this._tweenState = TweenState.Complete;
      } else if (this._isRunningInReverse && this._elapsedTime <= 0) {
        elapsedTimeExcess = 0 - this._elapsedTime;
        this._elapsedTime = 0;
        this._tweenState = TweenState.Complete;
      }

      // elapsed time will be negative while we are delaying the start of the tween so dont update the value
      if (this._elapsedTime >= 0 && this._elapsedTime <= this._duration) {
        this.updateValue();
        if (this._updateHandler) {
          this._updateHandler(this);
        }
      }

      // if we have a loopType and we are Complete (meaning we reached 0 or duration) handle the loop.
      // handleLooping will take any excess elapsedTime and factor it in and call udpateValue if necessary to keep
      // the tween perfectly accurate.
      if (
        this._loopType !== LoopType.None &&
        this._tweenState === TweenState.Complete &&
        this._loops > 0
      ) {
        this.handleLooping(elapsedTimeExcess);
      }

      // var deltaTime = this._isTimeScaleIndependent
      //   ? time.unscaledDeltaTime
      //   : time.deltaTime;
      deltaTime *= this._timeScale;

      // running in reverse? then we need to subtract deltaTime
      if (this._isRunningInReverse) {
        this._elapsedTime -= deltaTime;
      } else {
        this._elapsedTime += deltaTime;
      }

      if (this._tweenState === TweenState.Complete) {
        if (this._completionHandler) {
          this._completionHandler(this);
        }

        // if we have a nextTween add it to TweenManager so that it can start running
        if (this._nextTween) {
          this._nextTween.start();
          this._nextTween = null;
        }

        return true;
      }

      return false;
    }

    public recycleSelf(): void {
      if (this._shouldRecycleTween) {
        if (this._target) {
          this._target.recycleSelf();
        }
        this._context = null;
        this._target = null;
        this._nextTween = null;
        this.resetState();
      }
    }

    public isRunning(): boolean {
      return this._tweenState === TweenState.Running;
    }

    public start(): void {
      if (!this._isFromValueOverridden) {
        this._fromValue = this._target.getTweenedValue();
      }

      if (this._tweenState === TweenState.Complete) {
        this._tweenState = TweenState.Running;
        TweenMgr.addTween(this);
      }
    }

    public pause(): void {
      this._tweenState = TweenState.Paused;
    }

    public resume(): void {
      this._tweenState = TweenState.Running;
    }

    public stop(bringToCompletion: boolean): void {
      this._tweenState = TweenState.Complete;

      if (bringToCompletion) {
        // if we are running in reverse we finish up at 0 else we go to duration
        this._elapsedTime = this._isRunningInReverse ? 0 : this._duration;
        this._loopType = LoopType.None;
        this._loops = 0;

        // TweenManager will handle removal on the next tick
      } else {
        TweenMgr.removeTween(this);
      }
    }

    public jumpToElapsedTime(elapsedTime: number): void {
      this._elapsedTime = MathUtils.clamp(elapsedTime, 0, this._duration);
      this.updateValue();
    }

    public getTargetObject(): object {
      return this._target.getTargetObject();
    }

    /// <summary>
    /// reverses the current tween. if it was going forward it will be going backwards and vice versa.
    /// </summary>
    public reverseTween(): void {
      this._isRunningInReverse = !this._isRunningInReverse;
    }

    protected abstract updateValue(): void;

    /// <summary>
    /// handles loop logic
    /// </summary>
    private handleLooping(elapsedTimeExcess: number): void {
      this._loops--;
      if (this._loopType === LoopType.PingPong) {
        this.reverseTween();
      }

      if (
        this._loopType === LoopType.RestartFromBeginning ||
        this._loops % 2 === 1
      ) {
        if (this._loopCompleteHandler) {
          this._loopCompleteHandler(this._loops);
        }
      }

      // if we have loops left to process reset our state back to Running so we can continue processing them
      if (this._loops > 0) {
        this._tweenState = TweenState.Running;

        // now we need to set our elapsed time and factor in our elapsedTimeExcess
        if (this._loopType === LoopType.RestartFromBeginning) {
          this._elapsedTime = elapsedTimeExcess - this._delayBetweenLoops;
        } else {
          if (this._isRunningInReverse) {
            this._elapsedTime += this._delayBetweenLoops - elapsedTimeExcess;
          } else {
            this._elapsedTime = elapsedTimeExcess - this._delayBetweenLoops;
          }
        }

        // if we had an elapsedTimeExcess and no delayBetweenLoops update the value
        if (this._delayBetweenLoops === 0 && elapsedTimeExcess > 0) {
          this.updateValue();
        }
      }
    }

    protected resetState() {
      this._context = null;
      this._completionHandler = this._loopCompleteHandler = this._updateHandler = null;
      this._isFromValueOverridden = false;
      this._isTimeScaleIndependent = false;
      this._tweenState = TweenState.Complete;
      // TODO: I don't think we should ever flip the flag
      // from _shouldRecycleTween = false without the user's consent.
      // Needs research and some thought
      // _shouldRecycleTween = true;
      this._isRelative = false;
      this._easeType = TweenMgr.defaultEaseType;

      if (this._nextTween) {
        this._nextTween.recycleSelf();
        this._nextTween = null;
      }

      this._delay = 0;
      this._duration = 0;
      this._timeScale = 1;
      this._elapsedTime = 0;
      this._loopType = LoopType.None;
      this._delayBetweenLoops = 0;
      this._loops = 0;
      this._isRunningInReverse = false;
    }

    protected _context: object;
    protected _target: ITweenTarget<T>;
    protected _isFromValueOverridden: boolean;
    protected _fromValue: T;
    protected _toValue: T;
    protected _easeType: Function;
    protected _shouldRecycleTween: boolean = true;
    protected _isRelative: boolean;
    protected _updateHandler: Function;
    protected _completionHandler: Function;
    protected _loopCompleteHandler: Function;
    protected _nextTween: ITweenable;

    // tween state
    protected _tweenState: TweenState = TweenState.Complete;
    private _isTimeScaleIndependent: boolean;
    protected _delay: number;
    protected _duration: number;
    protected _timeScale: number = 1;
    protected _elapsedTime: number;

    // loop state
    protected _loopType: LoopType;
    protected _loops: number;
    protected _delayBetweenLoops: number;
    private _isRunningInReverse: boolean;
  }
}
