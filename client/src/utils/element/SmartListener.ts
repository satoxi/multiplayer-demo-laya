namespace Muse {
  interface ILayaEventListenerPair {
    subject: Laya.EventDispatcher;
    type: string;
    callback: Function;
  }

  export class SmartListener {
    public removeSmartListeners() {
      for (let i = this._subjects.length - 1; i >= 0; i--) {
        this._subjects[i].clearListenerWithCaller(this);
      }
      this._subjects = [];
      for (let i = this._layaSubjects.length - 1; i >= 0; i--) {
        const pair = this._layaSubjects[i];
        pair.subject.off(pair.type, this, pair.callback);
      }
      this._layaSubjects = [];
      for (let i = this._wxTouchCallbacks.length - 1; i >= 0; i--) {
        const callback = this._wxTouchCallbacks[i];
        wx.offTouchEnd(callback);
      }
      this._wxTouchCallbacks = [];
    }

    protected smartListen(subject: IObservable, callback: Function) {
      subject.addListener(this, callback);
      this._subjects.push(subject);
    }

    protected smartOnClick(subject: Laya.EventDispatcher, callback: Function) {
      this.smartOnLayaEvent(subject, Laya.Event.CLICK, callback);
    }

    protected smartOnMouseDown(
      subject: Laya.EventDispatcher,
      callback: Function
    ) {
      this.smartOnLayaEvent(subject, Laya.Event.MOUSE_DOWN, callback);
    }

    protected smartOnMouseMove(
      subject: Laya.EventDispatcher,
      callback: Function
    ) {
      this.smartOnLayaEvent(subject, Laya.Event.MOUSE_MOVE, callback);
    }

    protected smartOnMouseUp(
      subject: Laya.EventDispatcher,
      callback: Function
    ) {
      this.smartOnLayaEvent(subject, Laya.Event.MOUSE_UP, callback);
    }

    protected smartOnMouseOut(
      subject: Laya.EventDispatcher,
      callback: Function
    ) {
      this.smartOnLayaEvent(subject, Laya.Event.MOUSE_OUT, callback);
    }

    protected smartOnKeyPress(
      subject: Laya.EventDispatcher,
      callback: Function
    ) {
      this.smartOnLayaEvent(subject, Laya.Event.KEY_PRESS, callback);
    }

    protected smartOnLayaEvent(
      subject: Laya.EventDispatcher,
      type: string,
      callback: Function
    ) {
      subject.on(type, this, callback);
      this._layaSubjects.push({ subject, type, callback });
    }

    protected smartOnTouchEnd(callback: Function) {
      this._wxTouchCallbacks.push(callback);
      wx.onTouchEnd(callback);
    }

    protected _layaSubjects: ILayaEventListenerPair[] = [];
    protected _subjects: IObservable[] = [];
    protected _wxTouchCallbacks: Function[] = [];
  }
}
