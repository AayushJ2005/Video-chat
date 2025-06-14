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
const peers = {}; // Track active connections

navigator.mediaDevices
  .getUserMedia({ audio: true, video: true })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream, user);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");

      call.on("stream", (userVideoStream) => {
        const callerName = call.metadata?.name || "Unknown";
        addVideoStream(video, userVideoStream, callerName);
      });

      call.on("close", () => {
        video.parentElement.remove();
      });

      peers[call.peer] = call;
    });

    socket.on("user-connected", (userId, userName) => {
      setTimeout(() => {
        connectToNewUser(userId, stream, userName);
      }, 1000);
    });

    socket.on("user-disconnected", (userId) => {
      if (peers[userId]) peers[userId].close();
    });
  })
  .catch(err => {
    console.error("Media access error:", err);
    alert("Please allow camera and microphone access.");
  });

peer.on("open", (id) => {
  socket.emit("join-room", window.ROOM_ID, id, user);
});

const connectToNewUser = (userId, stream, userName) => {
  const call = peer.call(userId, stream, { metadata: { name: user } });
  const video = document.createElement("video");

  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream, userName);
  });

  call.on("close", () => {
    video.parentElement.remove();
  });

  peers[userId] = call;
};

const addVideoStream = (video, stream, name = "You") => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    const wrapper = document.createElement("div");
    wrapper.style.textAlign = "center";
    wrapper.style.margin = "10px";

    const nameLabel = document.createElement("div");
    nameLabel.innerText = name;
    nameLabel.style.color = "white";
    nameLabel.style.marginTop = "5px";
    nameLabel.style.fontSize = "14px";

    wrapper.appendChild(video);
    wrapper.appendChild(nameLabel);
    videoGrid.append(wrapper);
  });
};

// UI Controls
const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
const disconnectBtn = document.querySelector("#disconnect");

muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  myVideoStream.getAudioTracks()[0].enabled = !enabled;
  muteButton.classList.toggle("background_red");
  muteButton.innerHTML = enabled
    ? `<i class="fas fa-microphone-slash"></i>`
    : `<i class="fas fa-microphone"></i>`;
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  myVideoStream.getVideoTracks()[0].enabled = !enabled;
  stopVideo.classList.toggle("background_red");
  stopVideo.innerHTML = enabled
    ? `<i class="fas fa-video-slash"></i>`
    : `<i class="fas fa-video"></i>`;
});

inviteButton.addEventListener("click", () => {
  prompt("Share this link to invite others:", window.location.href);
});

disconnectBtn.addEventListener("click", () => {
  peer.destroy();
  socket.disconnect();
  const myVideoElement = document.querySelector("video");
  if (myVideoElement) myVideoElement.remove();
  window.location.href = "https://www.google.com";
});

peer.on('error', err => {
  console.error("PeerJS Error:", err);
});