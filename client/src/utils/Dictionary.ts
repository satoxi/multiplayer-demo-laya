namespace Muse {
  export class Dictionary<T> {
    public get keys(): string[] {
      const keySet: string[] = [];
      for (const prop in this._items) {
        if (this._items.hasOwnProperty(prop)) {
          keySet.push(prop);
        }
      }
      return keySet;
    }

    public get values(): T[] {
      const values: T[] = [];
      for (const prop in this._items) {
        if (this._items.hasOwnProperty(prop)) {
          values.push(this._items[prop]);
        }
      }
      return values;
    }

    public get count(): number {
      return this._count;
    }

    public containsKey(key: string): boolean {
      return this._items.hasOwnProperty(key);
    }

    public add(key: string, value: T) {
      if (!this._items.hasOwnProperty(key)) {
        this._count += 1;
      }

      this._items[key] = value;
    }

    public remove(key: string): T {
      const val = this._items[key];
      delete this._items[key];
      this._count--;
      return val;
    }

    public clear() {
      this._items = {};
      this._count = 0;
    }

    public getItem(key: string): T {
      return this._items[key];
    }

    public setItem(key: string, value: T) {
      if (this.containsKey(key)) {
        this._items[key] = value;
      }
    }

    private _items: { [index: string]: T } = {};
    private _count: number = 0;
  }

  export class SetExt {
    public static isSuperset<T>(set: Set<T>, subset: Set<T>): boolean {
      for (const elem of subset) {
        if (!set.has(elem)) {
          return false;
        }
      }
      return true;
    }

    public static unionTo<T>(setA: Set<T>, setB: Set<T>): Set<T> {
      const _union = new Set<T>(setA);
      for (const elem of setB) {
        _union.add(elem);
      }
      return _union;
    }

    public static union<T>(setA: Set<T>, setB: Set<T>) {
      for (const elem of setB) {
        setA.add(elem);
      }
    }

    public static intersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
      const _intersection = new Set<T>();
      for (const elem of setB) {
        if (setA.has(elem)) {
          _intersection.add(elem);
        }
      }
      return _intersection;
    }

    public static exceptTo<T>(src: Set<T>, dest: Set<T>): Set<T> {
      const _except = new Set(src);
      for (const elem of dest) {
        _except.delete(elem);
      }
      return _except;
    }

    public static except<T>(src: Set<T>, dest: Set<T>) {
      for (const elem of dest) {
        src.delete(elem);
      }
    }
  }
}
