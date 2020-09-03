namespace Muse {
  export class SoundManager {
    public static get vibrateMuted() {
      return this._vibrateMuted;
    }

    public static set vibrateMuted(value: boolean) {
      this._vibrateMuted = value;
    }

    public static get soundMuted() {
      return this._soundMuted;
    }

    public static set soundMuted(value: boolean) {
      this._soundMuted = value;
    }

    public static get musicMuted(): boolean {
      return Laya.SoundManager.musicMuted;
    }

    public static init(baseURL: string) {
      this._baseURL = baseURL;

      wx.getStorage({
        key: 'mute_music',
        success: res => {
          Laya.SoundManager.musicMuted = res.data === 'true';
        },
      });
      wx.getStorage({
        key: 'mute_sound',
        success: res => {
          this._soundMuted = res.data === 'true';
        },
      });
      wx.getStorage({
        key: 'mute_vibrate',
        success: res => {
          this._vibrateMuted = res.data === 'true';
        },
      });
    }

    public static muteMusic(muted: boolean) {
      wx.setStorage({
        key: 'mute_music',
        data: muted ? 'true' : 'false',
      });
      Laya.SoundManager.musicMuted = muted;
    }

    public static muteSound(muted: boolean) {
      wx.setStorage({
        key: 'mute_sound',
        data: muted ? 'true' : 'false',
      });
      this._soundMuted = muted;
    }

    public static muteVibrate(muted: boolean) {
      wx.setStorage({
        key: 'mute_vibrate',
        data: muted ? 'true' : 'false',
      });
      this._vibrateMuted = muted;
    }

    public static vibrateLong() {
      if (this._vibrateMuted) {
        return;
      }

      wx.vibrateLong();
    }

    public static vibrateShort() {
      if (this._vibrateMuted) {
        return;
      }

      wx.vibrateShort();
    }

    public static playSound(
      id: string,
      forceToPlay: boolean = false,
      baseURL: string = null
    ): Laya.SoundChannel {
      if (!this._soundMuted || forceToPlay) {
        return Laya.SoundManager.playSound(
          `${baseURL ? baseURL : this._baseURL}/${id}.wav`,
          1
        );
      }
    }

    public static stopSound(id: string, baseURL: string = null) {
      Laya.SoundManager.stopSound(
        `${baseURL ? baseURL : this._baseURL}/${id}.wav`
      );
    }

    public static stopAll() {
      Laya.SoundManager.stopAll();
    }

    public static playLoopSound(
      id: string,
      loops: number,
      baseURL: string = null
    ): Laya.SoundChannel {
      if (!this._soundMuted) {
        return Laya.SoundManager.playSound(
          `${baseURL ? baseURL : this._baseURL}/${id}.wav`,
          loops
        );
      }
    }

    public static playBGM(
      id: string,
      baseURL: string = null
    ): Laya.SoundChannel {
      return Laya.SoundManager.playMusic(
        `${baseURL ? baseURL : this._baseURL}/${id}.mp3`,
        0
      );
    }

    public static stopBGM(id: string, baseURL: string = null) {
      Laya.SoundManager.stopMusic();
      Laya.SoundManager.destroySound(
        `${baseURL ? baseURL : this._baseURL}/${id}.mp3`
      );
    }

    private static _vibrateMuted: boolean;
    private static _soundMuted: boolean;
    private static _baseURL: string;
  }

  export class AudioSource {
    public constructor(root: Laya.Sprite) {
      this._root = root;
      this._channels = {};
    }

    public playClip(id: string) {
      const channel = SoundManager.playSound(id);
      if (channel) {
        this._channels[id] = channel;
        this._channels[id].volume = 0;
      }
    }

    public playLoopClip(id: string, loops: number) {
      const channel = SoundManager.playLoopSound(id, loops);
      if (channel) {
        this._channels[id] = channel;
        this._channels[id].volume = 0;
      }
    }

    public updateVolume(listenerPosX: number) {
      const volume = Math.max(
        0,
        1 - Math.abs(this._root.x - listenerPosX) / Laya.stage.width
      );
      Object.keys(this._channels).forEach(id => {
        this._channels[id].volume = volume;
      });
    }

    public stop() {
      Object.keys(this._channels).forEach(id => {
        this._channels[id].stop();
      });
    }

    private _root: Laya.Sprite;
    private _channels: any;
  }

  export class AudioListener {
    public constructor() {
      this.reset();
    }

    public setRoot(root: Laya.Sprite) {
      this._root = root;
    }

    public reset() {
      this._sources = [];
    }

    public addSource(source: AudioSource) {
      this._sources.push(source);
    }

    public removeSource(source: AudioSource) {
      const index = this._sources.indexOf(source);
      if (index > -1) {
        this._sources.splice(index, 1);
      }
    }

    public update() {
      this._sources.forEach(source => {
        source.updateVolume(this._root.x);
      });
    }

    private _root: Laya.Sprite;
    private _sources: AudioSource[];
  }
}
