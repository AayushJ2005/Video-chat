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
const peers = {}; // ✅ Track active peer connections

navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    console.log("🎤 Audio tracks available:", stream.getAudioTracks());
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    // Handle incoming calls
    peer.on("call", (call) => {
      console.log('📞 Incoming call received');
      call.answer(stream);
      const video = document.createElement("video");

      call.on("stream", (userVideoStream) => {
        console.log("📡 Received user stream:", userVideoStream.getAudioTracks());
        addVideoStream(video, userVideoStream);
      });

      call.on("close", () => {
        console.log("📴 Call closed by remote peer");
        video.remove(); // ✅ Remove video from DOM
      });

      peers[call.peer] = call; // ✅ Save call to cleanup later
    });

    // When a new user connects
    socket.on("user-connected", (userId) => {
      console.log("🔗 A new user connected with ID:", userId);
      setTimeout(() => {
        connectToNewUser(userId, stream);
      }, 1000);
    });

    // When a user disconnects
    socket.on("user-disconnected", (userId) => {
      console.log("❌ User disconnected:", userId);
      if (peers[userId]) peers[userId].close();
    });
  })
  .catch(err => {
    console.error("❌ Failed to access media devices:", err);
    alert("Please allow microphone & camera access.");
  });

peer.on("open", (id) => {
  console.log('🆔 My PeerJS ID is: ' + id);
  socket.emit("join-room", window.ROOM_ID, id, user);
});

const connectToNewUser = (userId, stream) => {
  console.log('📞 Calling user: ' + userId);
  const call = peer.call(userId, stream);
  const video = document.createElement("video");

  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });

  call.on("close", () => {
    console.log("📴 Peer call closed");
    video.remove();
  });

  peers[userId] = call;
};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.volume = 1; // ✅ Make sure audio plays
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
  prompt("📤 Share this link to invite others:", window.location.href);
});

disconnectBtn.addEventListener("click", () => {
  peer.destroy();
  socket.disconnect(); // ✅ Proper disconnect
  const myVideoElement = document.querySelector("video");
  if (myVideoElement) {
    myVideoElement.remove();
  }
  window.location.href = "https://www.google.com";
});

peer.on('error', err => {
  console.error("⚠️ PeerJS Error:", err);
});
