export class SympathySyncClient {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private signalingSocket: WebSocket | null = null;
  private roomCode: string;
  private onDataCallback: (data: any) => void;
  private onStatusChange: (status: string) => void;

  constructor(roomCode: string, onData: (data: any) => void, onStatusChange: (status: string) => void) {
    this.roomCode = roomCode;
    this.onDataCallback = onData;
    this.onStatusChange = onStatusChange;
  }

  public async connect() {
    this.onStatusChange('Connecting to signaling server...');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/signaling`;
    
    this.signalingSocket = new WebSocket(wsUrl);

    this.signalingSocket.onopen = () => {
      this.signalingSocket!.send(JSON.stringify({ type: 'join', room: this.roomCode }));
      this.onStatusChange('Waiting for peer...');
      this.initWebRTC();
    };

    this.signalingSocket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (!this.peerConnection) return;

      if (data.type === 'peer_joined') {
        this.onStatusChange('Peer joined. Negotiating connection...');
        // First peer initiates
        this.createOffer();
      } else if (data.type === 'offer') {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.signalingSocket!.send(JSON.stringify({ type: 'answer', answer }));
      } else if (data.type === 'answer') {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      } else if (data.type === 'candidate') {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      } else if (data.type === 'peer_left') {
        this.onStatusChange('Peer disconnected.');
        this.disconnect();
      } else if (data.type === 'error') {
        this.onStatusChange(data.message);
        this.disconnect();
      }
    };
    
    this.signalingSocket.onerror = () => {
      this.onStatusChange('Signaling server error.');
    };
  }

  private initWebRTC() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ]
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.signalingSocket) {
        this.signalingSocket.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection) {
        const state = this.peerConnection.iceConnectionState;
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          this.onStatusChange('WebRTC Connection Lost');
        } else if (state === 'connected') {
          this.onStatusChange('Co-Regulation Active');
        }
      }
    };

    // Create Data Channel for transmitting breathing state
    this.dataChannel = this.peerConnection.createDataChannel('sympathy_sync');
    this.dataChannel.onopen = () => {
      this.onStatusChange('Connected. Synchronizing breath.');
    };
    
    // Listen for incoming data channels
    this.peerConnection.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      receiveChannel.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'haptic_pulse') {
             if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Silent digital squeeze
          } else {
             this.onDataCallback(payload);
          }
        } catch(err) {}
      };
    };
  }

  private async createOffer() {
    if (!this.peerConnection) return;
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.signalingSocket!.send(JSON.stringify({ type: 'offer', offer }));
  }

  public sendData(payload: any) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(payload));
    }
  }

  public sendHapticPulse() {
    this.sendData({ type: 'haptic_pulse' });
  }

  public disconnect() {
    if (this.dataChannel) this.dataChannel.close();
    if (this.peerConnection) this.peerConnection.close();
    if (this.signalingSocket) this.signalingSocket.close();
    this.dataChannel = null;
    this.peerConnection = null;
    this.signalingSocket = null;
  }
}
