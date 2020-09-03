namespace Muse {
  export class EntityComponent {
    public id: number;
    ///  <summary>
    ///  the Entity this Component is attached to
    ///  </summary>
    public entity: Entity;

    ///  <summary>
    ///  true if the Component is enabled and the Entity is enabled.
    ///  When enabled this Components lifecycle methods will be called.
    ///  Changes in state result in onEnabled/onDisable being called.
    ///  </summary>
    ///  <value><c>true</c> if enabled; otherwise, <c>false</c>.</value>
    public get enabled(): boolean {
      return this.entity ? this.entity.enabled && this._enabled : this._enabled;
    }
    public set enabled(value: boolean) {
      this.setEnabled(value);
    }

    public onInit() {}

    ///  <summary>
    ///  Called when this component is added to a scene
    ///  after all pending component changes are committed.
    ///  At this point, the entity field
    ///  is set and the entity.scene is also set.
    ///  </summary>
    public onAddedToEntity() {}

    ///  <summary>
    ///  Called when this component is removed from its entity. Do all cleanup here.
    ///  </summary>
    public onRemovedFromEntity() {}

    ///  <summary>
    ///  called when the entity's position changes.
    ///  This allows components to be aware that
    ///  they have moved due to the parent
    ///  entity moving.
    ///  </summary>
    public onEntityTransformChanged(transformComponent: TransformComponent) {}

    ///  <summary>
    ///  called when the parent Entity or this Component is enabled
    ///  </summary>
    public onEnable() {}

    ///  <summary>
    ///  called when the parent Entity or this Component is disabled
    ///  </summary>
    public onDisable() {}

    public update(dt: number) {}

    public setEnabled(isEnabled: boolean): EntityComponent {
      if (this._enabled !== isEnabled) {
        this._enabled = isEnabled;
        if (this._enabled) {
          this.onEnable();
        } else {
          this.onDisable();
        }
      }

      return this;
    }

    private _enabled: boolean = true;
  }

  export class ComponentList {
    public constructor() {
      this._components = new Map();
    }

    public get components(): Map<number, EntityComponent> {
      return this._components;
    }

    public add(component: EntityComponent) {
      if (this._components.has(component.id)) {
        console.warn(
          'trying to add a component',
          component.id,
          'that is already added',
          new Error().stack
        );
      } else {
        this._components.set(component.id, component);
      }
    }

    public remove(id: number): boolean {
      if (this._components.has(id)) {
        this._components.delete(id);
        return true;
      } else {
        console.warn(
          'trying to remove a component',
          id,
          'that is already removed'
        );
        return false;
      }
    }

    public contains(id: number): boolean {
      return !!this._components.has(id);
    }

    public get(id: number): EntityComponent {
      if (this._components.has(id)) {
        return this._components.get(id);
      }
      return null;
    }

    public markEntityListUnsorted() {}

    private _components: Map<number, EntityComponent>;
  }
}
