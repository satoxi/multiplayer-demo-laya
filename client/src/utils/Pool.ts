namespace Muse {
  export class Pool<T> {
    public onSpawn: Observable;
    public onDespawn: Observable;

    public get pool() {
      return this._pool;
    }

    public constructor(
      tag: string,
      createFun: () => T,
      instancesToPreallocate: number = 5,
      instancesToAllocateIfEmpty: number = 1
    ) {
      this._tag = tag;
      this._createFun = createFun;
      this._pool = [];
      this._instancesToPreallocate = instancesToPreallocate;
      this._instancesToAllocateIfEmpty = instancesToAllocateIfEmpty;
      this.allocateGameObjects(this._instancesToPreallocate);
    }

    public get spawnedInstanceCount(): number {
      return this._spawnedInstanceCount;
    }

    public spawn(): T {
      const instance = this.pop();
      if (instance) {
        if (this.onSpawn) {
          this.onSpawn.notify(instance);
        }
      }
      return instance;
    }

    public despawn(instance: T): void {
      this._spawnedInstanceCount--;
      this._pool.push(instance);

      if (this.onDespawn) {
        this.onDespawn.notify(instance);
      }
    }

    public clearBin(): void {
      this._pool = [];
    }

    private cullExcessObjects(): void {
      if (
        !this._cullExcessObjects ||
        this._pool.length <= this._instancesToMaintainInPool
      ) {
        return;
      }

      if (Laya.timer.currTimer > this._timeOfLastCull + this._cullInterval) {
        this._timeOfLastCull = Laya.timer.currTimer;
        for (
          let n = this._instancesToMaintainInPool;
          n <= this._pool.length;
          n++
        ) {
          this._pool.pop();
        }
      }
    }

    private pop(): T {
      if (this._pool.length > 0) {
        this._spawnedInstanceCount++;
        const instance = this._pool[this._pool.length - 1];
        this._pool = this._pool.slice(0, this._pool.length - 1);
        return instance;
      }
      console.warn(
        `pool [${this._tag}] is not sufficient, allocate more objects`
      );
      this.allocateGameObjects(this._instancesToAllocateIfEmpty);
      return this.pop();
    }

    private allocateGameObjects(count: number): void {
      for (let n = 0; n < count; n++) {
        this._pool.push(this._createFun());
      }
    }

    private _tag: string;
    private _instancesToPreallocate: number = 5;
    private _instancesToAllocateIfEmpty: number = 1;
    private _pool: T[];
    private _spawnedInstanceCount: number = 0;
    private _createFun: () => T;

    // if true, any excess instances will be culled at regular intervals
    private _cullExcessObjects: boolean = false;
    // how often in seconds should culling occur
    private _cullInterval: number = 10;
    // total instances to keep in the pool. All excess will be culled if cullExcessPrefabs is true
    private _instancesToMaintainInPool: number = 5;
    // last time culling happened
    private _timeOfLastCull: number = -999999;
  }
}
