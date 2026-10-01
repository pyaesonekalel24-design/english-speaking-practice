/*
=====================================================
 SPEAKUP
 Simple stable version

 Home
   ↓
 Level
   ↓
 Practice
   ↓
 Manual microphone
   ↓
 Whisper
   ↓
 Transcript
   ↓
 Word alignment
   ↓
 Score
=====================================================
*/


/* =====================================================
   WHISPER / TRANSFORMERS.JS

   We use the stable Transformers.js 3.8.1 version.
===================================================== */

import {
  pipeline
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";


/* =====================================================
   WHISPER SETTINGS
===================================================== */

const WHISPER_MODEL = "Xenova/whisper-tiny.en";

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

let scrollAnimationId = null;


/* =====================================================
   DOM
===================================================== */

const homeScreen =
  document.getElementById("homeScreen");

const levelScreen =
  document.getElementById("levelScreen");

const practiceScreen =
  document.getElementById("practiceScreen");

const startBtn =
  document.getElementById("startBtn");

const backHomeBtn =
  document.getElementById("backHomeBtn");

const backLevelsBtn =
  document.getElementById("backLevelsBtn");

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

function showScreen(screenId) {

  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.remove("active");
    });


  const target =
    document.getElementById(screenId);


  if (!target) {
    console.error(
      "Screen not found:",
      screenId
    );

    return;
  }


  target.classList.add("active");

}


/* =====================================================
   HOME
===================================================== */

startBtn.addEventListener(
  "click",
  () => {

    showScreen("levelScreen");

  }
);


/* =====================================================
   BACK TO HOME
===================================================== */

backHomeBtn.addEventListener(
  "click",
  () => {

    showScreen("homeScreen");

  }
);


/* =====================================================
   BACK TO LEVELS
===================================================== */

backLevelsBtn.addEventListener(
  "click",
  () => {

    leavePractice();

  }
);


/* =====================================================
   LEVEL BUTTONS
===================================================== */

document
  .querySelectorAll(".levelBtn")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        currentLevel =
          button.dataset.level;

        console.log(
          "Selected level:",
          currentLevel
        );

        startPractice();

      }
    );

  });


/* =====================================================
   START PRACTICE
===================================================== */

function startPractice() {

  const list =
    passages[currentLevel];


  if (!list) {

    console.error(
      "No passages found for:",
      currentLevel
    );

    return;

  }


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


  showScreen(
    "practiceScreen"
  );


  /*
    IMPORTANT:

    We DO NOT load Whisper here.

    This keeps the level buttons fast.

    Whisper loads only when the
    user actually presses the mic.
  */

  whisperStatus.textContent =
    "Whisper will load when you use the microphone.";

  whisperStatus.className =
    "whisperStatus";


  /*
    Start passage animation after
    practice screen is visible.
  */

  setTimeout(
    () => {

      startPassageScroll();

    },
    150
  );

}


/* =====================================================
   PASSAGE SCROLL
===================================================== */

function startPassageScroll() {

  const viewport =
    document.querySelector(
      ".passageViewport"
    );

  const text =
    document.getElementById(
      "passageText"
    );


  if (!viewport || !text) {
    return;
  }


  /*
    Cancel previous animation.
  */

  if (scrollAnimationId) {

    cancelAnimationFrame(
      scrollAnimationId
    );

    scrollAnimationId = null;

  }


  /*
    Reset position.
  */

  text.style.transform =
    "translateY(0px)";


  /*
    Wait one frame so the browser
    calculates the real text height.
  */

  requestAnimationFrame(
    () => {

      const viewportHeight =
        viewport.clientHeight;

      const textHeight =
        text.scrollHeight;


      /*
        Start below the viewport.
      */

      const startY =
        viewportHeight;


      /*
        End above the viewport.
      */

      const endY =
        -textHeight;


      text.style.transform =
        `translateY(${startY}px)`;


      /*
        Longer passage = longer scroll.
      */

      const wordCount =
        currentPassage
          .trim()
          .split(/\s+/)
          .length;


      const duration =
        Math.max(
          12000,
          wordCount * 480
        );


      const startTime =
        performance.now();


      function animate(
        currentTime
      ) {

        const elapsed =
          currentTime -
          startTime;


        const progress =
          Math.min(
            elapsed / duration,
            1
          );


        /*
          Smooth movement.
        */

        const eased =
          progress * (2 - progress);


        const currentY =
          startY +
          (endY - startY) *
          eased;


        text.style.transform =
          `translateY(${currentY}px)`;


        if (progress < 1) {

          scrollAnimationId =
            requestAnimationFrame(
              animate
            );

        }

        else {

          scrollAnimationId = null;

        }

      }


      /*
        Start animation.
      */

      scrollAnimationId =
        requestAnimationFrame(
          animate
        );

    }
  );

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
    .textContent = "";


  document
    .getElementById("wordComparison")
    .innerHTML = "";


  document
    .getElementById("score")
    .textContent = "0";


  micStatus.textContent =
    "Tap the microphone to start";


  recordingTimer.textContent =
    "00:00";


  micBtn.classList.remove(
    "recording"
  );


  micIcon.textContent =
    "🎙️";


  clearInterval(
    timerInterval
  );


  isRecording = false;

}


/* =====================================================
   LOAD WHISPER
===================================================== */

async function loadWhisper() {

  /*
    Already loaded?
  */

  if (transcriber) {

    whisperStatus.textContent =
      "Whisper is ready ✓";

    whisperStatus.className =
      "whisperStatus ready";

    return true;

  }


  /*
    Already loading?
  */

  if (whisperLoading) {

    return false;

  }


  whisperLoading = true;


  whisperStatus.textContent =
    "Loading Whisper for the first time...";

  whisperStatus.className =
    "whisperStatus loading";


  console.log(
    "Loading Whisper..."
  );


  try {

    /*
      No WebGPU.

      We deliberately use the normal
      browser/WASM path first because
      it is simpler and more reliable
      for this version.
    */

    transcriber =
      await pipeline(
        "automatic-speech-recognition",
        WHISPER_MODEL
      );


    console.log(
      "Whisper loaded successfully."
    );


    whisperStatus.textContent =
      "Whisper is ready ✓";

    whisperStatus.className =
      "whisperStatus ready";


    whisperLoading = false;


    return true;

  }


  catch (error) {

    console.error(
      "Whisper loading error:",
      error
    );


    whisperStatus.textContent =
      "Whisper failed to load.";

    whisperStatus.className =
      "whisperStatus error";


    micStatus.textContent =
      "Whisper could not load. Check the status above.";


    whisperLoading = false;


    return false;

  }

}


/* =====================================================
   MICROPHONE
===================================================== */

micBtn.addEventListener(
  "click",
  async () => {

    /*
      If already recording,
      stop it.
    */

    if (isRecording) {

      stopRecording();

      return;

    }


    /*
      Otherwise start.
    */

    await startRecording();

  }
);


/* =====================================================
   START RECORDING
===================================================== */

async function startRecording() {

  try {

    /*
      Load Whisper ONLY when the user
      actually presses the microphone.
    */

    if (!transcriber) {

      micStatus.textContent =
        "Preparing Whisper...";


      const ready =
        await loadWhisper();


      if (!ready) {

        return;

      }

    }


    /*
      Check microphone support.
    */

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {

      throw new Error(
        "Microphone is not supported by this browser."
      );

    }


    /*
      Ask for microphone.
    */

    const stream =
      await navigator.mediaDevices
        .getUserMedia({
          audio: true
        });


    audioChunks = [];


    /*
      Choose a supported recording format.
    */

    let options = {};


    if (
      MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus"
      )
    ) {

      options.mimeType =
        "audio/webm;codecs=opus";

    }

    else if (
      MediaRecorder.isTypeSupported(
        "audio/webm"
      )
    ) {

      options.mimeType =
        "audio/webm";

    }


    mediaRecorder =
      Object.keys(options).length > 0
        ? new MediaRecorder(
            stream,
            options
          )
        : new MediaRecorder(
            stream
          );


    mediaRecorder.ondataavailable =
      event => {

        if (
          event.data &&
          event.data.size > 0
        ) {

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
              type:
                mediaRecorder.mimeType
            }
          );


        /*
          Turn microphone off.
        */

        stream
          .getTracks()
          .forEach(
            track => track.stop()
          );


        clearInterval(
          timerInterval
        );


        isRecording = false;

        updateRecordingUI();


        /*
          Send recording to Whisper.
        */

        await processRecording(
          audioBlob
        );

      };


    /*
      Start recording.
    */

    mediaRecorder.start();


    isRecording = true;


    recordingStartTime =
      Date.now();


    updateRecordingUI();


    startTimer();


    console.log(
      "Recording started."
    );

  }


  catch (error) {

    console.error(
      "Microphone error:",
      error
    );


    micStatus.textContent =
      "Microphone permission was denied or unavailable.";

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


  clearInterval(
    timerInterval
  );


  timerInterval =
    setInterval(
      () => {

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
          ).padStart(
            2,
            "0"
          );


        const seconds =
          String(
            elapsed % 60
          ).padStart(
            2,
            "0"
          );


        recordingTimer.textContent =
          `${minutes}:${seconds}`;

      },
      1000
    );

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
      Convert recording to
      16 kHz mono audio.
    */

    const audio =
      await decodeAudio(
        blob
      );


    console.log(
      "Decoded audio samples:",
      audio.length
    );


    /*
      Send audio to Whisper.
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
      Show transcript.
    */

    showTranscript(
      transcript
    );


    /*
      Compare spoken words
      with target words.
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


  try {

    const audioBuffer =
      await audioContext.decodeAudioData(
        arrayBuffer
      );


    /*
      Whisper expects 16 kHz audio.

      Convert the browser recording
      into mono 16 kHz.
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
      await offlineContext
        .startRendering();


    return rendered.getChannelData(0);

  }


  finally {

    await audioContext.close();

  }

}


/* =====================================================
   SHOW TRANSCRIPT
===================================================== */

function showTranscript(
  transcript
) {

  document
    .getElementById(
      "transcriptSection"
    )
    .classList.remove(
      "hidden"
    );


  document
    .getElementById(
      "transcriptBox"
    )
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
    .replace(
      /[^\w']/g,
      ""
    )
    .trim();

}


/* =====================================================
   SPLIT WORDS
===================================================== */

function splitWords(
  text
) {

  if (!text) {
    return [];
  }


  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean);

}


/* =====================================================
   WORD ALIGNMENT
===================================================== */

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

          dp[i - 1][j] + 1,

          dp[i][j - 1] + 1,

          dp[i - 1][j - 1]
            +
          substitutionCost

        );

    }

  }


  const alignment = [];


  let i =
    targetWords.length;

  let j =
    spokenWords.length;


  while (
    i > 0 ||
    j > 0
  ) {

    /*
      Exact match.
    */

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


    /*
      Wrong word.
    */

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


    /*
      Missing target word.
    */

    if (
      i > 0 &&
      dp[i][j] ===
      dp[i - 1][j] + 1
    ) {

      alignment.unshift({

        type: "missing",

        target:
          targetWords[i - 1],

        spoken: null

      });


      i--;

      continue;

    }


    /*
      Extra spoken word.
    */

    if (
      j > 0 &&
      dp[i][j] ===
      dp[i][j - 1] + 1
    ) {

      alignment.unshift({

        type: "extra",

        target: null,

        spoken:
          spokenWords[j - 1]

      });


      j--;

      continue;

    }


    /*
      Safety fallback.
    */

    if (i > 0) {

      alignment.unshift({

        type: "missing",

        target:
          targetWords[i - 1],

        spoken: null

      });


      i--;

    }

    else {

      alignment.unshift({

        type: "extra",

        target: null,

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


  let matched = 0;


  for (
    const item of alignment
  ) {

    if (
      item.type === "match"
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


  container.innerHTML =
    "";


  for (
    const item of alignment
  ) {

    /*
      Correct word.
    */

    if (
      item.type === "match"
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
      Wrong or missing word.
    */

    else if (
      item.type === "wrong" ||
      item.type === "missing"
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
      Extra spoken word.
    */

    else if (
      item.type === "extra"
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
    word.toLowerCase();


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

function leavePractice() {

  if (isRecording) {

    stopRecording();

  }


  if (scrollAnimationId) {

    cancelAnimationFrame(
      scrollAnimationId
    );

    scrollAnimationId = null;

  }


  showScreen(
    "levelScreen"
  );

}


/* =====================================================
   DEBUG MESSAGE
===================================================== */

console.log(
  "SpeakUp app loaded successfully."
);
