declare module 'simple-peer' {
  import { Options, SignalData } from 'simple-peer';

  class Peer {
    constructor(options?: Options);
    on(event: 'signal', cb: (data: SignalData) => void): void;
    on(event: 'stream', cb: (stream: MediaStream) => void): void;
    on(event: 'track', cb: (track: MediaStreamTrack, stream: MediaStream) => void): void;
    on(event: 'data', cb: (data: unknown) => void): void;
    on(event: 'close', cb: () => void): void;
    on(event: 'error', cb: (err: Error) => void): void;
    signal(data: string | SignalData): void;
    send(data: unknown): void;
    destroy(): void;
  }

  namespace Peer {
    export type Instance = Peer;
    export { Options, SignalData };
  }

  export = Peer;
}
