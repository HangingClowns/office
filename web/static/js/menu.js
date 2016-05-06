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
      <a onClick={this.props.toggleDnd}>{text}</a>
    );
  }
}
