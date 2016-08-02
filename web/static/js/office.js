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
        pause: false,
        image: null,
      },
      faces: [],
      imageSize: {
        width: 640,
        height: 480,
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
    this.handlePauseUpdate = this.handlePauseUpdate.bind(this);
    this.setupCamera = this.setupCamera.bind(this);

    // When the window resizes, we need to calculate the image sizes
    // we can use to maximise the screen real-estate
    window.onresize = this.adjustImageSize;
  }

  togglePauseSnaptshot() {
    let ownFace = this.state.ownFace;
    ownFace.pause = ! ownFace.pause;
    this.setState({ownFace});
    this.socket.setPause(ownFace.pause);

    if (ownFace.pause) {
      console.log("Activating pause, resetting webcam");
      Webcam.reset();
    } else {
      console.log("Activating photo taking again, after pause");
      this.setupCamera();
    }
  }

  toggleDnd() {
    let ownFace = this.state.ownFace;
    ownFace.dnd = ! ownFace.dnd;
    this.setState({ownFace: ownFace});
    this.socket.setDnd(ownFace.dnd);
  }

  timedUpdateSnapshot() {
    if (! this.state.ownFace.pause) {
      this.updateSnapshot();
    }
  }

  updateSnapshot() {
    if (!this.state.camera) {
      console.log("We don't have camera access, or camera");
      return;
    }
    if (this.state.ownFace.pause) {
      console.log("Cannot update our own photo when in pause mode");
      return
    }
    console.log("Updating photo");
    Webcam.snap((newImage) => {
      let ownFace = this.state.ownFace;
      ownFace.image = newImage;
      this.sendUpdate(ownFace);
      this.setState({ownFace: ownFace});
    });
  }

  handlePauseUpdate(payload) {
    console.log("User toggled pause");
    this.updateStateForFaceWithCallback(payload.name, face => face.pause = payload.state);
  }

  handleDndUpdate(payload) {
    console.log("User toggled DND");
    this.updateStateForFaceWithCallback(payload.name, face => face.dnd = payload.state);
  }

  updateStateForFaceWithCallback(name, callback) {
    let allFaces = this.state.faces;
    let existingPerson = allFaces.find((face) => {return face.name == name});
    if (existingPerson != null) {
      callback(existingPerson);
      this.setState({faces: allFaces});
    }
  }

  handleRemoteFaceUpdate(payload) {
    console.log("New photo received");
    let receivedFace = payload.face;
    let allFaces = this.state.faces;
    let existingPerson = allFaces.find((face) => {return face.name == payload.name});
    if (existingPerson != null) {
      existingPerson.image = receivedFace.image;
      existingPerson.dnd = receivedFace.dnd;
      existingPerson.pause = receivedFace.pause;
      this.setState({faces: allFaces});
    } else {
      allFaces.push(receivedFace);
      this.adjustImageSizeWithFaces(allFaces);
      // We received the image from someone we don't yet know!
      // That means they are new, and don't yet have our picture!
      // How sad, let's upload our current picture again,
      // so they get it in their feed too:
      this.sendUpdate();
    }
  }

  sendUpdate() {
    this.socket.update(this.state.ownFace);
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
      this.delayedSnapshot();
    });
    Webcam.on("live", () => {
      console.log("Live...");
      this.setState({camera: true});
      this.delayedSnapshot();
    });
    Webcam.on("error", () => {
      this.setState({camera: false});
      console.log("Error...");
    });
    this.delayedSnapshot();
    this.adjustImageSize();
  }

  delayedSnapshot() {
    console.log("Scheduling a delayed snapshot");
    setTimeout(this.updateSnapshot, 2000);
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
          // If we joined, the others might not have our photo yet,
          // so better send it - just to be on the safe side?
          this.sendUpdate(this.state.ownFace);
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
        dnd: this.handleDndUpdate,
        pause: this.handlePauseUpdate,
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
