import React from "react"

export class Faces extends React.Component {
  render() {
    let faces = this.props.faces.map((face) => {
      return (<Face key={face.name} face={face} imageSize={this.props.imageSize} />);
    });
    return (
      <div id="all-faces">
        <Face key="my_face" isMe="true" face={this.props.ownFace} {...this.props} />
        {faces}
      </div>
    );
  }
}

class Face extends React.Component {
  render() {
    // If we don't have any data yet,
    // then don't render the face
    if (this.props.face.image == null) {
      return null;
    }
    let imageSize = {
      height: this.props.imageSize.height,
      width: this.props.imageSize.width,
    };
    let classNames = "face-image";
    if (this.props.isMe == "true") {
      classNames = classNames + " me";
    }
    let overlayClasses = "overlay";
    if (this.props.face.dnd) {
      overlayClasses += " dnd";
    }
    return (
      <div className={classNames} style={imageSize}
          onClick={this.props.handleUpdateSelfie}>
        <img style={imageSize}
            src={this.props.face.image} />
        <div className={overlayClasses} style={imageSize}>
          <span class="dnd">DND</span>
        </div>
        <div className="name">{this.props.face.name}</div>
      </div>
    );
  }
}
