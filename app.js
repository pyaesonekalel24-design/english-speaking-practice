import {
  pipeline
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";



/* =====================================================
   SPEAKUP
   REAL WHISPER VERSION
===================================================== */


/* =====================================================
   SETTINGS
===================================================== */

const WHISPER_MODEL =
  "Xenova/whisper-tiny.en";


let whisper = null;

let whisperLoading = false;

let mediaRecorder = null;

let audioChunks = [];

let isRecording = false;

let currentPassage = "";

let currentLevel = "easy";

let timerInterval = null;

let recordingStartTime = null;

let scrollTimer = null;



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
   SCREEN
===================================================== */

window.showScreen = function(id) {

  document
    .querySelectorAll(".screen")
    .forEach(screen => {

      screen.classList.remove("active");

    });


  document
    .getElementById(id)
    .classList.add("active");

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
        .toUpperCase()
      +
      currentLevel.slice(1);


  resetResults();


  showScreen(
    "practiceScreen"
  );


  /*
    Start scrolling after the
    practice screen becomes visible.
  */

  setTimeout(() => {

    startPassageScroll();

  }, 500);


  /*
    Load Whisper.
  */

  loadWhisper();

}



/* =====================================================
   REAL JAVASCRIPT SCROLL
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

    console.error(
      "Passage elements not found."
    );

    return;

  }


  /*
    Stop previous scrolling.
  */

  if (scrollTimer) {

    clearInterval(
      scrollTimer
    );

  }


  /*
    Start from below the viewport.
  */

  text.style.transform =
    `translateY(${viewport.clientHeight}px)`;


  /*
    Force layout calculation.
  */

  void text.offsetHeight;


  /*
    Measure text.
  */

  const textHeight =
    text.scrollHeight;


  const viewportHeight =
    viewport.clientHeight;


  /*
    Total distance.

    Example:

    viewport = 250px
    text = 500px

    It travels 750px.
  */

  const distance =
    viewportHeight +
    textHeight;


  /*
    Slow enough to actually read.

    More words = more time.
  */

  const wordCount =
    currentPassage
      .trim()
      .split(/\s+/)
      .length;


  const duration =
    Math.max(
      12,
      wordCount * 0.55
    );


  const startTime =
    performance.now();


  /*
    Smooth animation using requestAnimationFrame.
  */

  function move(now) {

    const elapsed =
      now - startTime;


    const progress =
      Math.min(
        elapsed /
        (duration * 1000),
        1
      );


    /*
      Smooth linear movement.
    */

    const position =
      viewportHeight -
      (
        distance *
        progress
      );


    text.style.transform =
      `translateY(${position}px)`;


    if (progress < 1) {

      scrollTimer =
        requestAnimationFrame(
          move
        );

    }

    else {

      /*
        Finished.

        It stays here.
        NO LOOP.
      */

      text.style.transform =
        `translateY(-${textHeight}px)`;

    }

  }


  scrollTimer =
    requestAnimationFrame(
      move
    );

}



/* =====================================================
   LOAD WHISPER
===================================================== */

async function loadWhisper() {

  const status =
    document.getElementById(
      "whisperStatus"
    );


  if (!status) {

    return;

  }


  if (whisper) {

    status.textContent =
      "Whisper is ready ✓";

    status.className =
      "whisperStatus ready";

    return;

  }


  if (whisperLoading) {

    return;

  }


  whisperLoading =
    true;


  status.textContent =
    "Downloading Whisper... first time only";


  status.className =
    "whisperStatus loading";


  console.log(
    "SpeakUp: loading Whisper..."
  );


  try {

    /*
      IMPORTANT:

      We deliberately DO NOT force WebGPU
      for this first working version.

      Let Transformers.js use its
      normal browser/WASM backend.

      Once this works, we can optimize
      with WebGPU.
    */

    whisper =
      await pipeline(
        "automatic-speech-recognition",
        WHISPER_MODEL
      );


    console.log(
      "SpeakUp: Whisper loaded!",
      whisper
    );


    status.textContent =
      "Whisper is ready ✓";


    status.className =
      "whisperStatus ready";


    whisperLoading =
      false;

  }


  catch (error) {

    console.error(
      "SPEAKUP WHISPER ERROR:",
      error
    );


    status.textContent =
      "Whisper failed to load ❌";


    status.className =
      "whisperStatus error";


    whisperLoading =
      false;


    /*
      Show useful debugging information.
    */

    const message =
      document.createElement(
        "div"
      );


    message.style.marginTop =
      "8px";


    message.style.fontSize =
      "12px";


    message.style.color =
      "#dc2626";


    message.textContent =
      error.message ||
      "Unknown Whisper error";


    status.appendChild(
      message
    );

  }

}



/* =====================================================
   MICROPHONE
===================================================== */

document
  .getElementById("micBtn")
  .addEventListener(
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

  /*
    Whisper MUST be loaded.
  */

  if (!whisper) {

    const status =
      document.getElementById(
        "whisperStatus"
      );


    status.textContent =
      "Whisper is still loading...";


    await loadWhisper();


    if (!whisper) {

      document
        .getElementById(
          "micStatus"
        )
        .textContent =
          "Whisper isn't ready yet.";

      return;

    }

  }


  try {

    const stream =
      await navigator
        .mediaDevices
        .getUserMedia({
          audio: true
        });


    audioChunks = [];


    /*
      Pick a format the browser
      actually supports.
    */

    let mimeType =
      "";


    if (
      MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus"
      )
    ) {

      mimeType =
        "audio/webm;codecs=opus";

    }

    else if (
      MediaRecorder.isTypeSupported(
        "audio/webm"
      )
    ) {

      mimeType =
        "audio/webm";

    }


    mediaRecorder =
      mimeType
        ? new MediaRecorder(
            stream,
            { mimeType }
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

        const blob =
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


        isRecording =
          false;


        updateMicUI();


        console.log(
          "SpeakUp recording:",
          blob.type,
          blob.size
        );


        await transcribeRecording(
          blob
        );

      };


    mediaRecorder.start();


    isRecording =
      true;


    recordingStartTime =
      Date.now();


    updateMicUI();


    startTimer();

  }


  catch (error) {

    console.error(
      "MICROPHONE ERROR:",
      error
    );


    document
      .getElementById(
        "micStatus"
      )
      .textContent =
        "Microphone permission was denied.";

  }

}



/* =====================================================
   STOP
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


  isRecording =
    false;


  updateMicUI();

}



/* =====================================================
   MICROPHONE UI
===================================================== */

function updateMicUI() {

  const button =
    document.getElementById(
      "micBtn"
    );


  const icon =
    document.getElementById(
      "micIcon"
    );


  const status =
    document.getElementById(
      "micStatus"
    );


  if (isRecording) {

    button.classList.add(
      "recording"
    );


    icon.textContent =
      "⏹️";


    status.textContent =
      "Recording... tap to stop";

  }

  else {

    button.classList.remove(
      "recording"
    );


    icon.textContent =
      "🎙️";

  }

}



/* =====================================================
   TIMER
===================================================== */

function startTimer() {

  const timer =
    document.getElementById(
      "recordingTimer"
    );


  timer.textContent =
    "00:00";


  timerInterval =
    setInterval(() => {

      const seconds =
        Math.floor(
          (
            Date.now() -
            recordingStartTime
          ) / 1000
        );


      const minutes =
        Math.floor(
          seconds / 60
        );


      const remaining =
        seconds % 60;


      timer.textContent =
        `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;

    }, 1000);

}



/* =====================================================
   TRANSCRIBE
===================================================== */

async function transcribeRecording(
  blob
) {

  const status =
    document.getElementById(
      "whisperStatus"
    );


  const micStatus =
    document.getElementById(
      "micStatus"
    );


  status.textContent =
    "Whisper is listening to your recording...";


  status.className =
    "whisperStatus loading";


  micStatus.textContent =
    "Transcribing...";



  try {

    /*
      Decode microphone audio.
    */

    const audio =
      await decodeAudio(
        blob
      );


    console.log(
      "Audio samples:",
      audio.length
    );


    console.log(
      "Running Whisper..."
    );


    /*
      ACTUAL WHISPER CALL
    */

    const result =
      await whisper(
        audio,
        {
          language: "english",
          task: "transcribe"
        }
      );


    console.log(
      "WHISPER RESULT:",
      result
    );


    const transcript =
      (
        result.text ||
        ""
      ).trim();


    /*
      SHOW RESULT
    */

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
        "Whisper did not detect speech.";


    /*
      COMPARE
    */

    compareSpeech(
      currentPassage,
      transcript
    );


    status.textContent =
      "Whisper finished ✓";


    status.className =
      "whisperStatus ready";


    micStatus.textContent =
      "Done.";

  }


  catch (error) {

    console.error(
      "TRANSCRIPTION ERROR:",
      error
    );


    status.textContent =
      "Whisper transcription failed ❌";


    status.className =
      "whisperStatus error";


    micStatus.textContent =
      "Something went wrong during transcription.";

  }

}



/* =====================================================
   DECODE AUDIO
===================================================== */

async function decodeAudio(
  blob
) {

  const buffer =
    await blob.arrayBuffer();


  const audioContext =
    new AudioContext();


  const decoded =
    await audioContext
      .decodeAudioData(
        buffer
      );


  /*
    Whisper needs 16kHz mono.
  */

  const targetRate =
    16000;


  const length =
    Math.ceil(
      decoded.duration *
      targetRate
    );


  const offline =
    new OfflineAudioContext(
      1,
      length,
      targetRate
    );


  const source =
    offline.createBufferSource();


  source.buffer =
    decoded;


  source.connect(
    offline.destination
  );


  source.start();


  const rendered =
    await offline.startRendering();


  const samples =
    rendered.getChannelData(0);


  await audioContext.close();


  return samples;

}



/* =====================================================
   WORD HELPERS
===================================================== */

function cleanWord(word) {

  return word
    .toLowerCase()
    .replace(/[^\w']/g, "");

}


function getWords(text) {

  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean);

}



/* =====================================================
   ALIGNMENT
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
    Array
      .from(
        { length: rows },
        () =>
          Array(cols).fill(0)
      );


  for (
    let i = 0;
    i < rows;
    i++
  ) {

    dp[i][0] =
      i;

  }


  for (
    let j = 0;
    j < cols;
    j++
  ) {

    dp[0][j] =
      j;

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

      const same =
        cleanWord(
          targetWords[i - 1]
        )
        ===
        cleanWord(
          spokenWords[j - 1]
        );


      const cost =
        same
          ? 0
          : 1;


      dp[i][j] =
        Math.min(

          dp[i - 1][j] + 1,

          dp[i][j - 1] + 1,

          dp[i - 1][j - 1] +
          cost

        );

    }

  }


  const result = [];


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
      cleanWord(
        targetWords[i - 1]
      )
      ===
      cleanWord(
        spokenWords[j - 1]
      )
    ) {

      result.unshift({

        type: "correct",

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
      dp[i][j]
      ===
      dp[i - 1][j - 1] + 1
    ) {

      result.unshift({

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
      dp[i][j]
      ===
      dp[i - 1][j] + 1
    ) {

      result.unshift({

        type: "missing",

        target:
          targetWords[i - 1],

        spoken:
          null

      });


      i--;

      continue;

    }


    result.unshift({

      type: "extra",

      target:
        null,

      spoken:
        spokenWords[j - 1]

    });


    j--;

  }


  return result;

}



/* =====================================================
   COMPARE
===================================================== */

function compareSpeech(
  target,
  spoken
) {

  const targetWords =
    getWords(target);


  const spokenWords =
    getWords(spoken);


  const alignment =
    alignWords(
      targetWords,
      spokenWords
    );


  let correct =
    0;


  for (
    const item of alignment
  ) {

    if (
      item.type ===
      "correct"
    ) {

      correct++;

    }

  }


  const score =
    Math.round(
      (
        correct /
        targetWords.length
      ) * 100
    );


  showScore(
    score
  );


  renderComparison(
    alignment
  );

}



/* =====================================================
   SCORE
===================================================== */

function showScore(score) {

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
      "Good start. Let's work on the missed words.";

  }

  else {

    message =
      "Keep practicing. Every attempt helps.";

  }


  document
    .getElementById(
      "scoreMessage"
    )
    .textContent =
      message;

}



/* =====================================================
   COMPARISON DISPLAY
===================================================== */

function renderComparison(
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

      const span =
        document.createElement(
          "span"
        );


      span.classList.add(
        "word"
      );


      if (
        item.type ===
        "correct"
      ) {

        span.classList.add(
          "correct"
        );


        span.textContent =
          item.target;

      }


      else if (
        item.type ===
        "wrong"
      ) {

        span.classList.add(
          "wrong"
        );


        span.textContent =
          item.target;


        span.title =
          `Whisper heard: ${item.spoken}`;


        span.onclick =
          () => {

            showWordInfo(
              item.target
            );

          };

      }


      else if (
        item.type ===
        "missing"
      ) {

        span.classList.add(
          "wrong"
        );


        span.textContent =
          item.target;


        span.title =
          "Whisper did not hear this word";


        span.onclick =
          () => {

            showWordInfo(
              item.target
            );

          };

      }


      else {

        span.classList.add(
          "extra"
        );


        span.textContent =
          `[${item.spoken}]`;

      }


      container.appendChild(
        span
      );

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
      getSimilarWords(word);


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

  speechSynthesis.cancel();


  const speech =
    new SpeechSynthesisUtterance(
      word
    );


  speech.lang =
    "en-US";


  speech.rate =
    0.72;


  speechSynthesis.speak(
    speech
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
    then repeat it normally.
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
