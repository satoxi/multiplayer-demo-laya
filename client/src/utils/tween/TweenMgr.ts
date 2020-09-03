namespace Muse {
  export class TweenMgr {
    public static defaultEaseType: Function = Laya.Ease.linearNone;

    public constructor() {
      TweenMgr._instance = this;
      this._activeTweens = [];
      this._tempTweens = [];
    }

    public update(dt: number) {
      this._isUpdating = true;

      // loop backwards so we can remove completed tweens
      for (let i = this._activeTweens.length - 1; i >= 0; --i) {
        const tween = this._activeTweens[i];
        if (this._tempTweens.indexOf(tween) > -1) {
          // this tween is already deleted by previous tween tick of this loop
          continue;
        }
        if (tween.tick(dt)) {
          this._tempTweens.push(tween);
        }
      }

      this._isUpdating = false;

      // kill the dead Tweens
      for (let i = 0; i < this._tempTweens.length; i++) {
        this._tempTweens[i].recycleSelf();
        const index = this._activeTweens.indexOf(this._tempTweens[i]);
        if (index > -1) {
          this._activeTweens.splice(index, 1);
        }
      }
      this._tempTweens = [];
    }

    /// <summary>
    /// adds a tween to the active tweens list
    /// </summary>
    /// <param name="tween">Tween.</param>
    public static addTween(tween: ITweenable): void {
      TweenMgr._instance._activeTweens.push(tween);
    }

    /// <summary>
    /// removes a tween from the active tweens list
    /// </summary>
    /// <param name="tween">Tween.</param>
    public static removeTween(tween: ITweenable): void {
      if (TweenMgr._instance._isUpdating) {
        TweenMgr._instance._tempTweens.push(tween);
      } else {
        tween.recycleSelf();
        const index = TweenMgr._instance._activeTweens.indexOf(tween);
        if (index > -1) {
          TweenMgr._instance._activeTweens.splice(index, 1);
        }
      }
    }

    /// <summary>
    /// stops all tweens optionlly bringing them all to completion
    /// </summary>
    /// <param name="bringToCompletion">If set to <c>true</c> bring to completion.</param>
    public static stopAllTweens(bringToCompletion: boolean = false): void {
      for (let i = TweenMgr._instance._activeTweens.length - 1; i >= 0; --i) {
        TweenMgr._instance._activeTweens[i].stop(bringToCompletion);
      }
    }

    /// <summary>
    /// returns all the tweens that have a specific context.
    /// Tweens are returned as ITweenable since that is all
    /// that TweenManager knows about.
    /// </summary>
    /// <returns>The tweens with context.</returns>
    /// <param name="context">Context.</param>
    public static allTweensWithContext(context: object): ITweenable[] {
      const foundTweens = [];

      for (let i = 0; i < TweenMgr._instance._activeTweens.length; i++) {
        const tween = TweenMgr._instance._activeTweens[i];
        if (tween.getContext() === context) {
          foundTweens.push(tween);
        }
      }

      return foundTweens;
    }

    /// <summary>
    /// stops all the tweens with a given context
    /// </summary>
    /// <returns>The tweens with context.</returns>
    /// <param name="context">Context.</param>
    public static stopAllTweensWithContext(
      context: object,
      bringToCompletion: boolean = false
    ): void {
      for (let i = TweenMgr._instance._activeTweens.length - 1; i >= 0; --i) {
        const tween = TweenMgr._instance._activeTweens[i];
        if (tween.getContext() === context) {
          tween.stop(bringToCompletion);
        }
      }
    }

    /// <summary>
    /// returns all the tweens that have a specific target. Tweens are returned as ITweenControl since that is all
    /// that TweenManager knows about.
    /// </summary>
    /// <returns>The tweens with target.</returns>
    /// <param name="target">target.</param>
    public static allTweensWithTarget(target: object): ITweenable[] {
      const foundTweens = [];

      for (let i = 0; i < TweenMgr._instance._activeTweens.length; i++) {
        const tweenControl = TweenMgr._instance._activeTweens[
          i
        ] as ITweenControl;
        if (
          tweenControl &&
          typeof tweenControl.getTargetObject === 'function' &&
          tweenControl.getTargetObject() === target
        ) {
          foundTweens.push(TweenMgr._instance._activeTweens[i] as ITweenable);
        }
      }

      return foundTweens;
    }

    /// <summary>
    /// stops all the tweens that have a specific target
    /// that TweenManager knows about.
    /// </summary>
    /// <param name="target">target.</param>
    public static stopAllTweensWithTarget(
      target: object,
      bringToCompletion: boolean = false
    ): void {
      for (let i = TweenMgr._instance._activeTweens.length - 1; i >= 0; --i) {
        const tweenControl = TweenMgr._instance._activeTweens[
          i
        ] as ITweenControl;
        if (
          tweenControl.getTargetObject &&
          typeof tweenControl.getTargetObject === 'function' &&
          tweenControl.getTargetObject() === target
        ) {
          tweenControl.stop(bringToCompletion);
        }
      }
    }

    /// <summary>
    /// internal list of all the currently active tweens
    /// </summary>
    private _activeTweens: ITweenable[];

    /// <summary>
    /// stores tweens marked for removal
    /// </summary>
    private _tempTweens: ITweenable[];

    /// <summary>
    /// flag indicating the tween update loop is running
    /// </summary>
    private _isUpdating: boolean;

    private static _instance: TweenMgr;
  }
}
