namespace Muse {
  export class TKButtonRecognizer extends TKAbstractGestureRecognizer {
    public onSelectedEvent: ObservableT<TKButtonRecognizer> = new ObservableT();
    public onDeselectedEvent: ObservableT<
      TKButtonRecognizer
    > = new ObservableT();
    public onTouchUpInsideEvent: ObservableT<
      TKButtonRecognizer
    > = new ObservableT();

    public constructor(defaultFrame: TKRect, highlightedFrame: TKRect) {
      super();
      this._defaultFrame = defaultFrame.clone();
      this._highlightedFrame = highlightedFrame.clone();
      this.boundaryFrame = this._defaultFrame;
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
            this.onSelected();
            return true;
          }
        }
      }

      return false;
    }

    public touchesMoved(touches: TKTouch[]) {
      for (let i: number = 0; i < touches.length; i++) {
        if (touches[i].phase === TouchPhase.Stationary) {
          //  check to see if the touch is still in our frame
          const isTouchInFrame = this.isTouchWithinBoundaryFrame(touches[i]);
          //  if we are in the Began phase than we should switch to
          //  RecognizedAndStillRecognizing (highlighted) if the touch is in our frame
          if (this.state === TKGestureRecognizerState.Began && isTouchInFrame) {
            this.state = TKGestureRecognizerState.RecognizedAndStillRecognizing;
            this.onSelected();
          } else if (
            this.state ===
              TKGestureRecognizerState.RecognizedAndStillRecognizing &&
            !isTouchInFrame
          ) {
            this.state = TKGestureRecognizerState.FailedOrEnded;
            this.onDeselected();
          }
        }
      }
    }

    public touchesEnded(touches: TKTouch[]) {
      //  if we were previously highlighted (RecognizedAndStillRecognizing)
      //  we have an official touch
      if (
        this.state === TKGestureRecognizerState.RecognizedAndStillRecognizing
      ) {
        this.onTouchUpInside();
      }

      //  reset the boundary frame
      this.boundaryFrame = this._defaultFrame;
      this.state = TKGestureRecognizerState.FailedOrEnded;
    }

    protected onSelected() {
      //  while selected, we use a highlighted frame to allow the touch
      //  to move a bit and still remain selected
      this.boundaryFrame = this._highlightedFrame;
      this.onSelectedEvent.notify(this);
    }

    ///  <summary>
    ///  called when a touch ends (if the button was already highlighted)
    ///  or if a tracked touch exits the highlighted frame
    ///  </summary>
    protected onDeselected() {
      this.onDeselectedEvent.notify(this);
    }

    ///  <summary>
    ///  called if a tracked touch ends while the button is highlighted
    ///  </summary>
    protected onTouchUpInside() {
      this.onTouchUpInsideEvent.notify(this);
    }

    private _defaultFrame: TKRect;
    private _highlightedFrame: TKRect;
  }
}
