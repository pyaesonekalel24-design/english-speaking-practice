/* =====================================================
   SPEAKUP V2

   MediaRecorder
        ↓
   Whisper
        ↓
   Transcript
        ↓
   Word alignment
        ↓
   Score
        ↓
   Wrong-word practice
===================================================== */


/* =====================================================
   WHISPER / TRANSFORMERS.JS
===================================================== */

import {
  pipeline
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1";



/* =====================================================
   WHISPER SETTINGS
===================================================== */

const WHISPER_MODEL =
  "onnx-community/whisper-tiny.en";


let transcriber = null;

let whisperLoading = false;



/* =====================================================
   PASSAGES
===================================================== */

const passages = {

  easy: [

    "Every morning, I wake up early and open the window. I drink a glass of water and prepare my breakfast. After that, I get ready for work and leave my house.",

    "My favorite day is Sunday because I have more free time. I usually stay at home, watch a movie, clean my room, and spend time with my family.",

    "The weather is beautiful today. The sky is blue, the sun is shining, and there is a cool breeze outside. I would like to go for a walk."

  ],


  medium: [

    "Last night, I went to a small restaurant near my house. The food was delicious, and the staff were very friendly. After dinner, I walked home slowly and enjoyed the cool evening air.",

    "Learning English takes time and practice. The more you speak, the more comfortable you become. Making mistakes is normal, and every mistake gives you another chance to learn.",

    "I usually make a list before I go shopping. It helps me remember everything I need and prevents me from buying unnecessary things. It also saves me time and money."

  ],


  intermediate: [

    "Although speaking English can feel difficult at first, regular practice can make a significant difference. The important thing is to keep speaking even when you make mistakes, because confidence grows through practice.",

    "Technology has changed the way people communicate with each other. We can now talk to someone on the other side of the world almost instantly, but face to face conversations are still important.",

    "When I have free time, I enjoy learning new things. Sometimes I read books, sometimes I watch educational videos, and sometimes I simply practice speaking English until difficult words become easier."

  ]

};



/* =====================================================
   STATE
===================================================== */

let currentLevel = "easy";

let currentPassage = "";

let mediaRecorder = null;

let audioChunks = [];

let isRecording = false;

let recordingStartTime = null;

let timerInterval = null;



/* =====================================================
   DOM
===================================================== */

const micBtn =
  document.getElementById("micBtn");

const micStatus =
  document.getElementById("micStatus");

const micIcon =
  document.getElementById("micIcon");

const recordingTimer =
  document.getElementById("recordingTimer");

const whisperStatus =
  document.getElementById("whisperStatus");



/* =====================================================
   SCREEN CONTROL
===================================================== */

window.showScreen = function(screenId) {

  document
    .querySelectorAll(".screen")
    .forEach(screen => {

      screen.classList.remove("active");

    });


  const target =
    document.getElementById(screenId);


  if (target) {

    target.classList.add("active");

  }

};



/* =====================================================
   HOME
===================================================== */

document
  .getElementById("startBtn")
  .addEventListener("click", () => {

    showScreen("levelScreen");

  });



/* =====================================================
   LEVEL BUTTONS
===================================================== */

document
  .querySelectorAll(".levelBtn")
  .forEach(button => {

    button.addEventListener("click", () => {

      currentLevel =
        button.dataset.level;

      startPractice();

    });

  });



/* =====================================================
   START PRACTICE
===================================================== */

function startPractice() {

  const list =
    passages[currentLevel];


  currentPassage =
    list[
      Math.floor(
        Math.random() * list.length
      )
    ];


  document
    .getElementById("passageText")
    .textContent =
      currentPassage;


  document
    .getElementById("levelLabel")
    .textContent =
      currentLevel
        .charAt(0)
        .toUpperCase() +
      currentLevel.slice(1);


  resetResults();


  showScreen("practiceScreen");


  /*
    Start the one-time scrolling
    after the screen becomes visible.
  */

  setTimeout(() => {

    startPassageScroll();

  }, 300);


  /*
    Start loading Whisper in the background.
  */

  loadWhisper();

}



/* =====================================================
   PASSAGE SCROLL
===================================================== */

function startPassageScroll() {

  const track =
    document.getElementById("passageTrack");


  /*
    Remove old animation.
  */

  track.classList.remove("scrolling");


  /*
    Force browser to reset animation.
  */

  void track.offsetWidth;


  /*
    Longer passage = longer animation.
  */

  const wordCount =
    currentPassage
      .trim()
      .split(/\s+/)
      .length;


  const duration =
    Math.max(
      14,
      wordCount * 0.48
    );


  track.style.animationDuration =
    `${duration}s`;


  track.classList.add("scrolling");

}



/* =====================================================
   RESET RESULTS
===================================================== */

function resetResults() {

  document
    .getElementById("transcriptSection")
    .classList.add("hidden");


  document
    .getElementById("scoreCard")
    .classList.add("hidden");


  document
    .getElementById("wordResultSection")
    .classList.add("hidden");


  document
    .getElementById("wordInfo")
    .classList.add("hidden");


  document
    .getElementById("againBtn")
    .classList.add("hidden");


  document
    .getElementById("transcriptBox")
    .textContent =
      "";


  document
    .getElementById("wordComparison")
    .innerHTML =
      "";


  document
    .getElementById("score")
    .textContent =
      "0";


  micStatus.textContent =
    "Tap the microphone to start";


  recordingTimer.textContent =
    "00:00";


  micBtn.classList.remove("recording");


  micIcon.textContent =
    "🎙️";

}



/* =====================================================
   LOAD WHISPER
===================================================== */

async function loadWhisper() {

  if (transcriber) {

    whisperStatus.textContent =
      "Whisper is ready.";

    whisperStatus.className =
      "whisperStatus ready";

    return;

  }


  if (whisperLoading) {

    return;

  }


  whisperLoading = true;


  whisperStatus.textContent =
    "Loading Whisper for the first time...";


  whisperStatus.className =
    "whisperStatus loading";


  try {

    /*
      Try WebGPU first.

      This can make supported devices
      much faster.
    */

    if ("gpu" in navigator) {

      try {

        transcriber =
          await pipeline(
            "automatic-speech-recognition",
            WHISPER_MODEL,
            {
              device: "webgpu"
            }
          );


      } catch (gpuError) {

        console.warn(
          "WebGPU unavailable. Falling back to WASM.",
          gpuError
        );


        transcriber =
          await pipeline(
            "automatic-speech-recognition",
            WHISPER_MODEL,
            {
              device: "wasm"
            }
          );

      }

    } else {

      /*
        Browser does not expose WebGPU.
      */

      transcriber =
        await pipeline(
          "automatic-speech-recognition",
          WHISPER_MODEL,
          {
            device: "wasm"
          }
        );

    }


    whisperStatus.textContent =
      "Whisper is ready ✓";


    whisperStatus.className =
      "whisperStatus ready";


    whisperLoading = false;


  } catch (error) {

    console.error(
      "Whisper loading error:",
      error
    );


    whisperStatus.textContent =
      "Whisper could not load. Check the browser console.";


    whisperStatus.className =
      "whisperStatus error";


    whisperLoading = false;

  }

}



/* =====================================================
   MICROPHONE
===================================================== */

micBtn.addEventListener(
  "click",
  async () => {

    if (isRecording) {

      stopRecording();

    } else {

      await startRecording();

    }

  }
);



/* =====================================================
   START RECORDING
===================================================== */

async function startRecording() {

  try {

    /*
      Make sure Whisper is loaded.
    */

    if (!transcriber) {

      micStatus.textContent =
        "Whisper is still loading...";


      await loadWhisper();


      if (!transcriber) {

        return;

      }

    }


    const stream =
      await navigator.mediaDevices
        .getUserMedia({
          audio: true
        });


    audioChunks = [];


    mediaRecorder =
      new MediaRecorder(stream);


    mediaRecorder.ondataavailable =
      event => {

        if (event.data.size > 0) {

          audioChunks.push(
            event.data
          );

        }

      };


    mediaRecorder.onstop =
      async () => {

        const audioBlob =
          new Blob(
            audioChunks,
            {
              type: mediaRecorder.mimeType
            }
          );


        stream
          .getTracks()
          .forEach(track => {
            track.stop();
          });


        clearInterval(
          timerInterval
        );


        isRecording = false;


        updateRecordingUI();


        await processRecording(
          audioBlob
        );

      };


    mediaRecorder.start();


    isRecording = true;


    recordingStartTime =
      Date.now();


    updateRecordingUI();


    startTimer();

  }


  catch (error) {

    console.error(error);


    micStatus.textContent =
      "Microphone permission was denied.";

  }

}



/* =====================================================
   STOP RECORDING
===================================================== */

function stopRecording() {

  if (!mediaRecorder) {

    return;

  }


  if (
    mediaRecorder.state ===
    "recording"
  ) {

    mediaRecorder.stop();

  }


  isRecording = false;

  updateRecordingUI();

}



/* =====================================================
   RECORDING UI
===================================================== */

function updateRecordingUI() {

  if (isRecording) {

    micBtn.classList.add(
      "recording"
    );


    micIcon.textContent =
      "⏹️";


    micStatus.textContent =
      "Recording... tap to stop";

  }

  else {

    micBtn.classList.remove(
      "recording"
    );


    micIcon.textContent =
      "🎙️";

  }

}



/* =====================================================
   TIMER
===================================================== */

function startTimer() {

  recordingTimer.textContent =
    "00:00";


  timerInterval =
    setInterval(() => {

      const elapsed =
        Math.floor(
          (
            Date.now() -
            recordingStartTime
          ) / 1000
        );


      const minutes =
        String(
          Math.floor(
            elapsed / 60
          )
        ).padStart(2, "0");


      const seconds =
        String(
          elapsed % 60
        ).padStart(2, "0");


      recordingTimer.textContent =
        `${minutes}:${seconds}`;

    }, 1000);

}



/* =====================================================
   PROCESS RECORDING
===================================================== */

async function processRecording(
  blob
) {

  micStatus.textContent =
    "Whisper is transcribing...";


  whisperStatus.textContent =
    "Processing your voice...";


  whisperStatus.className =
    "whisperStatus loading";


  try {

    /*
      Convert the microphone recording
      into 16 kHz mono audio.
    */

    const audio =
      await decodeAudio(
        blob
      );


    console.log(
      "Decoded audio:",
      audio.length
    );


    /*
      SEND AUDIO TO WHISPER
    */

    const result =
      await transcriber(
        audio,
        {
          language: "english",
          task: "transcribe",
          chunk_length_s: 30,
          stride_length_s: 5
        }
      );


    console.log(
      "Whisper result:",
      result
    );


    const transcript =
      result.text
        .trim();


    /*
      SHOW TRANSCRIPT
    */

    showTranscript(
      transcript
    );


    /*
      COMPARE WITH TARGET
    */

    compareSpeech(
      currentPassage,
      transcript
    );


    whisperStatus.textContent =
      "Transcription complete ✓";


    whisperStatus.className =
      "whisperStatus ready";


    micStatus.textContent =
      "Done. Check your result below.";

  }


  catch (error) {

    console.error(
      "Transcription error:",
      error
    );


    whisperStatus.textContent =
      "Transcription failed.";

    whisperStatus.className =
      "whisperStatus error";


    micStatus.textContent =
      "Something went wrong while processing the recording.";

  }

}



/* =====================================================
   AUDIO DECODING
===================================================== */

async function decodeAudio(
  blob
) {

  const arrayBuffer =
    await blob.arrayBuffer();


  const audioContext =
    new AudioContext();


  const audioBuffer =
    await audioContext.decodeAudioData(
      arrayBuffer
    );


  /*
    Whisper expects 16 kHz audio.

    We create a temporary offline
    audio context to resample it.
  */

  const targetSampleRate =
    16000;


  const targetLength =
    Math.ceil(
      audioBuffer.duration *
      targetSampleRate
    );


  const offlineContext =
    new OfflineAudioContext(
      1,
      targetLength,
      targetSampleRate
    );


  const source =
    offlineContext.createBufferSource();


  source.buffer =
    audioBuffer;


  source.connect(
    offlineContext.destination
  );


  source.start();


  const rendered =
    await offlineContext.startRendering();


  const channel =
    rendered.getChannelData(0);


  await audioContext.close();


  return channel;

}



/* =====================================================
   SHOW TRANSCRIPT
===================================================== */

function showTranscript(
  transcript
) {

  document
    .getElementById("transcriptSection")
    .classList.remove("hidden");


  document
    .getElementById("transcriptBox")
    .textContent =
      transcript ||
      "(Whisper did not detect any speech.)";

}



/* =====================================================
   WORD NORMALIZATION
===================================================== */

function normalizeWord(
  word
) {

  return word
    .toLowerCase()
    .replace(/[^\w']/g, "")
    .trim();

}



/* =====================================================
   SPLIT WORDS
===================================================== */

function splitWords(
  text
) {

  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean);

}



/* =====================================================
   WORD ALIGNMENT
===================================================== */

/*
  This is important.

  We DO NOT simply compare:

  target[0] with spoken[0]
  target[1] with spoken[1]

  because if Whisper misses one word,
  everything afterward would become red.

  Instead we use a small edit-distance
  alignment.
*/

function alignWords(
  targetWords,
  spokenWords
) {

  const rows =
    targetWords.length + 1;


  const cols =
    spokenWords.length + 1;


  const dp =
    Array.from(
      {
        length: rows
      },
      () =>
        Array(cols).fill(0)
    );


  for (
    let i = 0;
    i < rows;
    i++
  ) {

    dp[i][0] = i;

  }


  for (
    let j = 0;
    j < cols;
    j++
  ) {

    dp[0][j] = j;

  }


  for (
    let i = 1;
    i < rows;
    i++
  ) {

    for (
      let j = 1;
      j < cols;
      j++
    ) {

      const target =
        normalizeWord(
          targetWords[i - 1]
        );


      const spoken =
        normalizeWord(
          spokenWords[j - 1]
        );


      const substitutionCost =
        target === spoken
          ? 0
          : 1;


      dp[i][j] =
        Math.min(

          /*
            Delete target word
          */

          dp[i - 1][j] + 1,


          /*
            Insert spoken word
          */

          dp[i][j - 1] + 1,


          /*
            Match/substitute
          */

          dp[i - 1][j - 1]
          +
          substitutionCost

        );

    }

  }


  /*
    Backtrack
  */

  const alignment = [];


  let i =
    targetWords.length;


  let j =
    spokenWords.length;


  while (
    i > 0 ||
    j > 0
  ) {

    if (
      i > 0 &&
      j > 0 &&
      normalizeWord(
        targetWords[i - 1]
      ) ===
      normalizeWord(
        spokenWords[j - 1]
      )
    ) {

      alignment.unshift({

        type: "match",

        target:
          targetWords[i - 1],

        spoken:
          spokenWords[j - 1]

      });


      i--;
      j--;


      continue;

    }


    if (
      i > 0 &&
      j > 0 &&
      dp[i][j] ===
      dp[i - 1][j - 1] + 1
    ) {

      alignment.unshift({

        type: "wrong",

        target:
          targetWords[i - 1],

        spoken:
          spokenWords[j - 1]

      });


      i--;
      j--;


      continue;

    }


    if (
      i > 0 &&
      dp[i][j] ===
      dp[i - 1][j] + 1
    ) {

      alignment.unshift({

        type: "missing",

        target:
          targetWords[i - 1],

        spoken:
          null

      });


      i--;


      continue;

    }


    if (
      j > 0 &&
      dp[i][j] ===
      dp[i][j - 1] + 1
    ) {

      alignment.unshift({

        type: "extra",

        target:
          null,

        spoken:
          spokenWords[j - 1]

      });


      j--;


      continue;

    }


    /*
      Safety fallback
    */

    if (i > 0) {

      alignment.unshift({

        type: "missing",

        target:
          targetWords[i - 1],

        spoken:
          null

      });


      i--;

    }

    else {

      alignment.unshift({

        type: "extra",

        target:
          null,

        spoken:
          spokenWords[j - 1]

      });


      j--;

    }

  }


  return alignment;

}



/* =====================================================
   COMPARE SPEECH
===================================================== */

function compareSpeech(
  targetText,
  spokenText
) {

  const targetWords =
    splitWords(
      targetText
    );


  const spokenWords =
    splitWords(
      spokenText
    );


  const alignment =
    alignWords(
      targetWords,
      spokenWords
    );


  /*
    Count only target words.

    A word is correct when Whisper
    matched it exactly.
  */

  let matched =
    0;


  for (
    const item of alignment
  ) {

    if (
      item.type ===
      "match"
    ) {

      matched++;

    }

  }


  const score =
    targetWords.length === 0
      ? 0
      : Math.round(
          (
            matched /
            targetWords.length
          ) * 100
        );


  showScore(
    score
  );


  renderWordComparison(
    alignment
  );

}



/* =====================================================
   SCORE
===================================================== */

function showScore(
  score
) {

  document
    .getElementById("score")
    .textContent =
      score;


  document
    .getElementById("scoreCard")
    .classList.remove(
      "hidden"
    );


  let message;


  if (score >= 90) {

    message =
      "Excellent reading! 🔥";

  }

  else if (score >= 75) {

    message =
      "Very good! Keep going.";

  }

  else if (score >= 50) {

    message =
      "Good start. Let's improve those words.";

  }

  else {

    message =
      "Keep practicing. You will improve.";

  }


  document
    .getElementById("scoreMessage")
    .textContent =
      message;

}



/* =====================================================
   RENDER WORDS
===================================================== */

function renderWordComparison(
  alignment
) {

  const container =
    document.getElementById(
      "wordComparison"
    );


  container.innerHTML = "";


  for (
    const item of alignment
  ) {

    /*
      Correct
    */

    if (
      item.type ===
      "match"
    ) {

      const span =
        document.createElement(
          "span"
        );


      span.className =
        "word correct";


      span.textContent =
        item.target;


      container.appendChild(
        span
      );

    }


    /*
      Wrong or missing
    */

    else if (
      item.type ===
      "wrong"
      ||
      item.type ===
      "missing"
    ) {

      const span =
        document.createElement(
          "span"
        );


      span.className =
        "word wrong";


      span.textContent =
        item.target;


      span.title =
        item.spoken
          ? `Whisper heard: ${item.spoken}`
          : "Whisper did not hear this word";


      span.addEventListener(
        "click",
        () => {

          showWordInfo(
            item.target
          );

        }
      );


      container.appendChild(
        span
      );

    }


    /*
      Extra words Whisper heard
    */

    else if (
      item.type ===
      "extra"
    ) {

      const span =
        document.createElement(
          "span"
        );


      span.className =
        "word extra";


      span.textContent =
        `[${item.spoken}]`;


      span.title =
        "Extra word detected";


      container.appendChild(
        span
      );

    }

  }


  document
    .getElementById(
      "wordResultSection"
    )
    .classList.remove(
      "hidden"
    );


  document
    .getElementById(
      "againBtn"
    )
    .classList.remove(
      "hidden"
    );

}



/* =====================================================
   WORD INFORMATION
===================================================== */

function showWordInfo(
  word
) {

  const info =
    document.getElementById(
      "wordInfo"
    );


  const selected =
    document.getElementById(
      "selectedWord"
    );


  const similar =
    document.getElementById(
      "similarWords"
    );


  selected.textContent =
    word;


  similar.innerHTML =
    getSimilarWords(
      word
    );


  info.classList.remove(
    "hidden"
  );


  document
    .getElementById(
      "pronounceBtn"
    )
    .onclick =
      () => {

        pronounceWord(
          word
        );

      };


  /*
    Scroll to the word information
    on mobile.
  */

  info.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

}



/* =====================================================
   PRONUNCIATION
===================================================== */

function pronounceWord(
  word
) {

  if (
    !("speechSynthesis" in window)
  ) {

    return;

  }


  speechSynthesis.cancel();


  const utterance =
    new SpeechSynthesisUtterance(
      word
    );


  utterance.lang =
    "en-US";


  utterance.rate =
    0.72;


  speechSynthesis.speak(
    utterance
  );

}



/* =====================================================
   SIMILAR SOUND WORDS
===================================================== */

function getSimilarWords(
  word
) {

  const dictionary = {

    three: [
      "tree",
      "free",
      "see"
    ],

    tree: [
      "three",
      "free"
    ],

    think: [
      "sink",
      "thick"
    ],

    very: [
      "berry",
      "vary"
    ],

    ship: [
      "sheep"
    ],

    sheep: [
      "ship"
    ],

    live: [
      "leave"
    ],

    leave: [
      "live"
    ],

    fan: [
      "van"
    ],

    van: [
      "fan"
    ],

    rice: [
      "rise"
    ],

    rise: [
      "rice"
    ]

  };


  const key =
    word
      .toLowerCase();


  if (
    dictionary[key]
  ) {

    return `
      Similar sounds:
      <strong>
        ${dictionary[key].join(", ")}
      </strong>
    `;

  }


  return `
    Try saying the word slowly,
    then repeat it at normal speed.
  `;

}



/* =====================================================
   START AGAIN
===================================================== */

document
  .getElementById("againBtn")
  .addEventListener(
    "click",
    () => {

      startPractice();

    }
  );



/* =====================================================
   LEAVE PRACTICE
===================================================== */

window.leavePractice =
  function() {

    if (isRecording) {

      stopRecording();

    }


    showScreen(
      "levelScreen"
    );

  };
