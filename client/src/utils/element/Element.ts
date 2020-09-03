/// <reference path='./SmartListener.ts' />

namespace Muse {
  export interface IElementComponent {
    context: ElementBase;
    id: number;
    isEnabled(): boolean;
    onInit(): void;
    onStart(): void;
    onDestroy(): void;
  }

  export class ElementComponent<T extends ElementBase>
    extends Muse.SmartListener
    implements IElementComponent {
    public context: T;
    public id: number;
    public isEnabled(): boolean {
      return true;
    }
    public onInit(): void {}
    public onStart(): void {}
    public onDestroy(): void {}
  }

  export abstract class ElementBehaviourBase<
    T extends ElementBase
  > extends ElementComponent<T> {
    public abstract enable(): void;
    public abstract disable(): void;
  }

  export abstract class ElementModel<
    T extends ElementBase
  > extends ElementComponent<T> {
    public abstract reset(): void;
  }

  export abstract class ElementBehaviour<
    T extends ElementBase
  > extends ElementBehaviourBase<T> {
    public get isVisible() {
      return this._isVisible;
    }

    public enable(): void {
      if (!this._isVisible) {
        this.onEnable();
        this._isVisible = true;
      }
    }

    public disable(): void {
      if (this._isVisible) {
        this._isVisible = false;
        this.onDisable();
        this.removeSmartListeners();
      }
    }

    public isEnabled(): boolean {
      return this._isVisible;
    }

    protected onEnable() {}
    protected onDisable() {}

    protected _isVisible: boolean;
  }

  export class ElementStageView<
    T extends ElementBase
  > extends ElementBehaviourBase<T> {
    public constructor(stage: Laya.Sprite) {
      super();
      this._root = new Laya.Sprite();
      this._stage = stage;
    }

    public get root() {
      return this._root;
    }

    public get stage() {
      return this._stage;
    }

    public onInit(): void {}
    public onDestroy(): void {}

    public isEnabled(): boolean {
      return this._root && this._root.displayedInStage;
    }

    public enable(): void {
      if (!this._root || !this._root.displayedInStage) {
        this.onEnable();
        if (this._root) {
          this._stage.addChild(this._root);
        }
      }
    }

    public disable(): void {
      if (this._root && this._root.displayedInStage) {
        this.onDisable();
        this.removeSmartListeners();
        this._root.removeSelf();
      }
    }

    protected onEnable() {}
    protected onDisable() {}

    protected _stage: Laya.Sprite;
    protected _root: Laya.Sprite;
  }

  export class ElementComponents<T extends ElementBase> {
    public constructor(context: T) {
      this._components = new Map();
      this._context = context;
    }

    public get components() {
      return this._components;
    }

    public add(component: IElementComponent, id: number) {
      component.id = id;
      component.context = this._context;
      this._components[component.id] = component;
    }

    public remove(id: number) {
      if (this._components[id]) {
        delete this._components[id];
      }
    }

    public contains(id: number) {
      return !!this._components[id];
    }

    public get(id: number) {
      if (this._components[id]) {
        return this._components[id];
      }
      console.error(
        `failed to find component with id ${id} \n ${new Error().stack}`
      );
    }

    public initAll() {
      Object.keys(this._components).forEach(key => {
        const component = this._components[key];
        if (component && component.onInit) {
          component.onInit();
        }
      });
    }

    public startAll() {
      Object.keys(this._components).forEach(key => {
        const component = this._components[key];
        if (component && component.onStart) {
          component.onStart();
        }
      });
    }

    public destroyAll() {
      Object.keys(this._components).forEach(key => {
        const component = this._components[key];
        if (component && component.onDestroy) {
          component.onDestroy();
        }
      });
      this._components = {};
    }

    private _context: T;
    private _components: Object;
  }

  export abstract class ElementBase {
    public constructor(id?: string, parent?: ElementBase) {
      this._id = id || this.constructor.name;
      if (parent) {
        this._parent = parent;
      }
    }
    public get id() {
      return this._id;
    }
    public get parent(): ElementBase {
      return this._parent;
    }
    public destroy(): void {}
    public abstract getModel(id);
    public abstract getController(id);
    public abstract getView(id);
    public abstract getCurrentStateID(): number;

    protected _id: string;
    protected _parent: ElementBase;
  }

  export abstract class Element<T extends ElementBase> extends ElementBase {
    public get stateMachine(): StateMachine<T> {
      return this._stateMachine;
    }

    public getParent<R extends ElementBase>(): R {
      return this._parent as R;
    }

    public getCurrentStateID(): number {
      return this._stateMachine.currentState
        ? this._stateMachine.currentState.id
        : -1;
    }

    public get isDestroyed(): boolean {
      return this._isDestroyed;
    }

    public get isInited(): boolean {
      return this._isInited;
    }

    public set printStateLog(value: boolean) {
      this._printStateLog = value;
      this._stateMachine.printLogID = value ? this.id : '';
    }

    public constructor(
      stateEnum: IStateEnum,
      id?: string,
      parent?: ElementBase
    ) {
      super(id, parent);
      const me = (this as ElementBase) as T;
      this._stateMachine = new StateMachine<T>(me, stateEnum);
      this._models = new ElementComponents<T>(me);
      this._controllers = new ElementComponents<T>(me);
      this._views = new ElementComponents<T>(me);
    }

    public init(data?: any) {
      this.onInit(data);

      this._models.initAll();
      this._controllers.initAll();
      this._views.initAll();

      this.onAwake();

      this._models.startAll();
      this._controllers.startAll();
      this._views.startAll();

      this.onStart();

      this._isInited = true;
    }

    public destroy() {
      if (this._isDestroyed) {
        return;
      }
      this._isDestroyed = true;
      this._stateMachine.clearState();
      Object.keys(this._views.components).forEach(id => {
        this._views.components[id].disable();
      });
      this._views.destroyAll();
      this._controllers.destroyAll();
      this._models.destroyAll();
      this.onDestroy();
      if (this._printStateLog) {
        console.log(`(${Laya.timer.currFrame})[${this.id}] is destroyed`);
      }
    }

    public resetAllModels() {
      Object.keys(this._models.components).forEach(id => {
        if (this._models[id].reset) {
          this._models[id].reset();
        }
      });
    }

    public registerState(state: State<T>) {
      this._stateMachine.registerState(state);
    }

    public changeState(stateID: number, data?: any) {
      this._stateMachine.changeState(stateID, data);
    }

    public getModel<R extends ElementModel<T>>(id: number): R {
      return this._models.get(id) as R;
    }

    public getController<R extends ElementComponent<T>>(id: number): R {
      return this._controllers.get(id) as R;
    }

    public getView<R extends ElementComponent<T>>(id: number): R {
      return this._views.get(id) as R;
    }

    public showView(id: number) {
      const view = this._views.get(id);
      if (view && view instanceof ElementBehaviourBase) {
        view.enable();
      } else {
        console.error(`showView::failed to find view [${id}]`);
      }
    }

    public hideView(id: number) {
      const view = this._views.get(id);
      if (view && view instanceof ElementBehaviourBase) {
        view.disable();
      } else {
        console.error(`hideView::failed to find view [${id}]`);
      }
    }

    public enableController(id: number) {
      const controller = this._controllers.get(id);
      if (controller && controller instanceof ElementBehaviourBase) {
        controller.enable();
      } else {
        console.error(`enableController::failed to find controller [${id}]`);
      }
    }

    public disableController(id: number) {
      const controller = this._controllers.get(id);
      if (controller && controller instanceof ElementBehaviourBase) {
        controller.disable();
      } else {
        console.error(`disableController::failed to find controller [${id}]`);
      }
    }

    public debugPrint() {
      let msg = '';
      const sm = this.stateMachine;
      msg +=
        'previous state: ' +
        (sm.previousState ? sm.getStateName(sm.previousState.id) : 'none');
      msg += '\n';
      msg +=
        'current state: ' +
        (sm.currentState ? sm.getStateName(sm.currentState.id) : 'none');
      msg += '\n';
      msg += 'number of views: ' + Object.keys(this._views.components).length;
      msg += '\n';
      Object.keys(this._views.components).forEach(id => {
        const c = this._views.components[id];
        msg +=
          '\t' +
          c.constructor.name +
          ': ' +
          (c._root ? c._root.displayedInStage : c._isVisible);
        msg += '\n';
      });
      console.log(msg);
    }

    protected abstract onInit(data: any);
    protected onAwake() {}
    protected onStart() {}
    protected onDestroy() {}

    protected _stateMachine: StateMachine<T>;
    protected _models: ElementComponents<T>;
    protected _controllers: ElementComponents<T>;
    protected _views: ElementComponents<T>;
    private _printStateLog: boolean;
    private _isDestroyed: boolean;
    private _isInited: boolean;
  }
}
