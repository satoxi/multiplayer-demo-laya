/// <reference path='./tween/TweenInterfaces.ts' />
/// <reference path='./tween/TweenMgr.ts' />
/// <reference path='./tween/Tweens.ts' />
/// <reference path='./tween/TweenCollection.ts' />

namespace Muse {
  export interface IFadeDelegate {
    startFade(onFullFade: Laya.Handler, onComplete: Laya.Handler): void;
  }

  export class FadeTransition implements IFadeDelegate {
    public constructor(color: string = '#333333', duration: number = 1000) {
      this._color = Color.createFromHex(color);
      this._duration = duration;
    }

    public startFade(onFullFade: Laya.Handler, onComplete: Laya.Handler) {
      if (!this._mask) {
        this._mask = new Laya.Sprite();
        this._mask.zOrder = 100000;
        this._mask.size(Laya.stage.width, Laya.stage.height);
        this._mask.pos(0, 0);
        this._mask.mouseEnabled = true;
      }

      TweenMgr.stopAllTweensWithTarget(this._mask);
      this._mask.graphics.clear();
      this._mask.graphics.drawRect(
        -10,
        -10,
        Laya.stage.width + 20,
        Laya.stage.height + 20,
        this._color.toHex()
      );
      this._mask.alpha = 0;
      Laya.stage.addChild(this._mask);

      tween(this._mask, 'alpha', 1, this._duration)
        .setEaseType(Laya.Ease.sineInOut)
        .setLoops(LoopType.PingPong, 1, 0)
        .setLoopCompletionHandler(() => {
          if (onFullFade) {
            onFullFade.run();
          }
        })
        .setCompletionHandler(() => {
          Laya.stage.removeChild(this._mask);
          if (onComplete) {
            onComplete.run();
          }
        })
        .start();
    }

    private _mask: Laya.Sprite;
    private _color: Color;
    private _duration: number;
  }

  export const defaultTransition = new FadeTransition();

  export class TransitionUtils {
    public static fadeWithDelegate(
      delegate: IFadeDelegate,
      onFullFade: Laya.Handler,
      onComplete: Laya.Handler = null
    ) {
      delegate.startFade(onFullFade, onComplete);
    }
  }
}
