/// <reference path='./SmartListener.ts' />

namespace Muse {
  export interface IStateChangeEvent<T> {
    from: State<T>;
    to: State<T>;
    data?: any;
  }

  export class State<T> extends Muse.SmartListener {
    public constructor(id: number) {
      super();
      this._id = id;
    }

    public get id(): number {
      return this._id;
    }

    public get context() {
      return this._context;
    }

    public init(context: T) {
      this._context = context;
      this.onInit();
    }

    public onEnter(e: IStateChangeEvent<T>) {}
    public onExit(e: IStateChangeEvent<T>) {}
    public onUpdate(deltaTime: number) {}
    protected onInit() {}

    private _id: number;
    protected _context: T;
  }

  export interface IStateEnum {
    [s: number]: string;
  }

  export class StateMachine<T> {
    public printLogID: string;

    public constructor(context: T, stateEnum: IStateEnum) {
      this._registeredStates = {};
      this._stateEnum = stateEnum;
      this._context = context;
      this._onStateChanged = new Observable();
    }

    public get currentState(): State<T> {
      return this._currentState;
    }

    public get previousState(): State<T> {
      return this._previousState;
    }

    public get onStateChanged(): Observable {
      return this._onStateChanged;
    }

    public isPreviousState(stateID: number): boolean {
      return this._previousState && this._previousState.id === stateID;
    }

    public isInState(stateID: number): boolean {
      return this._currentState && this._currentState.id === stateID;
    }

    public registerState(state: State<T>): void {
      state.init(this._context);
      this._registeredStates[state.id] = state;
    }

    public getStateName(id: number) {
      return this._stateEnum[id];
    }

    public getState<R extends State<T>>(id: number): R {
      return this._registeredStates[id] as R;
    }

    public clearState(): void {
      if (this._currentState) {
        this._currentState.removeSmartListeners();
        const e: IStateChangeEvent<T> = {
          from: this._currentState,
          to: null,
        };
        this._currentState.onExit(e);
        this._previousState = null;
        if (this.printLogID) {
          console.log(
            `(${Laya.timer.currFrame})[${this.printLogID}] clear state ` +
              `from ${
                this._currentState
                  ? this.getStateName(this._currentState.id)
                  : 'none'
              } to none`
          );
        }
        this._currentState = null;
      }

      this._isChangingState = false;
      this._toChangeStates = [];
    }

    public changeState(id: number, data?: any): boolean {
      if (this._isChangingState) {
        this._toChangeStates.push({
          id,
          data,
        });
        return;
      }

      if (this._currentState && this._currentState.id === id) {
        return false;
      }

      this._isChangingState = true;
      const nextState = this._registeredStates[id];
      const e: IStateChangeEvent<T> = {
        from: this._currentState,
        to: nextState,
        data,
      };
      if (this._currentState) {
        this._currentState.removeSmartListeners();
        this._currentState.onExit(e);
      }

      if (!this._registeredStates[id]) {
        throw new Error(
          'ElementStateMachine::ChangeState failed - ' +
            `cannot find state [${id}] from state machine`
        );
      }

      this._previousState = this._currentState;
      this._currentState = nextState;
      this._currentState.onEnter(e);

      if (!this._currentState) {
        return;
      }
      this._onStateChanged.notify(this._currentState, this._previousState);
      this._isChangingState = false;

      if (this.printLogID) {
        console.log(
          `(${Laya.timer.currFrame})[${this.printLogID}] changes ` +
            `from ${
              this._previousState
                ? this.getStateName(this._previousState.id)
                : 'none'
            } to ${
              this._currentState
                ? this.getStateName(this._currentState.id)
                : 'none'
            }`
        );
      }

      if (this._toChangeStates.length > 0) {
        const stateInfo = this._toChangeStates[0];
        this._toChangeStates.splice(0, 1);
        this.changeState(stateInfo.id, stateInfo.data);
      }
      return true;
    }

    private _isChangingState: boolean = false;
    private _registeredStates: Object;
    private _context: T;
    private _onStateChanged: Observable;
    private _previousState: State<T>;
    private _currentState: State<T>;
    private _stateEnum: any;
    private _toChangeStates: any[] = [];
  }
}
