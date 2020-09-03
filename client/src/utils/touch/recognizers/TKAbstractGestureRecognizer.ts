namespace Muse {
  /**
   * Recognizer flow explained; *
   * All recognizers have the initial state of POSSIBLE when a input session starts.
   * The definition of a input session is from the first input until the last input,
   * with all it's movement in it.
   *
   * Example session for mouse-input: mousedown -> mousemove -> mouseup
   *
   * On each recognizing cycle, the .recognize() method is executed
   * which determines with state it should be.
   *
   * If the recognizer has the state FAILED, CANCELLED or RECOGNIZED (equals ENDED),
   * it is reset to POSSIBLE to give it another change on the next cycle.
   *
   *               Possible
   *                  |
   *            +-----+---------------+
   *            |                     |
   *      +-----+-----+               |
   *      |           |               |
   *   Failed       Ended             |
   *                          +-------+------+
   *                          |              |
   *                      Recognized       Began
   *                                         |
   *                           RecognizedAndStillRecognizing
   *                                         |
   *                                  Ended/Recognized
   */
  export enum TKGestureRecognizerState {
    Possible,
    Began,
    FailedOrEnded,
    RecognizedAndStillRecognizing,
    Recognized,
  }

  export abstract class TKAbstractGestureRecognizer {
    public enabled: boolean = true;

    ///  <summary>
    ///  frame that the touch must be within to be recognized.
    ///  null means full screen.
    ///  </summary>
    public boundaryFrame: TKRect = null;

    ///  <summary>
    ///  zIndex of touch input. 0 by default.
    ///  if a zIndex of greater than 0 uses a touch in touchesBegan
    ///  it will not be passed to any other recognizers.
    ///  useful if you have some full screen recognizers and
    ///   you want to overlay a button/control
    ///  </summary>
    public zIndex: number = 0;

    public get state(): TKGestureRecognizerState {
      return this._state;
    }

    public set state(value: TKGestureRecognizerState) {
      // console.log(this.constructor.name, 'to', TKGestureRecognizerState[value]);
      this._state = value;
      if (
        this._state === TKGestureRecognizerState.Recognized ||
        this._state === TKGestureRecognizerState.RecognizedAndStillRecognizing
      ) {
        this.fireRecognizedEvent();
      }

      if (
        this._state === TKGestureRecognizerState.Recognized ||
        this._state === TKGestureRecognizerState.FailedOrEnded
      ) {
        this.reset();
      }
    }

    ///  <summary>
    ///  checks to see if the touch is currently being tracked by the recognizer
    ///  </summary>
    protected isTrackingTouch(t: TKTouch): boolean {
      return this._trackingTouches.indexOf(t) > -1;
    }

    ///  <summary>
    ///  checks to see if any of the touches are currently being tracked
    ///  by the recognizer
    ///  </summary>
    protected isTrackingAnyTouch(touches: TKTouch[]): boolean {
      for (let i: number = 0; i < touches.length; i++) {
        if (this._trackingTouches.indexOf(touches[i]) > -1) {
          return true;
        }
      }

      return false;
    }

    ///  <summary>
    ///  populates the _subsetOfTouchesBeingTrackedApplicableToCurrentRecognizer
    ///  with only the touches currently being tracked by the recognizer.
    ///  returns true if there are any touches being tracked
    ///  </summary>
    private populateSubsetOfTouchesBeingTracked(touches: TKTouch[]): boolean {
      this._subsetOfTouchesBeingTrackedApplicableToCurrentRecognizer = [];
      for (let i = 0; i < touches.length; i++) {
        if (this.alwaysSendTouchesMoved || this.isTrackingTouch(touches[i])) {
          this._subsetOfTouchesBeingTrackedApplicableToCurrentRecognizer.push(
            touches[i]
          );
        }
      }

      return (
        this._subsetOfTouchesBeingTrackedApplicableToCurrentRecognizer.length >
        0
      );
    }

    private get shouldAttemptToRecognize(): boolean {
      return (
        this.enabled &&
        (this.state !== TKGestureRecognizerState.FailedOrEnded &&
          this.state !== TKGestureRecognizerState.Recognized)
      );
    }

    public recognizeTouches(touches: TKTouch[]) {
      if (!this.shouldAttemptToRecognize) {
        return;
      }
      //  reset our state to avoid sending any phase more than once
      this._sentTouchesEnded = false;
      this._sentTouchesMoved = false;
      this._sentTouchesBegan = false;
      //  we loop backwards because the Began phase could end up removing a touch
      for (let i = touches.length - 1; i >= 0; i--) {
        const touch = touches[i];
        switch (touch.phase) {
          case TouchPhase.Began:
            // only send touches began once and ensure that
            // the touch is in the boundaryFrame if applicable
            if (
              !this._sentTouchesBegan &&
              this.isTouchWithinBoundaryFrame(touches[i])
            ) {
              // if touchesBegan returns true and we have a zIndex
              // greater than 0 we remove the touches with a phase of Began
              if (this.touchesBegan(touches) && this.zIndex > 0) {
                // if we remove more than one touch we have to be careful
                // with our loop and make sure to decrement i appropriately
                let removedTouches = 0;
                for (let j = touches.length - 1; j >= 0; j--) {
                  if (touches[j].phase === TouchPhase.Began) {
                    touches.splice(j, 1);
                    removedTouches++;
                  }
                }
                // if we removed more than 1 touch decrement i
                // for each additional touch removed
                if (removedTouches > 0) {
                  i = i - (removedTouches - 1);
                }
              }
              this._sentTouchesBegan = true;
            }
            break;
          case TouchPhase.Moved:
            //  limit touches sent to those that are being tracked
            if (
              !this._sentTouchesMoved &&
              (this.populateSubsetOfTouchesBeingTracked(touches) &&
                this._subsetOfTouchesBeingTrackedApplicableToCurrentRecognizer.indexOf(
                  touch
                ) > -1)
            ) {
              this.touchesMoved(
                this._subsetOfTouchesBeingTrackedApplicableToCurrentRecognizer
              );
              this._sentTouchesMoved = true;
            }
            break;
          case TouchPhase.Ended:
          case TouchPhase.Canceled:
            //  limit touches sent to those that are being tracked
            if (
              !this._sentTouchesEnded &&
              this.populateSubsetOfTouchesBeingTracked(touches) &&
              this._subsetOfTouchesBeingTrackedApplicableToCurrentRecognizer.indexOf(
                touch
              ) > -1
            ) {
              this.touchesEnded(
                this._subsetOfTouchesBeingTrackedApplicableToCurrentRecognizer
              );
              this._sentTouchesEnded = true;
            }
            break;
        }
      }
    }

    public reset() {
      this._state = TKGestureRecognizerState.Possible;
      this._trackingTouches = [];
    }

    protected isTouchWithinBoundaryFrame(touch: TKTouch): boolean {
      return !this.boundaryFrame || this.boundaryFrame.contains(touch.position);
    }

    ///  <summary>
    ///  returns the location of the touches.
    ///  If there are multiple touches this will return the centroid of the location.
    ///  </summary>
    public touchLocation(): Vector {
      let x = 0;
      let y = 0;
      let k = 0;
      for (let i = 0; i < this._trackingTouches.length; i++) {
        x = x + this._trackingTouches[i].position.x;
        y = y + this._trackingTouches[i].position.y;
        k++;
      }

      if (k > 0) {
        return new Vector(x / k, y / k);
      } else {
        return Vector.zero;
      }
    }

    ///  <summary>
    ///  returns the start location of the touches.
    ///  If there are multiple touches this will return the centroid of the location.
    ///  </summary>
    public startTouchLocation(): Vector {
      let x = 0;
      let y = 0;
      let k = 0;
      for (let i = 0; i < this._trackingTouches.length; i++) {
        x = x + this._trackingTouches[i].startPosition.x;
        y = y + this._trackingTouches[i].startPosition.y;
        k++;
      }

      if (k > 0) {
        return new Vector(x / k, y / k);
      } else {
        return Vector.zero;
      }
    }

    ///  <summary>
    ///  return true if a touch was used, false if none were.
    ///  this is used by any recognizers that should swallow touches if on a higher than 0 zIndex
    ///  </summary>
    protected /* virtual */ touchesBegan(touches: TKTouch[]): boolean {
      return false;
    }
    protected /* virtual */ touchesMoved(touches: TKTouch[]) {}
    protected /* virtual */ touchesEnded(touches: TKTouch[]) {}
    protected abstract fireRecognizedEvent();

    public toString(): string {
      return `[${this.constructor.name}] state: ${
        this.state
      }, location: ${this.touchLocation()}, zIndex: ${this.zIndex}`;
    }

    ///  <summary>
    ///  stores all the touches we are currently tracking
    ///  </summary>
    protected _trackingTouches: TKTouch[] = new Array<TKTouch>();

    ///  <summary>
    ///  when true, touchesMoved will be called for ALL touches.
    ///  By default, only the touches
    ///  a recognizer is tracking (from touchesBegan) will be sent.
    ///  </summary>
    protected alwaysSendTouchesMoved: boolean = false;

    ///  <summary>
    ///  The subset of touches being tracked that is applicable to the current recognizer.
    ///  This is kept around to avoid allocations at runtime.
    ///  </summary>
    private _subsetOfTouchesBeingTrackedApplicableToCurrentRecognizer: TKTouch[] = new Array<
      TKTouch
    >();

    private _state: TKGestureRecognizerState =
      TKGestureRecognizerState.Possible;

    ///  <summary>
    ///  stores whether we sent any of the phases to the recognizer.
    ///  This is to avoid sending a phase twice in one frame.
    ///  </summary>
    private _sentTouchesBegan: boolean;
    private _sentTouchesMoved: boolean;
    private _sentTouchesEnded: boolean;
  }
}
