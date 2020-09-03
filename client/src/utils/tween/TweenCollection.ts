/// <reference path='./AbstractTweenable.ts' />

namespace Muse {
  /// <summary>
  /// provides a container that allows you to chain together 2 or more ITweenables.
  /// They will run one after the other until
  /// all of them are complete.
  /// </summary>
  export class TweenChain extends AbstractTweenable {
    public get totalTweens() {
      return this._tweenList.length;
    }

    public constructor() {
      super();
      this._tweenList = [];
    }

    public start(): void {
      // prep our first tween
      if (this._tweenList.length > 0) {
        this._tweenList[0].start();
      }
      super.start();
    }

    /// <summary>
    /// bringToCompletion is ignored for chains due to it not having a solid, specific meaning for a chain
    /// </summary>
    /// <param name="bringToCompletion">If set to <c>true</c> bring to completion.</param>
    public stop(bringToCompletion: boolean = false): void {
      this._currentTween = this._tweenList.length;
    }

    public tick(dt: number): boolean {
      if (this._isPaused) {
        return false;
      }

      // if currentTween is greater than we've got in the tweenList end this chain
      if (this._currentTween >= this._tweenList.length) {
        return true;
      }

      const tween = this._tweenList[this._currentTween];
      if (tween.tick(dt)) {
        this._currentTween++;
        if (this._currentTween === this._tweenList.length) {
          if (this._completionHandler) {
            this._completionHandler(this);
          }
          return true;
        } else {
          // we have a new tween so start it
          this._tweenList[this._currentTween].start();
        }
      }

      return false;
    }

    public recycleSelf(): void {
      for (let i = 0; i < this._tweenList.length; i++) {
        this._tweenList[i].recycleSelf();
      }
      this._tweenList = [];
      this._currentTween = 0;
      this._completionHandler = null;
    }

    public appendTween(tween: ITweenable): TweenChain {
      if (tween instanceof ActionTask) {
        console.warn('ActionTask is not allowed to be added to TweenChain');
        return this;
      }
      tween.resume();
      this._tweenList.push(tween);

      return this;
    }

    /// <summary>
    /// chainable. sets the action that should be called when the tween is complete.
    /// </summary>
    public setCompletionHandler(completionHandler: Function): TweenChain {
      this._completionHandler = completionHandler;
      return this;
    }

    private _tweenList: ITweenable[];
    private _currentTween: number = 0;
    private _completionHandler: Function;
  }

  export class TweenFlow extends AbstractTweenable {
    public get totalTweens() {
      return this._tweenList.length;
    }

    public constructor() {
      super();
      this._tweenList = [];
      this._finishedTweens = [];
      this._completionHandler = null;
    }

    public start(): void {
      this._tweenList.forEach(tween => {
        tween.start();
      });
      super.start();
    }

    public stop(bringToCompletion: boolean = false): void {
      this._tweenList.forEach(tween => {
        tween.stop(bringToCompletion);
      });
      // we wont stop this if brintToCompletion=true,
      // because we need another this.tick to bring child tweens to final state
      if (!bringToCompletion) {
        super.stop(false);
      }
    }

    public addTween(tween: ITweenable): TweenFlow {
      if (tween instanceof ActionTask) {
        console.warn('ActionTask is not allowed to be added to TweenFlow');
        return this;
      }
      tween.resume();
      this._tweenList.push(tween);
      return this;
    }

    public tick(deltaTime: number): boolean {
      if (this._isPaused) {
        return false;
      }

      for (let i = this._tweenList.length - 1; i >= 0; i--) {
        const tween = this._tweenList[i];
        if (tween.tick(deltaTime)) {
          this._finishedTweens.push(tween);
          this._tweenList.splice(i, 1);
        }
      }
      if (this._tweenList.length === 0) {
        if (this._completionHandler) {
          this._completionHandler(this);
        }
        return true;
      }
      return false;
    }

    public recycleSelf(): void {
      for (let i = 0; i < this._finishedTweens.length; i++) {
        this._finishedTweens[i].recycleSelf();
      }
      this._finishedTweens = [];
      for (let i = 0; i < this._tweenList.length; i++) {
        this._tweenList[i].recycleSelf();
      }
      this._tweenList = [];
      this._completionHandler = null;
    }

    public setCompletionHandler(completionHandler: Function): TweenFlow {
      this._completionHandler = completionHandler;
      return this;
    }

    private _finishedTweens: ITweenable[];
    private _tweenList: ITweenable[];
    private _completionHandler: Function;
  }
}
