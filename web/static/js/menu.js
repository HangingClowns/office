import React from "react"

export class Menu extends React.Component {
  render() {
    return (
      <div id="top-menu">
        <div id="logo">
          Welcome to Aircloak
        </div>
        <div id="live-face-image"></div>
        <div id="links">
          <DndButton {...this.props} />
          <PauseButton {...this.props} />
        </div>
      </div>
    );
  }
}

class DndButton extends React.Component {
  render() {
    let text = "";
    if (this.props.ownFace.dnd) {
      text = "Disable DND";
    } else {
      text = "Enabled DND";
    }
    return (
      <a onClick={this.props.toggleDnd}
          className={this.props.ownFace.dnd ? 'active' : ''}>
        {text}
      </a>
    );
  }
}

class PauseButton extends React.Component {
  render() {
    let text = "";
    if (this.props.pause) {
      text = "Unpause snapshots";
    } else {
      text = "Pause snapshots";
    }
    return (
      <a onClick={this.props.togglePauseSnaptshot}
          className={this.props.pause ? 'active' : ''}>
        {text}
      </a>
    );
  }
}
