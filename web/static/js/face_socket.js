import {Socket} from "phoenix"

export class FaceSocket {
  constructor(userId) {
    this.userId = userId;

    // Bind functions, so we have access to the data.
    this.start = this.start.bind(this);
    this.connect = this.connect.bind(this);
  }

  start(callbacks) {
    // Store the callbacks, so we can reset them later.
    this.callbacks = callbacks;
    this.connect();
  }

  connect() {
    // Report that we are in the process of connecting
    this.callbacks.connecting();

    this.socket = new Socket("/socket", {params: {user_id: this.userId}})
    this.socket.connect();

    // Now that we have a connction
    let channel = this.socket.channel(`faces`, {})
    channel.join()
      .receive("ok", resp => {
        this.callbacks.joined();
      })
      .receive("error", resp => {
        console.log(`Failed at joining: ${resp}. Will re-attempt`);
        this.callbacks.failed();
        this.socket.disconnect();
        this.scheduleReconnet();
      })
    channel.on("update", payload => { this.callbacks.update(payload) });
    channel.on("dnd", payload => { this.callbacks.dnd(payload) });
    channel.on("user_left", payload => { this.callbacks.left(payload) });

    channel.onError((e) => {
      this.callbacks.failed();
      this.socket.disconnect();
      this.scheduleReconnet();
    });

    channel.onClose((e) => {
      console.log("Channel closed", e);
      this.callbacks.failed();
      this.socket.disconnect();
      this.scheduleReconnet();
    });

    this.channel = channel;
  }

  scheduleReconnet() {
    // Don't hammer the server. Instead, in case there is an offline spell,
    // try reconnecting after a while.
    setTimeout(this.connect, 10000);
  }

  update(image) {
    this.channel.push("update", {image: image});
  }

  setDnd(state) {
    this.channel.push("state:dnd", {state: state});
  }

  setPause(state) {
    this.channel.push("state:pause", {state: state});
  }
}
