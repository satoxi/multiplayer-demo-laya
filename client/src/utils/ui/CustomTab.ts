namespace Muse {
  export class CustomTab extends Laya.Button {
    public setSelect(TweenState: boolean) {
      this.dataSource = {
        normal: { visible: false },
        highlight: { visible: false },
      };
    }
  }
}
