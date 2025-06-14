const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

const user = prompt("Enter your name");

const peer = new Peer({
  host: '/',
  port: location.port,
  path: '/peerjs',
  secure: location.protocol === 'https:'
});

let myVideoStream;

navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      console.log('Someone is calling me');
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      console.log("A new user connected with ID:", userId);
      setTimeout(() => {
        connectToNewUser(userId, stream);
      }, 1000); // Optional slight delay for PeerJS readiness
    });
  });

peer.on("open", (id) => {
  console.log('My PeerJS ID is: ' + id);
  socket.emit("join-room", window.ROOM_ID, id, user);
});

const connectToNewUser = (userId, stream) => {
  console.log('Calling user: ' + userId);
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};

// UI Controls
const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
const disconnectBtn = document.querySelector("#disconnect");

muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    muteButton.classList.toggle("background_red");
    muteButton.innerHTML = `<i class="fas fa-microphone-slash"></i>`;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    muteButton.classList.toggle("background_red");
    muteButton.innerHTML = `<i class="fas fa-microphone"></i>`;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    stopVideo.classList.toggle("background_red");
    stopVideo.innerHTML = `<i class="fas fa-video-slash"></i>`;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    stopVideo.classList.toggle("background_red");
    stopVideo.innerHTML = `<i class="fas fa-video"></i>`;
  }
});

inviteButton.addEventListener("click", () => {
  prompt("Copy this link and send it to people you want to have a video call with:",
    window.location.href
  );
});

disconnectBtn.addEventListener("click", () => {
  peer.destroy();
  const myVideoElement = document.querySelector("video");
  if (myVideoElement) {
    myVideoElement.remove();
  }
  socket.emit("disconnect");
  window.location.href = "https://www.google.com";
});

// Optional: Handle PeerJS errors
peer.on('error', err => {
  console.error("PeerJS Error:", err);
});
