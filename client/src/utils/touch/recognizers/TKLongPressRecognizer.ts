namespace Muse {
  ///  <summary>
  ///  detects a long press.
  ///  The gesture is considered recognized when a touch has been down
  ///  for minimumPressDuration and if it has moved less than allowableMovement
  ///  </summary>
  export class TKLongPressRecognizer extends TKAbstractGestureRecognizer {
    public onLongPress: ObservableT<TKLongPressRecognizer> = new ObservableT();
    public onLongPressEnd: ObservableT<
      TKLongPressRecognizer
    > = new ObservableT();

    //  fired when after a successful long press the finger is lifted
    public minimumPressDuration: number = 500;
    public requiredTouchesCount: number = -1;
    public allowableMovementCm: number = 1;

    public constructor(
      minimumPressDuration: number = 500,
      allowableMovement: number = -1,
      requiredTouchesCount: number = 1
    ) {
      super();
      this.minimumPressDuration = minimumPressDuration;
      this.allowableMovementCm = allowableMovement;
      this.requiredTouchesCount = requiredTouchesCount;
    }

    protected fireRecognizedEvent() {
      this.onLongPress.notify(this);
    }

    protected touchesBegan(touches: TKTouch[]): boolean {
      if (
        !this._waiting &&
        (this.state === TKGestureRecognizerState.Possible &&
          (this.requiredTouchesCount === -1 ||
            touches.length === this.requiredTouchesCount))
      ) {
        this._beginLocation = touches[0].position;
        this.startWait();
        this._trackingTouches.push(touches[0]);
        this.state = TKGestureRecognizerState.Began;
      } else if (this.requiredTouchesCount !== -1) {
        this.stopWait();
      }

      return false;
    }

    protected touchesMoved(touches: TKTouch[]) {
      if (
        this.state === TKGestureRecognizerState.Began ||
        this.state === TKGestureRecognizerState.RecognizedAndStillRecognizing
      ) {
        //  did we move too far?
        const moveDistance =
          Vector.distance(touches[0].position, this._beginLocation) /
          TouchConfig.screenPixelsPerCm;
        if (moveDistance > this.allowableMovementCm) {
          //  fire the complete event if we had previously recognized a long press
          if (
            this.state ===
            TKGestureRecognizerState.RecognizedAndStillRecognizing
          ) {
            this.onLongPressEnd.notify(this);
          }

          this.state = TKGestureRecognizerState.FailedOrEnded;
          this.stopWait();
        }
      }
    }

    protected touchesEnded(touches: TKTouch[]) {
      //  fire the complete event if we had previously recognized a long press
      if (
        this.state === TKGestureRecognizerState.RecognizedAndStillRecognizing
      ) {
        this.onLongPressEnd.notify(this);
      }

      this.state = TKGestureRecognizerState.FailedOrEnded;
      this.stopWait();
    }

    private startWait() {
      this._waiting = true;
      this._waitingTime = 0;
      Muse.timer.add(this, this.waitUpdate);
    }

    private waitUpdate(dt: number) {
      this._waitingTime += dt;
      if (this._waitingTime > this.minimumPressDuration) {
        if (this.state === TKGestureRecognizerState.Began) {
          this.state = TKGestureRecognizerState.RecognizedAndStillRecognizing;
          this.stopWait();
        }
      }
    }

    private stopWait() {
      this._waiting = false;
      Muse.timer.clear(this);
    }

    private _waiting: boolean = false;
    private _waitingTime: number;
    private _beginLocation: Vector;
  }
}
