import React from "react"

export class OverlayScreen extends React.Component {
  message() {
    if (!this.props.camera) {
      return "This application needs access to your camera to function";
    }
    if (this.props.online == "connecting") {
      return "Trying to connect to the server";
    }
    if (this.props.online == "offline") {
      return "Darn! You seem to be offline. Will atempt to reconnect";
    }
  }
  header() {
    if (!this.props.camera) {
      return "Oh oh!";
    }
    if (this.props.online == "connecting") {
      return "Connecting...";
    }
    if (this.props.online == "offline") {
      return "Problems abound!";
    }
  }
  isOnline() {
    return this.props.online == "online";
  }
  render() {
    if (this.isOnline() && this.props.camera) {
      return null;
    }
    return (
      <div id="error-screen">
        <div id="error-text">
          <h1>{this.header()}</h1>
          <p>{this.message()}</p>
        </div>
      </div>
    );
  }
}
