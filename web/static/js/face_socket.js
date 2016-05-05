import {Socket} from "phoenix"

export class FaceSocket {
  constructor(userId) {
    this.socket = new Socket("/socket", {params: {user_id: userId}})
    this.socket.connect();

    this.start = this.start.bind(this);
  }
  start(callbacks) {
    let channel = this.socket.channel(`faces`, {})
    channel.join()
      .receive("ok", resp => { callbacks.joined(resp) })
      .receive("error", resp => { callbacks.failed_join(resp) })
    channel.on("update", payload => { callbacks.update(payload) });
    channel.on("user_left", payload => { callbacks.left(payload) });

    this.channel = channel;
  }
  update(image) {
    this.channel.push("update", {image: image});
  }
}
