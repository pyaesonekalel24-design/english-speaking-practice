/* =====================================================
   ENGLISH SPEAKING PRACTICE
   SCRIPT.JS
===================================================== */

let currentParagraph = null;

let recognition = null;
let isListening = false;

let finalTranscript = "";
let interimTranscript = "";

let selectedWord = "";


/* =====================================================
   GET HTML ELEMENTS
===================================================== */

const micButton =
  document.getElementById("micButton");

const micStatus =
  document.getElementById("micStatus");

const transcript =
  document.getElementById("transcript");

const wordResults =
  document.getElementById("wordResults");

const resultCard =
  document.getElementById("resultCard");

const resultSummary =
  document.getElementById("resultSummary");

const paragraphText =
  document.getElementById("paragraphText");


/* =====================================================
   SPEECH RECOGNITION SETUP
===================================================== */

function setupSpeechRecognition() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {

    micStatus.textContent =
      "Speech recognition is not supported in this browser. Try Chrome.";

    micButton.disabled = true;

    return;
  }

  recognition =
    new SpeechRecognition();

  recognition.lang = "en-US";

  recognition.continuous = true;

  recognition.interimResults = true;

  recognition.maxAlternatives = 1;


  /* ---------------------------------------------------
     WHEN MICROPHONE STARTS
  --------------------------------------------------- */

  recognition.onstart = function() {

    isListening = true;

    micButton.classList.add("listening");

    micStatus.textContent =
      "Listening... Read the passage aloud.";
  };


  /* ---------------------------------------------------
     WHEN SPEECH IS RECEIVED
  --------------------------------------------------- */

  recognition.onresult = function(event) {

    let newInterim = "";


    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {

      const result =
        event.results[i];

      const spokenText =
        result[0].transcript.trim();


      if (!spokenText) {
        continue;
      }


      /*
        FINAL RESULT

        Only final results are permanently stored.
      */

      if (result.isFinal) {

        finalTranscript =
          (
            finalTranscript +
            " " +
            spokenText
          ).trim();

      }


      /*
        INTERIM RESULT

        This is temporary speech.

        IMPORTANT:
        We do NOT add this permanently.

        This prevents:

        "last night last night last night"

        from appearing because the browser
        repeatedly updates its temporary result.
      */

      else {

        newInterim =
          (
            newInterim +
            " " +
            spokenText
          ).trim();
      }
    }


    interimTranscript =
      newInterim;


    /*
      Display both:

      permanent final speech
      +
      temporary speech
    */

    const displayText =
      (
        finalTranscript +
        " " +
        interimTranscript
      ).trim();


    transcript.textContent =
      displayText ||
      "Listening...";


    /*
      Show live comparison while speaking.
      The actual final score is calculated
      when the user stops.
    */

    if (displayText.length > 0) {

      compareSpeech(
        displayText,
        false
      );
    }
  };


  /* ---------------------------------------------------
     MICROPHONE ENDS
  --------------------------------------------------- */

  recognition.onend = function() {

    isListening = false;

    micButton.classList.remove(
      "listening"
    );


    /*
      IMPORTANT:

      We DO NOT call recognition.start()
      here.

      Therefore the microphone NEVER
      automatically turns itself back on.
    */

    micStatus.textContent =
      finalTranscript.trim()
        ? "Reading finished. Press Start Speaking to try again."
        : "Microphone stopped. Press Start Speaking to begin.";


    /*
      Calculate the final score.
    */

    if (finalTranscript.trim()) {

      compareSpeech(
        finalTranscript.trim(),
        true
      );
    }
  };


  /* ---------------------------------------------------
     SPEECH RECOGNITION ERROR
  --------------------------------------------------- */

  recognition.onerror = function(event) {

    console.log(
      "Speech recognition error:",
      event.error
    );


    isListening = false;

    micButton.classList.remove(
      "listening"
    );


    if (event.error === "not-allowed") {

      micStatus.textContent =
        "Microphone permission was blocked. Please allow microphone access.";
    }

    else if (event.error === "no-speech") {

      micStatus.textContent =
        "I didn't hear speech. Try speaking a little louder, then press Start Speaking again.";
    }

    else if (event.error === "audio-capture") {

      micStatus.textContent =
        "The browser could not access the microphone. Check your microphone permission.";
    }

    else {

      micStatus.textContent =
        "Speech recognition stopped. Press Start Speaking to try again.";
    }
  };
}


/* =====================================================
   START MICROPHONE
===================================================== */

function startRecognition() {

  if (!recognition) {
    return;
  }


  /*
    Prevent starting twice.
  */

  if (isListening) {
    return;
  }


  /*
    Clear previous attempt.
  */

  finalTranscript = "";

  interimTranscript = "";


  transcript.textContent =
    "Listening...";


  resultCard.classList.add(
    "hidden"
  );


  try {

    recognition.start();

  }

  catch (error) {

    console.log(error);
  }
}


/* =====================================================
   STOP MICROPHONE
===================================================== */

function stopRecognition() {

  if (!recognition) {
    return;
  }


  if (!isListening) {
    return;
  }


  try {

    recognition.stop();

  }

  catch (error) {

    console.log(error);
  }
}


/* =====================================================
   MICROPHONE BUTTON
===================================================== */

if (micButton) {

  micButton.addEventListener(
    "click",
    function() {

      /*
        MANUAL TOGGLE ONLY

        Press once:
        START

        Press again:
        STOP
      */

      if (isListening) {

        stopRecognition();

      }

      else {

        startRecognition();
      }
    }
  );
}


/* =====================================================
   NORMALIZE WORDS
===================================================== */

function getWords(text) {

  return text
    .toLowerCase()
    .replace(/[.,!?;:"'()]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}


/* =====================================================
   WORD SIMILARITY
===================================================== */

function wordsAreSimilar(
  target,
  spoken
) {

  target =
    target.toLowerCase();

  spoken =
    spoken.toLowerCase();


  /*
    Exact match
  */

  if (target === spoken) {

    return true;
  }


  /*
    Small difference tolerance.

    This allows tiny speech-recognition
    variations without immediately
    marking everything wrong.
  */

  if (
    target.length > 4 &&
    spoken.length > 3
  ) {

    const distance =
      levenshteinDistance(
        target,
        spoken
      );

    if (
      distance <= 1
    ) {

      return true;
    }
  }


  return false;
}


/* =====================================================
   LEVENSHTEIN DISTANCE
===================================================== */

function levenshteinDistance(
  a,
  b
) {

  const matrix = [];


  for (
    let i = 0;
    i <= b.length;
    i++
  ) {

    matrix[i] = [i];
  }


  for (
    let j = 0;
    j <= a.length;
    j++
  ) {

    matrix[0][j] = j;
  }


  for (
    let i = 1;
    i <= b.length;
    i++
  ) {

    for (
      let j = 1;
      j <= a.length;
      j++
    ) {

      if (
        b.charAt(i - 1) ===
        a.charAt(j - 1)
      ) {

        matrix[i][j] =
          matrix[i - 1][j - 1];

      }

      else {

        matrix[i][j] =
          Math.min(

            matrix[i - 1][j] + 1,

            matrix[i][j - 1] + 1,

            matrix[i - 1][j - 1] + 1
          );
      }
    }
  }


  return matrix[b.length][a.length];
}


/* =====================================================
   COMPARE SPEECH
===================================================== */

function compareSpeech(
  spokenText,
  showFinalScore = false
) {

  if (!currentParagraph) {
    return;
  }


  const targetWords =
    getWords(
      currentParagraph.text
    );


  const spokenWords =
    getWords(
      spokenText
    );


  let matched = 0;


  /*
    Clear previous highlighted words.
  */

  wordResults.innerHTML = "";


  /*
    Compare every expected word
    against the corresponding spoken word.
  */

  targetWords.forEach(
    function(
      targetWord,
      index
    ) {

      const spokenWord =
        spokenWords[index];


      const wordElement =
        document.createElement(
          "span"
        );


      wordElement.classList.add(
        "word"
      );


      wordElement.textContent =
        targetWord;


      wordElement.dataset.word =
        targetWord;


      /*
        WRONG WORD
      */

      if (
        !spokenWord ||
        !wordsAreSimilar(
          targetWord,
          spokenWord
        )
      ) {

        wordElement.classList.add(
          "wrong"
        );
      }


      /*
        CORRECT WORD
      */

      else {

        matched++;
      }


      /*
        Clicking a word will later
        open pronunciation information.
      */

      wordElement.addEventListener(
        "click",
        function() {

          showWordInfo(
            targetWord
          );
        }
      );


      wordResults.appendChild(
        wordElement
      );
    }
  );


  /*
    SCORE

    Example:

    10 expected words
    7 matched

    = 70 / 100
  */

  let percentage = 0;


  if (targetWords.length > 0) {

    percentage =
      Math.round(
        (
          matched /
          targetWords.length
        ) * 100
      );
  }


  resultSummary.textContent =
    `${percentage}/100 — ${percentage}% of the words matched the expected reading. Tap a highlighted word to practice it.`;


  resultCard.classList.remove(
    "hidden"
  );


  /*
    Only create the final score
    when the user actually stops.
  */

  if (showFinalScore) {

    updateScoreDisplay(
      percentage
    );
  }
}


/* =====================================================
   SCORE DISPLAY
===================================================== */

function updateScoreDisplay(
  score
) {

  let scoreDisplay =
    document.getElementById(
      "scoreDisplay"
    );


  /*
    Create score element if it
    doesn't already exist.
  */

  if (!scoreDisplay) {

    scoreDisplay =
      document.createElement(
        "div"
      );


    scoreDisplay.id =
      "scoreDisplay";


    scoreDisplay.style.marginTop =
      "12px";


    scoreDisplay.style.padding =
      "14px 18px";


    scoreDisplay.style.borderRadius =
      "12px";


    scoreDisplay.style.background =
      "rgba(255,255,255,0.08)";


    scoreDisplay.style.fontSize =
      "24px";


    scoreDisplay.style.fontWeight =
      "700";


    scoreDisplay.style.textAlign =
      "center";


    resultCard.appendChild(
      scoreDisplay
    );
  }


  scoreDisplay.textContent =
    `Score: ${score}/100`;
}


/* =====================================================
   WORD INFORMATION
===================================================== */

function showWordInfo(
  word
) {

  selectedWord =
    word;


  /*
    If your existing HTML already
    has a word-info section, use it.
  */

  const wordInfo =
    document.getElementById(
      "wordInfo"
    );


  if (wordInfo) {

    wordInfo.textContent =
      `Practice word: ${word}`;
  }

  else {

    console.log(
      "Selected word:",
      word
    );
  }
}


/* =====================================================
   START PRACTICE
===================================================== */

function startPractice(
  paragraph
) {

  /*
    Stop an existing microphone
    session before starting another
    practice.
  */

  if (
    recognition &&
    isListening
  ) {

    stopRecognition();
  }


  finalTranscript = "";

  interimTranscript = "";


  currentParagraph =
    paragraph;


  if (paragraphText) {

    paragraphText.textContent =
      paragraph.text;
  }


  if (transcript) {

    transcript.textContent =
      "Press Start Speaking when you're ready.";
  }


  if (resultCard) {

    resultCard.classList.add(
      "hidden"
    );
  }
}


/* =====================================================
   INITIALIZE
===================================================== */

setupSpeechRecognition();
