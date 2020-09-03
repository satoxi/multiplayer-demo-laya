namespace Muse {
  export class TKAnyTouchRecognizer extends TKAbstractGestureRecognizer {
    public onEnteredEvent: ObservableT<
      TKAnyTouchRecognizer
    > = new ObservableT();
    public onExitedEvent: ObservableT<TKAnyTouchRecognizer> = new ObservableT();

    public maxNumOfTouch: number = 1;
    ///  <summary>
    ///  the contstructor ensures we have a frame to work with
    ///  </summary>
    public constructor(frame: TKRect) {
      super();
      this.alwaysSendTouchesMoved = true;
      this.boundaryFrame = frame.clone();
    }

    public fireRecognizedEvent() {}

    public touchesBegan(touches: TKTouch[]): boolean {
      //  grab the first touch that begins on us
      if (this.state === TKGestureRecognizerState.Possible) {
        for (let i: number = 0; i < touches.length; i++) {
          //  only add touches in the Began phase
          if (touches[i].phase === TouchPhase.Began) {
            this._trackingTouches.push(touches[i]);
            this.state = TKGestureRecognizerState.RecognizedAndStillRecognizing;
            this.onTouchEntered();
            return true;
          }
        }
      }

      return false;
    }

    public touchesMoved(touches: TKTouch[]) {
      for (let i: number = 0; i < touches.length; i++) {
        //  check to see if the touch is in our frame
        const isTouchInFrame = this.isTouchWithinBoundaryFrame(touches[i]);
        //  are we already tracking this touch?
        const isTrackingTouch = this._trackingTouches.indexOf(touches[i]) > -1;
        //  if we are tracking the touch and it is in frame we do nothing more
        if (isTrackingTouch && isTouchInFrame) {
          continue;
        }

        //  if we are not tracking the touch and it is in our frame start tracking it
        if (
          !isTrackingTouch &&
          isTouchInFrame &&
          this._trackingTouches.length < this.maxNumOfTouch
        ) {
          this._trackingTouches.push(touches[i]);
          this.state = TKGestureRecognizerState.RecognizedAndStillRecognizing;
          this.onTouchEntered();
        }

        //  if we are tracking the touch and it exited the frame fire the onExitedEvent
        if (isTrackingTouch && !isTouchInFrame) {
          const index = this._trackingTouches.indexOf(touches[i]);
          if (index > -1) {
            this._trackingTouches.splice(index, 1);
          }
          this.state = TKGestureRecognizerState.FailedOrEnded;
          this.onTouchExited();
        }
      }
    }

    public touchesEnded(touches: TKTouch[]) {
      for (let i: number = 0; i < touches.length; i++) {
        const index = this._trackingTouches.indexOf(touches[i]);
        if (touches[i].phase === TouchPhase.Ended && index > -1) {
          this._trackingTouches.splice(index, 1);
          this.state = TKGestureRecognizerState.FailedOrEnded;
          this.onTouchExited();
        }
      }
    }

    private onTouchEntered() {
      //  fire the event if this is the first touch we are tracking
      if (this._trackingTouches.length === 1) {
        this.onEnteredEvent.notify(this);
      }
    }

    private onTouchExited() {
      if (this._trackingTouches.length === 0) {
        this.onExitedEvent.notify(this);
      }
    }
  }
}
