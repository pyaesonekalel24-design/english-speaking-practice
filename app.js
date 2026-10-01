/* =========================================
   SPEAKUP
   Clean foundation
========================================= */


/* =========================================
   PASSAGES
========================================= */

const passages = {

  easy: [

    "I wake up early every morning. I drink a glass of water and prepare my breakfast. Then I get ready for work.",

    "My favorite day is Sunday. I usually stay at home, watch movies, and spend time with my family.",

    "The weather is beautiful today. The sky is blue and the sun is shining. I want to go outside and enjoy the day."

  ],

  medium: [

    "Last night, I went to a small restaurant near my house. The food was delicious, and the staff were very friendly.",

    "Learning English takes time and practice. The more you speak, the more comfortable you will become when talking to other people.",

    "I usually make a list before I go shopping. It helps me remember everything I need and prevents me from buying unnecessary things."

  ],

  intermediate: [

    "Although speaking English can feel difficult at first, regular practice can make a significant difference. The important thing is to keep speaking even when you make mistakes.",

    "Technology has changed the way people communicate with each other. We can now talk to someone on the other side of the world almost instantly.",

    "When I have free time, I enjoy learning new things. Sometimes I read books, sometimes I watch educational videos, and sometimes I simply practice speaking English."

  ]

};


/* =========================================
   STATE
========================================= */

let currentLevel = "easy";

let currentPassage = "";

let mediaRecorder = null;

let audioChunks = [];

let audioBlob = null;

let isRecording = false;

let recordingStartTime = null;

let timerInterval = null;


/* =========================================
   SCREEN CONTROL
========================================= */

function showScreen(screenId) {

  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const screen = document.getElementById(screenId);

  if (screen) {
    screen.classList.add("active");
  }

}


/* =========================================
   HOME
========================================= */

document.getElementById("startBtn").addEventListener("click", () => {

  showScreen("levelScreen");

});


/* =========================================
   LEVEL BUTTONS
========================================= */

document.querySelectorAll(".levelBtn").forEach(button => {

  button.addEventListener("click", () => {

    currentLevel = button.dataset.level;

    startPractice();

  });

});


/* =========================================
   START PRACTICE
========================================= */

function startPractice() {

  const list = passages[currentLevel];

  currentPassage =
    list[Math.floor(Math.random() * list.length)];

  document.getElementById("passageText").textContent =
    currentPassage;

  document.getElementById("levelLabel").textContent =
    currentLevel.charAt(0).toUpperCase() +
    currentLevel.slice(1);

  resetResults();

  showScreen("practiceScreen");

}


/* =========================================
   RESET
========================================= */

function resetResults() {

  document.getElementById("transcriptSection")
    .classList.add("hidden");

  document.getElementById("scoreCard")
    .classList.add("hidden");

  document.getElementById("wordResultSection")
    .classList.add("hidden");

  document.getElementById("wordInfo")
    .classList.add("hidden");

  document.getElementById("againBtn")
    .classList.add("hidden");

  document.getElementById("transcriptBox")
    .textContent = "Nothing yet.";

  document.getElementById("wordComparison")
    .innerHTML = "";

}


/* =========================================
   MICROPHONE BUTTON
========================================= */

document.getElementById("micBtn").addEventListener("click", async () => {

  if (isRecording) {

    stopRecording();

  } else {

    await startRecording();

  }

});


/* =========================================
   START RECORDING
========================================= */

async function startRecording() {

  try {

    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: true
      });


    audioChunks = [];


    mediaRecorder =
      new MediaRecorder(stream);


    mediaRecorder.addEventListener("dataavailable", event => {

      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }

    });


    mediaRecorder.addEventListener("stop", async () => {

      audioBlob =
        new Blob(audioChunks, {
          type: "audio/webm"
        });


      stream.getTracks().forEach(track => {
        track.stop();
      });


      clearInterval(timerInterval);

      document.getElementById("micStatus").textContent =
        "Recording finished. Preparing transcription...";


      /*
        WHISPER WILL BE CONNECTED HERE.
      */

      await processRecording(audioBlob);

    });


    mediaRecorder.start();

    isRecording = true;

    recordingStartTime = Date.now();

    updateRecordingUI();

    startTimer();

  }

  catch (error) {

    console.error(error);

    document.getElementById("micStatus").textContent =
      "Microphone permission was denied.";

  }

}


/* =========================================
   STOP RECORDING
========================================= */

function stopRecording() {

  if (!mediaRecorder) {
    return;
  }

  if (mediaRecorder.state === "recording") {

    mediaRecorder.stop();

  }

  isRecording = false;

  updateRecordingUI();

}


/* =========================================
   RECORDING UI
========================================= */

function updateRecordingUI() {

  const button =
    document.getElementById("micBtn");

  const status =
    document.getElementById("micStatus");

  const icon =
    document.getElementById("micIcon");


  if (isRecording) {

    button.classList.add("recording");

    icon.textContent = "⏹️";

    status.textContent =
      "Recording... tap to stop";

  } else {

    button.classList.remove("recording");

    icon.textContent = "🎙️";

  }

}


/* =========================================
   TIMER
========================================= */

function startTimer() {

  const timer =
    document.getElementById("recordingTimer");


  timer.textContent = "00:00";


  timerInterval =
    setInterval(() => {

      const elapsed =
        Math.floor(
          (Date.now() - recordingStartTime) / 1000
        );


      const minutes =
        String(Math.floor(elapsed / 60))
          .padStart(2, "0");


      const seconds =
        String(elapsed % 60)
          .padStart(2, "0");


      timer.textContent =
        `${minutes}:${seconds}`;

    }, 1000);

}


/* =========================================
   PROCESS RECORDING
========================================= */

async function processRecording(blob) {

  console.log("Audio recorded:", blob);

  /*
    THIS IS WHERE WHISPER WILL GO.

    For now we show a test message
    so we know recording itself works.
  */

  document.getElementById("transcriptSection")
    .classList.remove("hidden");


  document.getElementById("transcriptBox")
    .textContent =
      "Whisper is not connected yet — but your recording was successfully captured.";

}


/* =========================================
   PRONUNCIATION
========================================= */

function pronounceWord(word) {

  if (!("speechSynthesis" in window)) {

    alert("Speech synthesis is not supported.");

    return;

  }


  window.speechSynthesis.cancel();


  const utterance =
    new SpeechSynthesisUtterance(word);


  utterance.lang = "en-US";

  utterance.rate = 0.75;

  utterance.pitch = 1;


  window.speechSynthesis.speak(utterance);

}


/* =========================================
   WRONG WORD CLICK
========================================= */

function showWordInfo(word) {

  const info =
    document.getElementById("wordInfo");


  const selected =
    document.getElementById("selectedWord");


  const similar =
    document.getElementById("similarWords");


  selected.textContent = word;


  similar.innerHTML =
    getSimilarWords(word);


  info.classList.remove("hidden");


  document.getElementById("pronounceBtn")
    .onclick = () => {

      pronounceWord(word);

    };

}


/* =========================================
   SIMILAR SOUND WORDS
========================================= */

function getSimilarWords(word) {

  const dictionary = {

    three: ["tree", "free", "see"],

    tree: ["three", "free"],

    think: ["sink", "thick"],

    very: ["berry", "vary"],

    ship: ["sheep"],

    sheep: ["ship"],

    live: ["leave"],

    leave: ["live"],

    fan: ["van"],

    van: ["fan"],

    rice: ["rise"],

    rise: ["rice"]

  };


  const key =
    word.toLowerCase();


  if (dictionary[key]) {

    return `
      Similar sounds:
      <strong>${dictionary[key].join(", ")}</strong>
    `;

  }


  return `
    Try listening carefully and repeating
    the word slowly.
  `;

}


/* =========================================
   AGAIN BUTTON
========================================= */

document.getElementById("againBtn")
  .addEventListener("click", () => {

    startPractice();

  });
