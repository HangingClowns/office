import React from "react"
import ReactDOM from "react-dom"
import Webcam from "webcamjs"
import { FaceSocket } from './face_socket'
import { calculateImageSize } from './image-size-calculator'

class Office extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // Online status - "connecting", "offline", "online"
      online: "connecting",

      // Set to false if we don't have camera access
      camera: true,

      ownFace: {
        name: props.name,
        image: null
      },
      faces: [],
      imageSize: {
        width: 640,
        height: 480
      }
    };

    this.updateSnapshot = this.updateSnapshot.bind(this);
    this.handleRemoteFaceUpdate = this.handleRemoteFaceUpdate.bind(this);
    this.handleUserLeft = this.handleUserLeft.bind(this);
    this.adjustImageSize = this.adjustImageSize.bind(this);
    this.adjustImageSizeWithFaces = this.adjustImageSizeWithFaces.bind(this);

    // When the window resizes, we need to calculate the image sizes
    // we can use to maximise the screen real-estate
    window.onresize = this.adjustImageSize;
  }

  updateSnapshot() {
    if (!this.state.camera) {
      console.log("We don't have camera access, or camera");
      return;
    }
    console.log("Updating photo");
    Webcam.snap((newImage) => {
      this.socket.update(newImage);
      let ownFace = this.state.ownFace;
      ownFace.image = newImage;
      this.setState({ownFace: ownFace});
    });
  }

  handleRemoteFaceUpdate(payload) {
    console.log("New photo received");
    let allFaces = this.state.faces;
    let existingPerson = allFaces.find((face) => {return face.name == payload.name});
    if (existingPerson != null) {
      existingPerson.image = payload.image;
      this.setState({faces: allFaces});
    } else {
      allFaces.push(payload);
      this.adjustImageSizeWithFaces(allFaces);
    }
  }

  adjustImageSizeWithFaces(faces) {
    let imageSize = calculateImageSize(faces.length + 1);
    this.setState({faces: faces, imageSize: imageSize});
  }

  adjustImageSize() {
    let imageSize = calculateImageSize(this.state.faces.length + 1);
    this.setState({imageSize: imageSize});
  }

  handleUserLeft(payload) {
    console.log(`user left: ${payload.name}`);
    let allFaces = this.state.faces;
    let facesWithoutLeavingUser = allFaces.filter((user) => {
      return user.name != payload.name;
    });
    this.adjustImageSizeWithFaces(facesWithoutLeavingUser);
  }

  componentDidMount() {
    Webcam.attach("#live-face-image");
    Webcam.set({
      fps: 1,
      width: 1,
      height: 1,
      dest_width: 640,
      dest_height: 480
    });
    Webcam.on("load", () => {
      console.log("Loaded...");
      this.setState({camera: true});
      this.updateSnapshot();
    });
    Webcam.on("live", () => {
      console.log("Live...");
      this.setState({camera: true});
      this.updateSnapshot();
    });
    Webcam.on("error", () => {
      this.setState({camera: false});
      console.log("Error...");
    });

    this.socket = new FaceSocket(this.state.ownFace.name);
    this.socket.start({
        connecting: () => {
          console.log("Connecting to server");
          this.setState({online: "connecting"});
        },
        joined: () => {
          this.setState({online: "online"});
          console.log("Joined channel for image updates");
          this.adjustImageSize();
          // The image doesn't show if captured immediately.
          // Wait a while before taking it.
          setTimeout(this.updateSnapshot, 1000);
        },
        failed: () => {
          this.setState({online: "offline"});
          console.error("Failed to join update channel");
        },
        update: this.handleRemoteFaceUpdate,
        left: this.handleUserLeft,
      });

    // We update the photo once per minute:
    // 60 * 1000
    setInterval(this.updateSnapshot, 60000);
  }
  render() {
    return (
      <div id="page">
        <Faces {...this.state} handleUpdateSelfie={this.updateSnapshot} />
        <OnlineScreen {...this.state} />
      </div>
    );
  }
}

class OnlineScreen extends React.Component {
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

class Faces extends React.Component {
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
    return (
      <div className={classNames} style={imageSize}
          onClick={this.props.handleUpdateSelfie}>
        <img style={imageSize}
            src={this.props.face.image} />
        <div className="overlay" style={imageSize} />
        <div className="name">{this.props.face.name}</div>
      </div>
    );
  }
}

exports.Office = (data) => {
  ReactDOM.render(
    <Office {...data} />,
    document.getElementById("office-faces")
  );
};
