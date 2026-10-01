/* =====================================================
   SPEAKUP
   ===================================================== */


/* =====================================================
   WHISPER
   ===================================================== */

const WHISPER_MODEL =
  "Xenova/whisper-tiny.en";

let pipelineFunction = null;
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


  if (target) {

    target.classList.add("active");

  }

}


/*
  Keep this available because your HTML
  can call showScreen().
*/

window.showScreen = showScreen;


/* =====================================================
   HOME
===================================================== */

document
  .getElementById("startBtn")
  .addEventListener(
    "click",
    () => {

      showScreen("levelScreen");

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
          "Level selected:",
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
      "No passage list for:",
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
    Whisper is NOT loaded here.

    This is intentional.
  */

  whisperStatus.textContent =
    "Whisper will load when you use the microphone.";

  whisperStatus.className =
    "whisperStatus";


  /*
    Start scrolling after the practice
    screen becomes visible.
  */

  setTimeout(
    () => {

      startPassageScroll();

    },
    300
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

    console.log(
      "Passage elements not found."
    );

    return;

  }


  if (scrollAnimationId) {

    cancelAnimationFrame(
      scrollAnimationId
    );

  }


  text.style.transform =
    "translateY(0px)";


  requestAnimationFrame(
    () => {

      const viewportHeight =
        viewport.clientHeight;

      const textHeight =
        text.scrollHeight;


      const startY =
        viewportHeight;

      const endY =
        -textHeight;


      text.style.transform =
        `translateY(${startY}px)`;


      const wordCount =
        currentPassage
          .trim()
          .split(/\s+/)
          .length;


      const duration =
        Math.max(
          12000,
          wordCount * 500
        );


      const startTime =
        performance.now();


      function animate(
        now
      ) {

        const elapsed =
          now - startTime;


        const progress =
          Math.min(
            elapsed / duration,
            1
          );


        const eased =
          progress *
          (2 - progress);


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

  if (transcriber) {

    whisperStatus.textContent =
      "Whisper is ready ✓";

    whisperStatus.className =
      "whisperStatus ready";

    return true;

  }


  if (whisperLoading) {

    return false;

  }


  whisperLoading = true;


  whisperStatus.textContent =
    "Loading Whisper... first time may take a while.";

  whisperStatus.className =
    "whisperStatus loading";


  try {

    /*
      IMPORTANT:

      Transformers.js is imported HERE,
      not at the top of the file.

      Therefore it cannot break the
      Home or Level screens.
    */

    if (!pipelineFunction) {

      const transformers =
        await import(
          "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1"
        );


      pipelineFunction =
        transformers.pipeline;

    }


    console.log(
      "Transformers.js loaded."
    );


    /*
      Load Whisper.
    */

    transcriber =
      await pipelineFunction(
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
      "WHISPER LOAD ERROR:",
      error
    );


    whisperStatus.textContent =
      "Whisper failed to load.";

    whisperStatus.className =
      "whisperStatus error";


    micStatus.textContent =
      "Whisper could not load.";

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

    if (isRecording) {

      stopRecording();

    }

    else {

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
      Load Whisper only now.
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


    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {

      throw new Error(
        "Microphone is not supported."
      );

    }


    const stream =
      await navigator.mediaDevices
        .getUserMedia({
          audio: true
        });


    audioChunks = [];


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
      Object.keys(options).length
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


    console.log(
      "Recording started."
    );

  }


  catch (error) {

    console.error(
      "MICROPHONE ERROR:",
      error
    );


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

    const audio =
      await decodeAudio(
        blob
      );


    console.log(
      "Audio decoded:",
      audio.length,
      "samples"
    );


    const result =
      await transcriber(
        audio,
        {
          language: "english",
          task: "transcribe"
        }
      );


    console.log(
      "Whisper result:",
      result
    );


    const transcript =
      result.text
        .trim();


    showTranscript(
      transcript
    );


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
      "TRANSCRIPTION ERROR:",
      error
    );


    whisperStatus.textContent =
      "Transcription failed.";

    whisperStatus.className =
      "whisperStatus error";


    micStatus.textContent =
      "Something went wrong processing the recording.";

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
      await audioContext
        .decodeAudioData(
          arrayBuffer
        );


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
      offlineContext
        .createBufferSource();


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
   WORD HELPERS
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


      const cost =
        target === spoken
          ? 0
          : 1;


      dp[i][j] =
        Math.min(

          dp[i - 1][j] + 1,

          dp[i][j - 1] + 1,

          dp[i - 1][j - 1] + cost

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

        spoken: null

      });


      i--;

      continue;

    }


    if (
      j > 0
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


  alignment.forEach(
    item => {

      if (
        item.type === "match"
      ) {

        matched++;

      }

    }
  );


  const score =
    targetWords.length
      ? Math.round(
          (
            matched /
            targetWords.length
          ) * 100
        )
      : 0;


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
   WORD COMPARISON
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


  alignment.forEach(
    item => {

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


        container.appendChild(
          span
        );

      }

    }
  );


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


  document
    .getElementById(
      "selectedWord"
    )
    .textContent =
    word;


  document
    .getElementById(
      "similarWords"
    )
    .innerHTML =
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
   SIMILAR SOUNDS
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

window.leavePractice =
  function() {

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

  };


/* =====================================================
   DONE
===================================================== */

console.log(
  "SpeakUp loaded successfully."
);
