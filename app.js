/* =========================================================
   SPEAKUP ENGLISH
   COMPLETE APP.JS
========================================================= */


/* =========================================================
   SCREEN ELEMENTS
========================================================= */

const homeScreen =
  document.getElementById("homeScreen");

const levelScreen =
  document.getElementById("levelScreen");

const practiceScreen =
  document.getElementById("practiceScreen");


/* =========================================================
   BUTTONS
========================================================= */

const startButton =
  document.getElementById("startButton");

const backHomeButton =
  document.getElementById("backHomeButton");

const homeButton =
  document.getElementById("homeButton");

const levelButtons =
  document.querySelectorAll(".level-button");


/* =========================================================
   PRACTICE ELEMENTS
========================================================= */

const currentLevel =
  document.getElementById("currentLevel");

const paragraphText =
  document.getElementById("paragraphText");

const micButton =
  document.getElementById("micButton");

const micStatus =
  document.getElementById("micStatus");

const transcript =
  document.getElementById("transcript");

const resultCard =
  document.getElementById("resultCard");

const resultSummary =
  document.getElementById("resultSummary");

const wordResults =
  document.getElementById("wordResults");

const wordInfo =
  document.getElementById("wordInfo");

const selectedWord =
  document.getElementById("selectedWord");

const closeWordInfo =
  document.getElementById("closeWordInfo");

const pronounceButton =
  document.getElementById("pronounceButton");

const similarWords =
  document.getElementById("similarWords");


/* =========================================================
   PARAGRAPHS
========================================================= */

const paragraphs = {

  easy: [

    {
      text:
        "Every morning I wake up early and drink a glass of water. Then I get ready for work and eat a simple breakfast."
    },

    {
      text:
        "Last night I stayed at home and watched a movie. The weather was quiet and cool, so I enjoyed a relaxing evening."
    },

    {
      text:
        "My friend called me this morning. We talked about our plans and decided to meet for lunch later today."
    }

  ],


  medium: [

    {
      text:
        "Last night I went to the market after work. I wanted to buy some vegetables, but I also found a small restaurant that looked very interesting."
    },

    {
      text:
        "Learning English takes time and regular practice. The more often you listen and speak, the easier it becomes to understand natural conversations."
    },

    {
      text:
        "When I have free time, I usually watch videos in English. Sometimes I understand everything, but sometimes I need to listen again."
    }

  ],


  intermediate: [

    {
      text:
        "Improving your speaking ability requires more than memorizing vocabulary. You need to listen carefully, notice how words are pronounced, and practice using them in real situations."
    },

    {
      text:
        "Technology has changed the way people learn languages. Today, students can practice speaking with applications that provide immediate feedback and help them identify areas that need improvement."
    },

    {
      text:
        "Although learning a new language can sometimes feel frustrating, consistent practice can gradually make difficult words and expressions feel much more natural."
    }

  ]

};


/* =========================================================
   CURRENT PRACTICE STATE
========================================================= */

let currentLevelName =
  "easy";

let currentParagraph =
  null;

let recognition =
  null;

let isListening =
  false;

let finalTranscript =
  "";

let interimTranscript =
  "";

let finalizedResultIndexes =
  new Set();

let selectedWordValue =
  "";


/* =========================================================
   SCREEN SWITCHING
========================================================= */

function showScreen(screen) {

  homeScreen.classList.remove("active");

  levelScreen.classList.remove("active");

  practiceScreen.classList.remove("active");

  screen.classList.add("active");
}


/* =========================================================
   HOME -> LEVEL
========================================================= */

if (startButton) {

  startButton.addEventListener(
    "click",
    function() {

      showScreen(levelScreen);

    }
  );

}


/* =========================================================
   LEVEL SELECTION
========================================================= */

levelButtons.forEach(
  function(button) {

    button.addEventListener(
      "click",
      function() {

        const level =
          button.dataset.level;

        startPractice(level);

      }
    );

  }
);


/* =========================================================
   BACK TO HOME FROM LEVEL SCREEN
========================================================= */

if (backHomeButton) {

  backHomeButton.addEventListener(
    "click",
    function() {

      showScreen(homeScreen);

    }
  );

}


/* =========================================================
   HOME BUTTON DURING PRACTICE
========================================================= */

if (homeButton) {

  homeButton.addEventListener(
    "click",
    function() {

      stopRecognition();

      showScreen(homeScreen);

    }
  );

}


/* =========================================================
   START A PRACTICE
========================================================= */

function startPractice(level) {

  currentLevelName =
    level;


  currentLevel.textContent =
    level.charAt(0).toUpperCase() +
    level.slice(1);


  const availableParagraphs =
    paragraphs[level];


  const randomIndex =
    Math.floor(
      Math.random() *
      availableParagraphs.length
    );


  currentParagraph =
    availableParagraphs[randomIndex];


  paragraphText.textContent =
    currentParagraph.text;


  transcript.textContent =
    "Your speech will appear here...";


  micStatus.textContent =
    "Tap the microphone and start reading.";


  resultCard.classList.add(
    "hidden"
  );


  wordInfo.classList.add(
    "hidden"
  );


  wordResults.innerHTML =
    "";


  finalTranscript =
    "";

  interimTranscript =
    "";

  finalizedResultIndexes.clear();


  showScreen(
    practiceScreen
  );
}


/* =========================================================
   SPEECH RECOGNITION SETUP
========================================================= */

function setupSpeechRecognition() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {

    micStatus.textContent =
      "Speech recognition is not supported here. Please use Google Chrome.";

    micButton.disabled =
      true;

    return;

  }


  recognition =
    new SpeechRecognition();


  /*
    English recognition
  */

  recognition.lang =
    "en-US";


  /*
    Keep listening while the user speaks.

    IMPORTANT:
    We do NOT automatically restart it.
  */

  recognition.continuous =
    true;


  /*
    We need interim results so the user
    can see what the microphone is hearing.
  */

  recognition.interimResults =
    true;


  recognition.maxAlternatives =
    1;


  /* =======================================================
     MICROPHONE STARTED
  ======================================================= */

  recognition.onstart =
    function() {

      isListening =
        true;


      micButton.classList.add(
        "listening"
      );


      micStatus.textContent =
        "Listening... Read the passage aloud.";


      micButton.setAttribute(
        "aria-label",
        "Stop microphone"
      );

    };


  /* =======================================================
     SPEECH RESULT
  ======================================================= */

  recognition.onresult =
    function(event) {

      let newInterim =
        "";


      /*
        SpeechRecognition keeps a list of results.

        We only permanently save a result ONCE.

        This is the important part that prevents
        repeated text such as:

        "last night last night last night"
      */

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
        */

        if (result.isFinal) {

          /*
            Make absolutely sure we don't
            permanently add the same result twice.
          */

          if (
            !finalizedResultIndexes.has(i)
          ) {

            finalTranscript =
              (
                finalTranscript +
                " " +
                spokenText
              ).trim();


            finalizedResultIndexes.add(
              i
            );

          }

        }


        /*
          INTERIM RESULT

          Temporary only.
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
        What the user sees while speaking.
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
        Live word comparison.
      */

      if (
        displayText.length > 0
      ) {

        compareSpeech(
          displayText,
          false
        );

      }

    };


  /* =======================================================
     MICROPHONE STOPPED
  ======================================================= */

  recognition.onend =
    function() {

      isListening =
        false;


      micButton.classList.remove(
        "listening"
      );


      micButton.setAttribute(
        "aria-label",
        "Start microphone"
      );


      /*
        VERY IMPORTANT:

        There is NO:

        recognition.start()

        here.

        Therefore the microphone will NEVER
        automatically restart.
      */


      if (
        finalTranscript.trim()
      ) {

        micStatus.textContent =
          "Finished. Your final score is below.";

        compareSpeech(
          finalTranscript.trim(),
          true
        );

      }

      else {

        micStatus.textContent =
          "Microphone stopped. Tap the microphone to try again.";

      }

    };


  /* =======================================================
     MICROPHONE ERROR
  ======================================================= */

  recognition.onerror =
    function(event) {

      console.log(
        "Speech recognition error:",
        event.error
      );


      isListening =
        false;


      micButton.classList.remove(
        "listening"
      );


      if (
        event.error ===
        "not-allowed"
      ) {

        micStatus.textContent =
          "Microphone permission was denied. Please allow microphone access.";

      }


      else if (
        event.error ===
        "audio-capture"
      ) {

        micStatus.textContent =
          "The browser could not access your microphone.";

      }


      else if (
        event.error ===
        "no-speech"
      ) {

        micStatus.textContent =
          "No speech was detected. Tap the microphone and try again.";

      }


      else {

        micStatus.textContent =
          "Microphone error. Please try again.";

      }

    };

}


/* =========================================================
   START MICROPHONE
========================================================= */

function startRecognition() {

  if (!recognition) {

    setupSpeechRecognition();

  }


  if (!recognition) {
    return;
  }


  if (isListening) {
    return;
  }


  /*
    New attempt = new transcript.
  */

  finalTranscript =
    "";

  interimTranscript =
    "";


  finalizedResultIndexes.clear();


  transcript.textContent =
    "Listening...";


  resultCard.classList.add(
    "hidden"
  );


  wordInfo.classList.add(
    "hidden"
  );


  try {

    recognition.start();

  }

  catch (error) {

    console.log(
      "Could not start recognition:",
      error
    );

  }

}


/* =========================================================
   STOP MICROPHONE
========================================================= */

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

    console.log(
      "Could not stop recognition:",
      error
    );

  }

}


/* =========================================================
   MICROPHONE BUTTON
========================================================= */

if (micButton) {

  micButton.addEventListener(
    "click",
    function() {

      /*
        ONE CLICK = ON

        SECOND CLICK = OFF

        Nothing automatically restarts it.
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


/* =========================================================
   NORMALIZE WORDS
========================================================= */

function getWords(text) {

  return text
    .toLowerCase()
    .replace(
      /[.,!?;:"'()[\]{}]/g,
      ""
    )
    .split(/\s+/)
    .filter(Boolean);

}


/* =========================================================
   WORD SIMILARITY
========================================================= */

function wordsAreSimilar(
  target,
  spoken
) {

  target =
    target.toLowerCase();

  spoken =
    spoken.toLowerCase();


  /*
    Exact match.
  */

  if (
    target === spoken
  ) {

    return true;

  }


  /*
    Allow a very small recognition
    difference for longer words.
  */

  if (
    target.length >= 5 &&
    spoken.length >= 4
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


/* =========================================================
   LEVENSHTEIN DISTANCE
========================================================= */

function levenshteinDistance(
  a,
  b
) {

  const matrix =
    [];


  for (
    let i = 0;
    i <= b.length;
    i++
  ) {

    matrix[i] =
      [i];

  }


  for (
    let j = 0;
    j <= a.length;
    j++
  ) {

    matrix[0][j] =
      j;

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


/* =========================================================
   COMPARE SPEECH
========================================================= */

function compareSpeech(
  spokenText,
  showFinalScore
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


  let matched =
    0;


  wordResults.innerHTML =
    "";


  /*
    Compare the expected paragraph
    against what the microphone heard.
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


      wordElement.className =
        "word";


      wordElement.textContent =
        targetWord;


      /*
        Correct word.
      */

      if (
        spokenWord &&
        wordsAreSimilar(
          targetWord,
          spokenWord
        )
      ) {

        matched++;

      }


      /*
        Wrong / missing word.
      */

      else {

        wordElement.classList.add(
          "wrong"
        );

      }


      /*
        Clickable word.
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

    20 expected words
    13 correct

    = 65/100
  */

  let score =
    0;


  if (
    targetWords.length > 0
  ) {

    score =
      Math.round(
        (
          matched /
          targetWords.length
        ) *
        100
      );

  }


  resultSummary.textContent =
    `${score}/100 — ${matched} of ${targetWords.length} words matched. Red words need more practice.`;


  resultCard.classList.remove(
    "hidden"
  );


  /*
    Final score only gets shown
    after the microphone is stopped.
  */

  if (
    showFinalScore
  ) {

    showFinalScoreDisplay(
      score
    );

  }

}


/* =========================================================
   SCORE DISPLAY
========================================================= */

function showFinalScoreDisplay(
  score
) {

  let scoreDisplay =
    document.getElementById(
      "scoreDisplay"
    );


  if (!scoreDisplay) {

    scoreDisplay =
      document.createElement(
        "div"
      );


    scoreDisplay.id =
      "scoreDisplay";


    scoreDisplay.style.margin =
      "15px 0";


    scoreDisplay.style.padding =
      "14px";


    scoreDisplay.style.borderRadius =
      "12px";


    scoreDisplay.style.textAlign =
      "center";


    scoreDisplay.style.fontSize =
      "26px";


    scoreDisplay.style.fontWeight =
      "bold";


    resultCard.insertBefore(
      scoreDisplay,
      wordResults
    );

  }


  scoreDisplay.textContent =
    `Score: ${score}/100`;

}


/* =========================================================
   WORD INFORMATION
========================================================= */

function showWordInfo(
  word
) {

  selectedWordValue =
    word;


  /*
    IMPORTANT:

    Don't replace the entire wordInfo
    element with text.

    Your HTML contains buttons and
    other elements inside it.
  */

  selectedWord.textContent =
    word;


  /*
    Give a few simple same-sound
    examples for now.

    This is NOT yet a real dictionary/
    pronunciation AI system.

    We'll upgrade this later.
  */

  const examples =
    getSimilarSoundExamples(
      word
    );


  similarWords.textContent =
    examples;


  wordInfo.classList.remove(
    "hidden"
  );

}


/* =========================================================
   CLOSE WORD INFORMATION
========================================================= */

if (closeWordInfo) {

  closeWordInfo.addEventListener(
    "click",
    function() {

      wordInfo.classList.add(
        "hidden"
      );

    }
  );

}


/* =========================================================
   TEXT-TO-SPEECH PRONUNCIATION
========================================================= */

if (pronounceButton) {

  pronounceButton.addEventListener(
    "click",
    function() {

      if (
        !selectedWordValue
      ) {

        return;

      }


      /*
        Use the browser's built-in
        English voice.

        This gives us a working
        pronunciation button without
        needing a paid API yet.
      */

      if (
        "speechSynthesis" in window
      ) {

        window.speechSynthesis.cancel();


        const utterance =
          new SpeechSynthesisUtterance(
            selectedWordValue
          );


        utterance.lang =
          "en-US";


        utterance.rate =
          0.75;


        window.speechSynthesis.speak(
          utterance
        );

      }

    }
  );

}


/* =========================================================
   SIMPLE SOUND EXAMPLES
========================================================= */

function getSimilarSoundExamples(
  word
) {

  const lower =
    word.toLowerCase();


  const examples = {

    bee:
      "be, sea, see",

    be:
      "bee, sea, see",

    see:
      "sea, C, see",

    sea:
      "see, C",

    tree:
      "three",

    three:
      "tree",

    right:
      "write, rite",

    write:
      "right, rite",

    two:
      "to, too",

    to:
      "two, too",

    too:
      "two, to",

    hear:
      "here",

    here:
      "hear",

    night:
      "knight",

    knight:
      "night"

  };


  return (
    examples[lower] ||
    "Pronunciation examples will be added here."
  );

}


/* =========================================================
   INITIALIZE
========================================================= */

setupSpeechRecognition();
