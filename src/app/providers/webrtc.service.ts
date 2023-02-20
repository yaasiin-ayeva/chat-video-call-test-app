import { Injectable } from '@angular/core';
import Peer, { MediaConnection, PeerJSOption } from 'peerjs';

@Injectable({
  providedIn: 'root'
})
export class WebrtcService {
  peer!: Peer;
  mediaStream!: MediaStream;
  userMediaElement!: HTMLMediaElement;
  partnerMediaElement!: HTMLMediaElement;
  connected: boolean = false;

  partnerId!: string;
  hideCall: boolean = false;
  hideCallLogin: boolean = false;

  userId!: string;


  stun = 'stun.l.google.com:19302';
  mediaConnection!: MediaConnection;
  options: PeerJSOption;

  stunServer: RTCIceServer = {
    urls: 'stun:' + this.stun,
  };

  constructor() {
    this.options = {  // not used, by default it'll use peerjs server
      key: 'cd1ft79ro8g833di',
      debug: 3
    };
  }

  async init(userId: string, myEl: HTMLMediaElement, partnerEl: HTMLMediaElement) {
    this.userMediaElement = myEl;
    this.partnerMediaElement = partnerEl;
    await this.getMedia();
    await this.createPeer(userId);
  }

  async getMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      this.handleSuccess(stream);
    } catch (error) {
      this.handleError(error);
    }
  }

  async createPeer(userId: string) {
    this.peer = new Peer(userId);
    this.peer.on('open', () => {
      this.wait();
    });
  }

  call(partnerId: string) {
    this.partnerId = partnerId;
    console.log(this.peer.destroyed);

    if (this.peer.destroyed) {
      this.createPeer(this.userId);
    }

    const call = this.peer.call(partnerId, this.mediaStream);
    this.mediaConnection = call; // Save reference to the `mediaConnection` object
    
    if (call) {
      this.connected = true;
    }

    call.on('stream', (stream) => {
      this.partnerMediaElement.srcObject = stream;
      this.hideCall = true;
      this.connected = false;
      this.hideCallLogin = false;
    });
  }

  wait() {
    this.peer.on('call', (call) => {

      this.mediaConnection = call; // Save reference to the `mediaConnection` object
      var acceptsCall = confirm("Videocall incoming, do you want to accept it ?");
      if (acceptsCall) {
        call.answer(this.mediaStream); // Answer the call with an A/V stream.
        call.on('stream', (stream) => {
          this.partnerMediaElement.srcObject = stream;
          this.connected = true;
          console.log('Connected', this.connected);
        });
      }
    });
  }

  handleSuccess(stream: MediaStream) {
    this.mediaStream = stream;
    this.userMediaElement.srcObject = stream;
  }

  handleError(error: any) {
    if (error.name === 'ConstraintNotSatisfiedError') {
      const msg = 'The resolution px is not supported by your device.';
      this.errorMsg(msg);
    } else if (error.name === 'PermissionDeniedError') {
      const msg = 'Permissions have not been granted to use your camera and microphone, you need to allow the page access to your devices in order for the demo to work.';
      this.errorMsg(msg);
    } else {
      const msg = `getUserMedia error: ${error.name}`;
      this.errorMsg(msg, error);
    }
  }

  errorMsg(msg: string, error?: any) {
    console.error(msg, error);
  }

  hangUp() {
    this.mediaConnection.close();
    this.partnerMediaElement = new HTMLMediaElement();
  }
}
