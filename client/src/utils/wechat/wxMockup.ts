// tslint:disable-next-line:class-name
class wx {
  public static readonly env = {
    USER_DATA_PATH: 'userdata',
  };
  public static get chromemockup() {
    return this._chromemockup;
  }
  private static _chromemockup: boolean = true;
  public static get hago() {
    return this._hago;
  }
  private static _hago: boolean = false;
  public static get standalone() {
    return this._standalone;
  }
  private static _standalone: boolean = false;
  public static forceStandalone() {
    this._standalone = true;
  }

  public static login(object: any) {
    object.success({ code: '0710D3lO0nTYHa2GJ7kO0ioflO00D3lO' });
  }
  public static appleLogin(object: any) {}
  public static authorize(object: any) {}

  public static checkSession(object: any) {
    object.success();
  }

  public static getOpenDataContext(): any {
    console.log('get open context');
    return new opencontext();
  }

  public static getUserInfo(object: any) {}
  public static getSetting(object: any) {
    if (object && object.success) {
      const authSetting = new AuthSetting();
      object.success({ authSetting });
    }
  }
  public static openSetting(object: any) {}

  public static shareAppMessage(obj: object) {}

  public static getStorage({ key, success }) {
    const res: any = {};
    try {
      res.data = Laya.LocalStorage.getJSON(key);
      if (success) {
        success(res);
      }
    } catch (error) {}
  }

  public static setStorage(object: any) {
    try {
      Laya.LocalStorage.setJSON(object.key, object.data);
      if (object.success) {
        object.success();
      }
    } catch (e) {
      if (object.fail) {
        object.fail();
      }
    }
  }
  public static removeStorage(object: any) {
    try {
      Laya.LocalStorage.removeItem(object.key);
      if (object.success) {
        object.success();
      }
    } catch (e) {
      if (object.fail) {
        object.fail();
      }
    }
  }
  public static getStorageSync(key: string): any | string {
    try {
      const result = Laya.LocalStorage.getJSON(key);
      return result;
    } catch (error) {
      return null;
    }
  }
  public static setStorageSync(key: string, data: any | string) {
    Laya.LocalStorage.setJSON(key, data);
  }
  public static removeStorageSync(key: string) {
    Laya.LocalStorage.removeItem(key);
  }
  public static clearStorageSync() {
    Laya.LocalStorage.clear();
  }

  public static loadFont(path: string) {
    return 'customfont';
  }

  public static onShow(fun: Function) {}
  public static offShow(fun: Function) {}
  public static onHide(fun: Function) {}
  public static offHide(fun: Function) {}
  public static showToast(object: any) {}
  public static hideToast() {}

  public static createUserInfoButton(object: any): UserInfoButton {
    return new UserInfoButton();
  }

  public static updateShareMenu(object: any) {
    if (object.complete) {
      object.complete();
    }
  }

  public static getShareInfo(object: {
    shareTicket: string;
    timeout?: number;
    success?: Function;
    fail?: Function;
    complete?: Function;
  }) {}
  public static getLaunchOptionsSync(): any {
    return {
      query: {
        userid: '5bc6f9fb2c17437e9868ae90',
      },
    };
  }
  public static getSystemInfo(object: any) {
    object.success({
      SDKVersion: '1.9.0',
      platform: 'debug',
      version: '7.0.7',
    });
  }
  public static triggerGC() {}

  public static vibrateShort(object: any = {}) {}
  public static vibrateLong(object: any = {}) {}

  public static getQueryString(name): string {
    const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`);
    if (window.location) {
      const r = window.location.search.substr(1).match(reg);
      if (r) {
        return r[2];
      }
    }
    return null;
  }

  public static getUpdateManager(): UpdateManager {
    return new UpdateManager();
  }

  public static showModal(object: any) {
    if (object.success) {
      object.success({ confirm: true });
    }
  }

  public static createGameClubButton(object: any) {
    return new GameClubButton();
  }

  public static openCustomerServiceConversation(object: any) {}

  public static onTouchStart(callback: Function) {}
  public static onTouchMove(callback: Function) {}
  public static onTouchEnd(callback: Function) {}
  public static onTouchCancel(callback: Function) {}
  public static offTouchStart(callback: Function) {}
  public static offTouchMove(callback: Function) {}
  public static offTouchEnd(callback: Function) {}
  public static offTouchCancel(callback: Function) {}

  public static request(args: any) {
    const rq = new Laya.HttpRequest();
    const headers = [];
    if (args.header) {
      Object.keys(args.header).forEach(key => {
        headers.push(key, args.header[key]);
      });
    }
    rq.on(Laya.Event.COMPLETE, null, args.success);
    rq.on(Laya.Event.ERROR, null, () => {
      const response = {
        statusCode: rq.http.status,
      };
      args.fail(response);
    });

    let params: string = '';
    if (typeof args.data === 'string') {
      params = args.data;
    } else {
      params = Object.keys(args.data)
        .map(k => {
          return encodeURIComponent(k) + '=' + encodeURIComponent(args.data[k]);
        })
        .join('&');
    }
    if (args.method === 'GET') {
      const url = args.data ? `${args.url}?${params}` : args.url;
      rq.send(url, null, args.method, 'json', headers);
    } else {
      rq.send(
        args.url,
        args.header &&
          args.header['Content-Type'] &&
          args.header['Content-Type'] !== 'application/json'
          ? params
          : JSON.stringify(args.data || {}),
        args.method,
        'json',
        headers
      );
    }
  }

  public static getAvailableAudioSources(object: Object) {}

  public static createRewardedVideoAd(object: any) {
    return new RewardedVideoAd();
  }
  public static createBannerAd(object: any): BannerAd {
    return new BannerAd();
  }
  public static createInterstitialAd(object: any) {
    return new InterstitialAd();
  }

  public static requestMidasPayment(object: any) {
    if (object.success) {
      setTimeout(object.success, 3000);
    }
  }

  public static showLoading(object: any) {
    if (object) {
      console.log(object.title);
    }
  }

  public static hideLoading(object: any) {}
  public static showShareMenu(object: any) {}
  public static onShareAppMessage(callback: Function) {}

  public static previewImage(object: any) {}
  public static saveImageToPhotosAlbum(object: any) {}
  public static setClipboardData(object: any) {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(object.data).then(() => {
        if (object.success) {
          object.success();
        }
      });
    } else {
      if (object.success) {
        object.success();
      }
    }
  }
  public static getClipboardData(object: any) {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.readText().then(clipText => {
        if (object.complete) {
          object.complete(clipText);
        }
      });
    } else {
      if (object.complete) {
        object.complete();
      }
    }
  }

  public static navigateToMiniProgram(object: any) {
    console.log('跳转至小程序', object.appId);
  }

  public static exitMiniProgram(object: any) {
    console.log('退出微信');
  }

  public static showActionSheet(object: any) {}
  public static setInnerAudioOption(object: any) {}
  public static onAudioInterruptionBegin(callback) {}
  public static offAudioInterruptionBegin(callback) {}
  public static onAudioInterruptionEnd(callback) {}
  public static offAudioInterruptionEnd(callback) {}
  public static onMemoryWarning(callback) {}

  public static getFileSystemManager(): FileSystemManager {
    return new FileSystemManager();
  }
  public static downloadFile(object: any) {
    if (object.success) {
      object.success({
        statusCode: 200,
      });
    }
  }
  public static readImageFile(
    filePath: string,
    encoding: string,
    complete: Function
  ) {
    complete();
  }
  public static tempSaveImage(
    imageString: string,
    destWidth: number,
    destHeight: number,
    complete: Function
  ) {
    complete('');
  }
  public static openURL(url: string) {}
  public static requestReview() {
    console.warn('request review');
  }

  public static connectSocket(obj) {
    return new SocketTask();
  }

  // Wechat recorder APIs
  public static getGameRecorder(): GameRecorder {
    return new GameRecorder();
  }
  public static createGameRecorderShareButton(
    style: any
  ): GameRecorderShareButton {
    return new GameRecorderShareButton();
  }

  // Toutiao APIs
  public static getGameRecorderManager(): GameRecorderManager {
    return new GameRecorderManager();
  }
  public static shareVideo(object: any) {}
  public static openSchema(object: any) {}
  public static openAwemeUserProfile(object: any) {
    if (object.success) {
      object.success({
        hasFollowed: true,
      });
    }
  }
  public static checkFollowAwemeState(object: any) {
    if (object.success) {
      object.success({
        hasFollowed: true,
      });
    }
  }
  public static createContactButton(object: any): ContactButton {
    return new ContactButton();
  }

  // Bilibili APIs
  public static getGameFollowingStatus(object: any) {
    if (object.success) {
      object.success({
        follow: 0,
      });
    }
  }
  public static onGameFollowedFromMenu(callback) {}
  public static followGameUpper(object: any) {}
  public static getGameUpperFollowingStatus(object: any) {}

  // Hago APIs
  public static requestPayment(object: Object) {}
  public static gameLoadResult(object: Object) {}

  public static reportAnalytics(key: string, value: any) {}

  public static callHostMethod(object: Object) {
    console.log('show Video');
  }
}

// Wechat
class GameRecorder {
  public isFrameSupported(): boolean {
    return false;
  }
  public start(object: any): Promise<any> {
    return new Promise((resolve, reject) => {});
  }
  public stop(): Promise<any> {
    return new Promise((resolve, reject) => {});
  }
  public pause(): Promise<any> {
    return new Promise((resolve, reject) => {});
  }
  public resume(): Promise<any> {
    return new Promise((resolve, reject) => {});
  }
  public abort() {}
  public on(eventName: string, callback: Function) {}
  public off(eventName: string, callback: Function) {}
}
class GameRecorderShareButton {
  public share: any;
  public style: any;
  public text: string;
  public image: string;
  public type: string;
  public show() {}
  public hide() {}
  public onTap(callback: Function) {}
}

// Toutiao
class GameRecorderManager {
  public start(object: any) {
    console.log('start record video', object);
  }
  public pause() {}
  public recordClip(object: any) {}
  public clipVideo(object: any) {}
  public resume() {}
  public stop() {}
  public onStart(callback: Function) {}
  public onResume(callback: Function) {}
  public onPause(callback: Function) {}
  public onStop(callback: Function) {}
  public onError(callback: Function) {}
  public onInterruptionBegin(callback: Function) {}
  public onInterruptionEnd(callback: Function) {}
}

class ContactButton {
  public show() {}
  public hide() {}
  public onTap(callback: Function) {}
  public offTap(callback: Function) {}
  public destroy() {}
}

// tslint:disable-next-line:class-name
class opencontext {
  public postMessage(message: any) {}
}

class UserInfoButton {
  public style: any;
  public show() {}
  public hide() {}
  public onTap(callback: Function) {}
  public destroy() {}
}

class AuthSetting {
  public readonly scope = {
    userInfo: true,
    userLocation: true,
    address: true,
    invoiceTitle: true,
    werun: true,
    record: true,
    writePhotosAlbum: true,
    camera: true,
  };
}

class UpdateManager {
  public onCheckForUpdate(object: any) {}
  public onUpdateReady(object: any) {}
  public onUpdateFailed(object: any) {}
  public applyUpdate() {}
}

class GameClubButton {
  public show() {}
  public hide() {}
  public destroy() {}
  public style: any;
}

class RewardedVideoAd {
  public load() {
    return new Promise((resolve, reject) => {});
  }

  public show() {
    return new Promise((resolve, reject) => {});
  }

  public destroy() {}
  public onLoad(callback: Function) {}
  public offLoad(callback: Function) {}
  public onError(callback: Function) {}
  public offError(callback: Function) {}
  public onClose(callback: Function) {}
  public offClose(callback: Function) {}
}

class BannerAd {
  public style: any;

  public show() {}
  public hide() {}
  public destroy() {}
  public onLoad(callback: Function) {}
  public offLoad(callback: Function) {}
  public onResize(callback: Function) {}
  public offResize(callback: Function) {}
  public onError(callback: Function) {}
  public offError(callback: Function) {}
}

class InterstitialAd {
  public show() {
    return new Promise((resolve, reject) => {});
  }
  public onLoad(callback: Function) {}
  public offLoad(callback: Function) {}
  public onError(callback: Function) {}
  public offError(callback: Function) {}
}

class FileSystemManager {
  public readFileSync(
    filePath: string,
    encoding: string
  ): string | ArrayBuffer {
    return filePath;
  }
  public readFile(object: any) {
    if (object.success) {
      object.success({ data: '' });
    }
  }
  public writeFile(object: any) {
    if (object.success) {
      object.success();
    }
  }
  public unlink(object: any) {
    if (object.success) {
      object.success();
    }
  }
  public unlinkSync(filePath: string) {}
  public access(object: any) {
    if (object.success) {
      object.success();
    }
  }
  public accessSync(path) {}
  public readdir(object: any) {
    if (object.success) {
      if (object.dirPath.endsWith('subdir/')) {
        object.success({
          files: ['1.file', '2.file'],
        });
      } else {
        object.success({
          files: ['subdir', '3.file'],
        });
      }
    }
  }
  public rmdirSync(dirPath: string, recursive: boolean) {}
  public rmdir(object: any) {
    if (object.success) {
      object.success();
    }
  }
  public unzip(object: any) {
    if (object.success) {
      object.success();
    }
  }
  public mkdir(object: any) {
    if (object.success) {
      object.success();
    }
  }
  public mkdirSync(dirPath: string) {}
  public copyFile(object: any) {
    if (object.success) {
      object.success();
    }
  }
  public copyFileSync(srcPath: string, destPath: string) {}
  public stat(object: any) {
    if (object.success) {
      object.success();
    }
  }
}

class SocketTask {
  public send(data) {}
  public close() {}
  public onOpen(callback) {}
  public onClose(callback) {}
  public onError(callback) {}
  public onMessage(callback) {}
}
