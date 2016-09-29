import {Socket} from "phoenix"

export class FaceSocket {
  constructor(userId) {
    this.userId = userId;

    // Bind functions, so we have access to the data.
    this.start = this.start.bind(this);
    this.close = this.close.bind(this);
  }

  start(callbacks) {
    // Report that we are in the process of connecting
    callbacks.connecting();

    this.socket = new Socket("/socket", {params: {user_id: this.userId}})
    this.socket.connect();

    // Now that we have a connction
    let channel = this.socket.channel(`faces`, {})
    channel.join()
      .receive("ok", resp => {
        callbacks.joined();
      })
      .receive("error", resp => {
        console.log(`Failed at joining: ${resp}. Will re-attempt`);
        callbacks.failed();
        this.socket.disconnect();
        this.scheduleReconnet();
      })
    channel.on("update", payload => { callbacks.update(payload) });
    channel.on("dnd", payload => { callbacks.dnd(payload) });
    channel.on("pause", payload => { callbacks.pause(payload) });
    channel.on("user_left", payload => { callbacks.left(payload) });

    channel.onError((e) => {
      callbacks.failed();
      this.socket.disconnect();
    });

    channel.onClose((e) => {
      console.log("Channel closed", e);
      callbacks.failed();
      this.socket.disconnect();
    });

    this.channel = channel;
  }

  update(face) {
    this.channel.push("update", {face: face});
  }

  setDnd(state) {
    this.channel.push("state:dnd", {state: state});
  }

  setPause(state) {
    this.channel.push("state:pause", {state: state});
  }

  close() {
    this.socket.disconnect();
  }
}
