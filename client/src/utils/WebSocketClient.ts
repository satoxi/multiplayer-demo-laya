/// <reference path='./element/StateMachine.ts' />

namespace Muse {
  const HeartBeatTime = 10000;
  const TimeoutTime = 30000;

  function defaultRetryStrategy(attempt) {
    return Math.min(1000 * 2 ** attempt, 300000);
  }

  export enum WebSocketEvent {
    open = 'open',
    disconnect = 'disconnect',
    reconnect = 'reconnect',
    retry = 'retry',
    schedule = 'schedule',
    offline = 'offline',
    online = 'online',
    error = 'error',
    message = 'message',
  }

  export enum WebSocketState {
    initialized,
    connected,
    disconnected,
    reconnecting,
    offline,
    closed,
    error,
  }

  let isDebugging: boolean = false;
  export function setDebug(enabled: boolean) {
    isDebugging = enabled;
  }

  const debug = (message, ...args) => {
    if (isDebugging) {
      console.log('[WebSocket]', message, ...args);
    }
  };

  class InitState extends Muse.State<WebSocketClient> {}

  class ConnectedState extends Muse.State<WebSocketClient> {
    public onEnter(e: Muse.IStateChangeEvent<WebSocketClient>) {
      if (e.from) {
        if (e.from.id === WebSocketState.initialized) {
          this.context.event(WebSocketEvent.open);
        } else if (e.from.id === WebSocketState.reconnecting) {
          this.context.event(WebSocketEvent.reconnect);
        }
      }
      this.context.startConnectionKeeper();
    }

    public onExit(e: Muse.IStateChangeEvent<WebSocketClient>) {
      this.context.stopConnectionKeeper();
      this.context.disconnect();
      if (
        e.to &&
        (e.to.id === WebSocketState.offline ||
          e.to.id === WebSocketState.disconnected)
      ) {
        this.context.event(WebSocketEvent.disconnect);
      }
    }
  }

  class DisconnectedState extends Muse.State<WebSocketClient> {
    public onEnter(e: Muse.IStateChangeEvent<WebSocketClient>) {
      this.context.ondisconnected(e.data);
    }
  }

  class ReconnectingState extends Muse.State<WebSocketClient> {
    public onEnter(e: Muse.IStateChangeEvent<WebSocketClient>) {
      this.context.onretry(e.data);
    }
  }

  class OfflineState extends Muse.State<WebSocketClient> {
    public onEnter() {
      this.context.event(WebSocketEvent.offline);
    }
    public onExit() {
      this.context.event(WebSocketEvent.online);
    }
  }

  class ClosedState extends Muse.State<WebSocketClient> {}

  export class WebSocketClient extends Laya.EventDispatcher {
    public constructor(url, autoReconnect = false) {
      super();

      this._sm = new Muse.StateMachine(this, WebSocketState);
      this._sm.registerState(new InitState(WebSocketState.initialized));
      this._sm.registerState(new ConnectedState(WebSocketState.connected));
      this._sm.registerState(
        new DisconnectedState(WebSocketState.disconnected)
      );
      this._sm.registerState(
        new ReconnectingState(WebSocketState.reconnecting)
      );
      this._sm.registerState(new OfflineState(WebSocketState.offline));
      this._sm.registerState(new ClosedState(WebSocketState.closed));

      this._url = url;
      this._autoReconnect = autoReconnect;
    }

    public connect() {
      return this._createWs(this._url)
        .then(() => {
          this._sm.changeState(WebSocketState.connected);
        })
        .catch(e => {
          console.error('error happen when connecting', e, e.stack);
          this.event(WebSocketEvent.error, e);
        });
    }

    public disconnect() {
      return this._destroyWs();
    }

    public send(data) {
      if (this._ws && this._ws.connected) {
        this._ws.send(data);
      }
    }

    public isConnected() {
      return this._sm.isInState(WebSocketState.connected);
    }

    public onretry(attempt = 0) {
      this.event(WebSocketEvent.retry, attempt);
      this._createWs(this._url).then(
        () => {
          if (this._sm.isInState(WebSocketState.reconnecting)) {
            this._sm.changeState(WebSocketState.connected);
          } else {
            this._destroyWs();
          }
        },
        () => {
          if (this._sm.isInState(WebSocketState.reconnecting)) {
            this._sm.changeState(WebSocketState.disconnected, attempt + 1);
          }
        }
      );
    }

    public startConnectionKeeper() {
      // debug('start connection keeper');
      Laya.timer.loop(HeartBeatTime, this, this.ping);
      this.postponeTimeoutTimer();
    }

    public stopConnectionKeeper() {
      // debug('stop connection keeper');
      this.clearTimeoutTimers();
      Laya.timer.clear(this, this.ping);
    }

    private _createWs(url) {
      return new Promise((resolve, reject) => {
        debug(`connect [${url}]`);
        const ws = new Laya.Socket();
        ws.connectByUrl(url);

        const onError = err => {
          if (err instanceof Error) {
            return reject(err);
          }
          // in browser, error event is useless
          return reject(new Error(`Failed to connect [${url}]`));
        };
        ws.on(Laya.Event.CLOSE, this, onError);
        ws.on(Laya.Event.ERROR, this, onError);
        ws.on(Laya.Event.OPEN, null, () => {
          this._ws = ws;
          this._ws.on(Laya.Event.CLOSE, this, this.handleClose);
          this._ws.on(Laya.Event.ERROR, this, this.handleClose);
          this._ws.on(Laya.Event.MESSAGE, this, this.handleMessage);
          resolve(this._ws);
        });
      });
    }

    private _destroyWs() {
      const ws = this._ws;
      if (!ws) {
        return;
      }
      ws.offAll(Laya.Event.OPEN);
      ws.offAll(Laya.Event.ERROR);
      ws.offAll(Laya.Event.MESSAGE);
      this._ws = null;
      ws.close();
    }

    public ondisconnected(attempt = 0) {
      if (this._autoReconnect) {
        const delay = defaultRetryStrategy.call(null, attempt);
        debug(`schedule attempt=${attempt} delay=${delay}`);
        this.event(WebSocketEvent.schedule, [attempt, delay]);
        Laya.timer.clear(this, this.scheduleRetry);
        Laya.timer.once(delay, this, this.scheduleRetry, [attempt]);
      }
    }

    private checkConnectionAvailability(name = 'API') {
      if (!this._sm.isInState(WebSocketState.connected)) {
        const currentState = this._sm.currentState.id;
        console.warn(
          `${name} should not be called when the connection is ${currentState}`
        );
        if (
          this._sm.isInState(WebSocketState.disconnected) ||
          this._sm.isInState(WebSocketState.reconnecting)
        ) {
          console.warn(
            'disconnect and reconnect event should be handled to avoid such calls.'
          );
        }
        throw new Error('Connection unavailable');
      }
    }

    private scheduleRetry(attempt) {
      if (this._sm.isInState(WebSocketState.disconnected)) {
        this._sm.changeState(WebSocketState.reconnecting, attempt);
      }
    }

    private postponeTimeoutTimer() {
      this.clearTimeoutTimers();
      Laya.timer.once(TimeoutTime, this, this.onTimeout);
    }

    private onTimeout() {
      debug('timeout');
      this._sm.changeState(WebSocketState.disconnected);
    }

    private clearTimeoutTimers() {
      Laya.timer.clear(this, this.onTimeout);
    }

    private ping() {
      // debug('ping');
      if (this._ws && this._ws.connected) {
        this.postponeTimeoutTimer();
      }
    }

    private handleClose(event) {
      debug(`ws closed [${event.code}] ${event.reason}`);
      if (this._sm.isInState(WebSocketState.closed)) {
        return;
      }
      this._sm.changeState(WebSocketState.disconnected);
    }

    private handleMessage(message) {
      this.postponeTimeoutTimer();
      this.event(WebSocketEvent.message, message);
      if (this._ws) {
        this._ws.input.clear();
      }
    }

    private _sm: Muse.StateMachine<WebSocketClient>;
    private _url: string;
    private _autoReconnect: boolean;
    private _ws: Laya.Socket;
  }
}
