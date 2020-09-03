namespace Muse {
  export class TKTapRecognizer extends TKAbstractGestureRecognizer {
    public onTap: Observable = new Observable();
    public numberOfTapsRequired: number = 1;
    public numberOfTouchesRequired: number = 1;

    public constructor(
      maxDurationForTapConsideration: number = 500,
      maxDeltaMovementForTapConsiderationCm: number = 2
    ) {
      super();
      this._maxDurationForTapConsideration = maxDurationForTapConsideration;
      this._maxDeltaMovementForTapConsideration = maxDeltaMovementForTapConsiderationCm;
    }

    protected fireRecognizedEvent() {
      this.onTap.notify(this);
    }

    protected touchesBegan(touches: TKTouch[]): boolean {
      if (
        Laya.timer.currTimer >
          this._touchBeganTime + this._maxDurationForTapConsideration &&
        (this._preformedTapsCount !== 0 &&
          this._preformedTapsCount < this.numberOfTapsRequired)
      ) {
        this.state = TKGestureRecognizerState.FailedOrEnded;
      }

      if (this.state === TKGestureRecognizerState.Possible) {
        for (let i = 0; i < touches.length; i++) {
          //  only add touches in the Began phase
          if (touches[i].phase === TouchPhase.Began) {
            this._trackingTouches.push(touches[i]);
            if (this._trackingTouches.length === this.numberOfTouchesRequired) {
              break;
            }
          }
        }

        //  end for
        if (this._trackingTouches.length === this.numberOfTouchesRequired) {
          this._touchBeganTime = Laya.timer.currTimer;
          this._preformedTapsCount = 0;
          this.state = TKGestureRecognizerState.Began;
          return true;
        }
      }

      return false;
    }

    protected touchesMoved(touches: TKTouch[]) {
      if (this.state === TKGestureRecognizerState.Began) {
        //  did we move?
        for (let i = 0; i < touches.length; i++) {
          if (
            Math.abs(touches[i].position.x - touches[i].startPosition.x) /
              TouchConfig.screenPixelsPerCm >
              this._maxDeltaMovementForTapConsideration ||
            Math.abs(touches[i].position.y - touches[i].startPosition.y) /
              TouchConfig.screenPixelsPerCm >
              this._maxDeltaMovementForTapConsideration
          ) {
            this.state = TKGestureRecognizerState.FailedOrEnded;
            break;
          }
        }
      }
    }

    protected touchesEnded(touches: TKTouch[]) {
      if (
        this.state === TKGestureRecognizerState.Began &&
        Laya.timer.currTimer <=
          this._touchBeganTime + this._maxDurationForTapConsideration
      ) {
        this._preformedTapsCount++;
        if (this._preformedTapsCount === this.numberOfTapsRequired) {
          this.state = TKGestureRecognizerState.Recognized;
        }
      } else {
        this.state = TKGestureRecognizerState.FailedOrEnded;
      }
    }

    //  taps that last longer than this duration will be ignored
    private _maxDurationForTapConsideration: number = 500;
    private _maxDeltaMovementForTapConsideration: number = 1;
    private _touchBeganTime: number = 0;
    private _preformedTapsCount: number = 0;
  }
}
