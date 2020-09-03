namespace Muse {
  export enum TransformComponent {
    position,
    scale,
    rotation,
  }

  export enum SystemEntityComponentType {
    mover = 0,
    rigidbody = 1,
    projectilemover = 2,

    end = 10,
  }

  export class Entity {
    public constructor(name?: string, sprite?: Laya.Sprite) {
      this.name = name;
      this._sprite = sprite || new Laya.Sprite();
      this._components = new ComponentList();
      this._sprite.on(Laya.Event.DISPLAY, this, this.onEnable);
      this._sprite.on(Laya.Event.UNDISPLAY, this, this.onDisable);
    }

    public tag: string;
    public name: string;

    public get enabled(): boolean {
      return this._isEnabled;
    }

    public get displayedInStage(): boolean {
      return this._sprite.displayedInStage;
    }

    public get spriteParent(): Laya.Node {
      return this._sprite.parent;
    }

    public get components(): Map<number, EntityComponent> {
      return this._components.components;
    }

    public get alpha(): number {
      return this._sprite.alpha;
    }

    public set alpha(value: number) {
      this._sprite.alpha = value;
    }

    public get x(): number {
      return this._sprite.x;
    }
    public set x(value: number) {
      if (value !== this._sprite.x) {
        this._sprite.x = value;
        this.onTransformChanged(TransformComponent.position);
      }
    }

    public get y(): number {
      return this._sprite.y;
    }
    public set y(value: number) {
      if (value !== this._sprite.y) {
        this._sprite.y = value;
        this.onTransformChanged(TransformComponent.position);
      }
    }

    public pos(x: number, y: number) {
      if (x !== this._sprite.x || y !== this._sprite.y) {
        this._sprite.pos(x, y);
        this.onTransformChanged(TransformComponent.position);
      }
    }

    public scale(x: number, y: number) {
      if (x !== this._sprite.scaleX || y !== this._sprite.scaleY) {
        this._sprite.scale(x, y);
        this.onTransformChanged(TransformComponent.position);
      }
    }

    public get pivotX(): number {
      return this._sprite.pivotX;
    }
    public set pivotX(value: number) {
      this._sprite.pivotX = value;
    }

    public get pivotY(): number {
      return this._sprite.pivotY;
    }
    public set pivotY(value: number) {
      this._sprite.pivotY = value;
    }

    public get scaleX(): number {
      return this._sprite.scaleX;
    }
    public set scaleX(value: number) {
      this._sprite.scaleX = value;
      this.onTransformChanged(TransformComponent.scale);
    }

    public get scaleY(): number {
      return this._sprite.scaleY;
    }
    public set scaleY(value: number) {
      this._sprite.scaleY = value;
      this.onTransformChanged(TransformComponent.scale);
    }

    public get rotation(): number {
      return this._sprite.rotation;
    }
    public set rotation(value: number) {
      this._sprite.rotation = value;
      this.onTransformChanged(TransformComponent.rotation);
    }

    public get zOrder(): number {
      return this._sprite.zOrder;
    }
    public set zOrder(value: number) {
      this._sprite.zOrder = value;
    }

    public get spriteBounds(): Laya.Rectangle {
      return this._sprite.getBounds();
    }

    public get spriteVisible(): boolean {
      return this._sprite.visible;
    }
    public set spriteVisible(value: boolean) {
      this._sprite.visible = value;
    }

    public get spriteWidth(): number {
      return this._sprite.width;
    }
    public set spriteWidth(value: number) {
      this._sprite.width = value;
    }

    public get spriteHeight(): number {
      return this._sprite.height;
    }
    public set spriteHeight(value: number) {
      this._sprite.height = value;
    }

    public set spriteFilter(filters: Laya.Filter[]) {
      this._sprite.filters = filters;
    }

    public get collider(): Collider {
      return this._collider;
    }

    public set collider(value: Collider) {
      if (!this._collider) {
        this._collider = value;
        this._collider.entity = this;
        this._collider.onAddedToEntity();
        if (this.enabled) {
          this._collider.onEnabledChanged();
        }
      } else {
        throw new Error('collider is already set');
      }
    }

    public get triggerListeners(): ITriggerListener[] {
      return this._triggerListeners;
    }

    public toParentPoint(p: Laya.Point): Laya.Point {
      return this._sprite.toParentPoint(p);
    }

    public fromParentPoint(p: Laya.Point): Laya.Point {
      return this._sprite.fromParentPoint(p);
    }

    public localToGlobal(p: Laya.Point, createNew?: boolean): Laya.Point {
      return this._sprite.localToGlobal(p, createNew);
    }

    public globalToLocal(p: Laya.Point, createNew?: boolean): Laya.Point {
      return this._sprite.globalToLocal(p, createNew);
    }

    public onTransformChanged(transformComponent: TransformComponent) {
      if (this._collider) {
        this._collider.onEntityTransformChanged(transformComponent);
      }
      this._components.components.forEach((component: EntityComponent) => {
        component.onEntityTransformChanged(transformComponent);
      });
    }

    public show(parent: Laya.Sprite) {
      parent.addChild(this._sprite);
    }

    public hide() {
      this._sprite.removeSelf();
    }

    public addChild(sprite: Laya.Sprite) {
      this._sprite.addChild(sprite);
    }

    public removeChild(sprite: Laya.Sprite) {
      this._sprite.removeChild(sprite);
    }

    public destroy() {
      if (!this._sprite.destroyed) {
        this.hide();
        this._sprite.destroy();
      }
    }

    public hitTestPoint(x: number, y: number): boolean {
      return this._sprite.hitTestPoint(x, y);
    }

    public addTriggerListener(listener: ITriggerListener) {
      const index = this._triggerListeners.indexOf(listener);
      if (index === -1) {
        this._triggerListeners.push(listener);
      }
    }

    public removeTriggerListener(listener: ITriggerListener) {
      const index = this._triggerListeners.indexOf(listener);
      if (index > -1) {
        this._triggerListeners.splice(index, 1);
      }
    }

    public getComponent<T extends EntityComponent>(id: number): T {
      return this._components.get(id) as T;
    }

    public addComponent<T extends EntityComponent>(component: T) {
      component.entity = this;
      this._components.add(component);
      component.onInit();
      component.onAddedToEntity();
    }

    public removeComponent(id: number): boolean {
      return this._components.remove(id);
    }

    public update(dt: number) {
      if (this.displayedInStage) {
        const components = this._components.components.values();
        for (const component of components) {
          if (component.enabled) {
            component.update(dt);
          }
        }
      }
    }

    public enable() {
      this._sprite.visible = true;
      this.onEnable();
    }

    public disable() {
      this._sprite.visible = false;
      this.onDisable();
    }

    private onEnable() {
      if (this._isEnabled) {
        return;
      }
      this._isEnabled = true;

      if (this._collider) {
        this._collider.onEnabledChanged();
      }
      this._components.components.forEach((component: EntityComponent) => {
        component.onEnable();
      });
    }

    private onDisable() {
      if (!this._isEnabled) {
        return;
      }
      this._isEnabled = false;

      if (this._collider) {
        this._collider.onEnabledChanged();
      }
      this._components.components.forEach((component: EntityComponent) => {
        component.onDisable();
      });
    }

    private _sprite: Laya.Sprite;
    private _collider: Collider;
    private _triggerListeners: ITriggerListener[] = [];
    private _components: ComponentList;
    private _isEnabled: boolean;
  }
}
