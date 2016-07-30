import React from "react"
import ReactDOM from "react-dom"
import Webcam from "webcamjs"
import { FaceSocket } from './face_socket'
import { calculateImageSize } from './image-size-calculator'
import { Faces } from './faces'
import { OverlayScreen } from './overlay'
import { Menu } from './menu'

class Office extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // Online status - "connecting", "offline", "online"
      online: "connecting",

      // Set to false if we don't have camera access
      camera: true,

      // Whether or not we should pause snapshotting or not
      pause: false,

      ownFace: {
        name: props.name,
        dnd: false,
        image: null
      },
      faces: [],
      imageSize: {
        width: 640,
        height: 480
      }
    };

    this.updateSnapshot = this.updateSnapshot.bind(this);
    this.timedUpdateSnapshot = this.timedUpdateSnapshot.bind(this);
    this.handleRemoteFaceUpdate = this.handleRemoteFaceUpdate.bind(this);
    this.handleUserLeft = this.handleUserLeft.bind(this);
    this.adjustImageSize = this.adjustImageSize.bind(this);
    this.adjustImageSizeWithFaces = this.adjustImageSizeWithFaces.bind(this);
    this.toggleDnd = this.toggleDnd.bind(this);
    this.togglePauseSnaptshot = this.togglePauseSnaptshot.bind(this);
    this.handleDndUpdate = this.handleDndUpdate.bind(this);
    this.setupCamera = this.setupCamera.bind(this);

    // When the window resizes, we need to calculate the image sizes
    // we can use to maximise the screen real-estate
    window.onresize = this.adjustImageSize;
  }

  togglePauseSnaptshot() {
    if (! this.state.pause) {
      console.log("Activating pause, resetting webcam");
      Webcam.reset();
    } else {
      console.log("Activating photo taking again, after pause");
      this.setupCamera();
    }
    this.setState({pause: !!!this.state.pause});
  }

  toggleDnd() {
    let ownFace = this.state.ownFace;
    ownFace.dnd = ! ownFace.dnd;
    this.setState({ownFace: ownFace});
    this.socket.setDnd(ownFace.dnd);
  }

  timedUpdateSnapshot() {
    if (! this.state.pause) {
      this.updateSnapshot();
    }
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

  handleDndUpdate(payload) {
    console.log("User toggled DND");
    let allFaces = this.state.faces;
    let existingPerson = allFaces.find((face) => {return face.name == payload.name});
    if (existingPerson != null) {
      existingPerson.dnd = payload.state;
      this.setState({faces: allFaces});
    }
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
      // We received the image from someone we don't yet know!
      // That means they are new, and don't yet have our picture!
      // How sad, let's upload our current picture again,
      // so they get it in their feed too:
      this.socket.update(this.state.ownFace.image);
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

  setupCamera() {
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
  }

  componentDidMount() {
    this.setupCamera();

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
          setTimeout(this.timedUpdateSnapshot, 1000);
        },
        failed: () => {
          this.setState({online: "offline"});
          console.error("Failed to join update channel");
        },
        update: this.handleRemoteFaceUpdate,
        left: this.handleUserLeft,
        dnd: this.handleDndUpdate
      });

    // We update the photo once per minute:
    // 60 * 1000
    setInterval(this.timedUpdateSnapshot, 60000);
  }

  render() {
    return (
      <div id="page">
        <Menu {...this.state} toggleDnd={this.toggleDnd}
            togglePauseSnaptshot={this.togglePauseSnaptshot} />
        <Faces {...this.state} handleUpdateSelfie={this.updateSnapshot} />
        <OverlayScreen {...this.state} />
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
