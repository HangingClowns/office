import React from "react"
import ReactDOM from "react-dom"
import Webcam from "webcamjs"
import { FaceSocket } from './face_socket'
import { calculateImageSize } from './image-size-calculator'

class Office extends React.Component {
  constructor(props) {
    super(props);

    let randomUserId = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);

    this.state = {
      ownFace: {
        name: randomUserId,
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

    this.socket = new FaceSocket(randomUserId);
    this.socket.start({
        joined: (resp) => {
          console.log("Joined channel for image updates");
        },
        failed_join: (resp) => {
          console.error("Failed to join update channel");
        },
        update: this.handleRemoteFaceUpdate,
        left: this.handleUserLeft,
      });

    // We update the photo once per minute:
    // 60 * 1000
    setInterval(this.updateSnapshot, 10000);
  }
  updateSnapshot() {
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
    let imageSize = calculateImageSize(faces.length);
    this.setState({faces: faces, imageSize: imageSize});
  }
  adjustImageSize() {
    let imageSize = calculateImageSize(this.state.faces.length);
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
      this.updateSnapshot();
    });
    Webcam.on("live", () => {
      console.log("Live...");
      this.updateSnapshot();
    });
    Webcam.on("error", () => {
      console.log("Error...");
    });
    this.updateSnapshot();
  }
  render() {
    return (
      <div id="page">
        <Faces {...this.state} handleUpdateSelfie={this.updateSnapshot} />
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
        <Face key="my_face" face={this.props.ownFace} {...this.props} />
        {faces}
      </div>
    );
  }
}

class Face extends React.Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }
  onClick() {
    console.log("Clicked");
    this.props.handleUpdateSelfie();
  }
  render() {
    let imageSize = {
      height: this.props.imageSize.height,
      width: this.props.imageSize.width,
    };
    return (
      <img style={imageSize}
          src={this.props.face.image} className="face-image"
          onClick={this.props.handleUpdateSelfie}
          />
    );
  }
}

exports.Office = (data) => {
  ReactDOM.render(
    <Office {...data} />,
    document.getElementById("office-faces")
  );
};
