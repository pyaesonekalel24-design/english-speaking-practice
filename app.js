/* =====================================================
   SPEAKUP ENGLISH
   Version 2 - microphone + scoring fixes
===================================================== */


/* =====================================================
   PARAGRAPH DATABASE
===================================================== */

const paragraphs = {

  easy: [

    {
      title: "A Morning Walk",
      text:
        "Every morning, I take a short walk around my neighborhood. " +
        "The streets are usually quiet, and the weather is cool. " +
        "I enjoy seeing the trees, the houses, and the people starting their day."
    },

    {
      title: "My Favorite Food",
      text:
        "My favorite food is noodles. " +
        "I like eating them with vegetables and a little spicy sauce. " +
        "Sometimes I cook noodles at home when I am hungry."
    },

    {
      title: "A Busy Day",
      text:
        "Today is a busy day at work. " +
        "I have several things to finish before the afternoon. " +
        "I will take a short break when I finish my most important task."
    }

  ],


  medium: [

    {
      title: "Learning Something New",
      text:
        "Learning something new can feel difficult at first, but practice makes the process easier. " +
        "When we make mistakes, we have an opportunity to understand what we need to improve. " +
        "The most important thing is to continue practicing instead of giving up."
    },

    {
      title: "Technology and Daily Life",
      text:
        "Technology has become an important part of our daily lives. " +
        "We use phones and computers to communicate, study, work, and entertain ourselves. " +
        "Although technology is useful, it is also important to take regular breaks from screens."
    },

    {
      title: "A Visit to the Market",
      text:
        "Last weekend, I visited a local market with my friend. " +
        "There were many people buying fresh vegetables, fruit, and other food. " +
        "We walked around for an hour before stopping at a small restaurant for lunch."
    }

  ],


  intermediate: [

    {
      title: "The Value of Communication",
      text:
        "Effective communication is not simply about speaking clearly. " +
        "It also requires us to listen carefully and understand what another person is trying to express. " +
        "In everyday conversations, small misunderstandings can often be avoided when people take the time to listen before responding."
    },

    {
      title: "Building a Good Habit",
      text:
        "Developing a useful habit usually requires patience and consistency. " +
        "People sometimes expect immediate results and become discouraged when progress seems slow. " +
        "However, small actions repeated every day can eventually produce meaningful changes."
    },

    {
      title: "Working With Other People",
      text:
        "Working with other people can be challenging because everyone has different experiences, opinions, and ways of solving problems. " +
        "A successful team does not necessarily require everyone to think in exactly the same way. " +
        "Instead, people can contribute different ideas while respecting one another."
    }

  ]

};


/* =====================================================
   APPLICATION STATE
===================================================== */

let currentLevel = "easy";

let currentParagraph = null;

let recognition = null;

let isListening = false;

let finalTranscript = "";

let selectedWord = "";


/*
   Prevent old recognition events from
   accidentally changing a new session.
*/
let recognitionSession = 0;


/* =====================================================
   SCREEN ELEMENTS
===================================================== */

const homeScreen =
  document.getElementById("homeScreen");

const levelScreen =
  document.getElementById("levelScreen");

const practiceScreen =
  document.getElementById("practiceScreen");

const startButton =
  document.getElementById("startButton");

const backHomeButton =
  document.getElementById("backHomeButton");

const homeButton =
  document.getElementById("homeButton");

const currentLevelDisplay =
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

const selectedWordDisplay =
  document.getElementById("selectedWord");

const similarWords =
  document.getElementById("similarWords");

const pronounceButton =
  document.getElementById("pronounceButton");

const closeWordInfo =
  document.getElementById("closeWordInfo");


/* =====================================================
   CREATE START AGAIN BUTTON
   We create it with JavaScript so HTML does not
   need to be changed.
===================================================== */

const restartButton =
  document.createElement("button");

restartButton.textContent =
  "Start Again";

restartButton.className =
  "primary-button";

restartButton.style.marginTop =
  "15px";

restartButton.style.display =
  "none";

restartButton.addEventListener(
  "click",
  () => {

    if (!currentLevel) {
      return;
    }

    startPractice();

  }
);


/*
   Put the button inside the result card.
*/
resultCard.appendChild(restartButton);


/* =====================================================
   SCREEN CONTROL
===================================================== */

function showScreen(screen) {

  document
    .querySelectorAll(".screen")
    .forEach(item => {

      item.classList.remove("active");

    });

  screen.classList.add("active");

}


/* =====================================================
   HOME → LEVEL
===================================================== */

startButton.addEventListener(
  "click",
  () => {

    showScreen(levelScreen);

  }
);


/* =====================================================
   LEVEL SELECTION
===================================================== */

document
  .querySelectorAll(".level-button")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        currentLevel =
          button.dataset.level;

        startPractice();

      }
    );

  });


/* =====================================================
   BACK TO HOME
===================================================== */

backHomeButton.addEventListener(
  "click",
  () => {

    stopRecognition();

    showScreen(homeScreen);

  }
);


homeButton.addEventListener(
  "click",
  () => {

    stopRecognition();

    showScreen(homeScreen);

  }
);


/* =====================================================
   RANDOM PARAGRAPH
===================================================== */

function chooseParagraph() {

  const list =
    paragraphs[currentLevel];

  const randomIndex =
    Math.floor(
      Math.random() * list.length
    );

  return list[randomIndex];

}


/* =====================================================
   START PRACTICE
===================================================== */

function startPractice() {

  /*
     Make sure microphone from an old
     practice is completely stopped.
  */

  stopRecognition();


  currentParagraph =
    chooseParagraph();


  currentLevelDisplay.textContent =
    capitalize(currentLevel);


  paragraphText.textContent =
    currentParagraph.text;


  transcript.textContent =
    "Your speech will appear here...";


  finalTranscript = "";


  resultCard.classList.add(
    "hidden"
  );


  wordInfo.classList.add(
    "hidden"
  );


  restartButton.style.display =
    "none";


  /*
     SCROLL FIX

     Force the paragraph animation
     to run only once.

     We remove the animation first,
     then add it again on the next
     browser frame.
  */

  paragraphText.style.animation =
    "none";


  requestAnimationFrame(() => {

    paragraphText.style.animation =
      "";

    paragraphText.style.animationIterationCount =
      "1";

    paragraphText.style.animationFillMode =
      "forwards";

  });


  showScreen(practiceScreen);

}


/* =====================================================
   CAPITALIZE
===================================================== */

function capitalize(text) {

  return text.charAt(0).toUpperCase()
    + text.slice(1);

}


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


  recognition.lang =
    "en-US";


  /*
     Continuous means the browser keeps
     listening until WE tell it to stop.

     It does NOT mean automatically restart.
  */

  recognition.continuous =
    true;


  recognition.interimResults =
    true;


  recognition.maxAlternatives =
    1;


  /* --------------------------------
     MICROPHONE STARTS
  -------------------------------- */

  recognition.onstart = () => {

    isListening = true;

    micButton.classList.add(
      "listening"
    );

    micStatus.textContent =
      "Listening... Read the passage aloud.";

  };


  /* --------------------------------
     SPEECH RESULT
  -------------------------------- */

  recognition.onresult = (event) => {

    /*
       IMPORTANT FIX

       The old version kept doing:

       finalTranscript += text

       That can cause repeated phrases.

       Instead, rebuild the entire transcript
       from the browser's CURRENT result list.
    */

    let completeTranscript = "";


    for (
      let i = 0;
      i < event.results.length;
      i++
    ) {

      const result =
        event.results[i];


      const text =
        result[0].transcript;


      completeTranscript +=
        " " + text;

    }


    completeTranscript =
      cleanTranscript(
        completeTranscript
      );


    /*
       Store the current complete version.
    */

    finalTranscript =
      completeTranscript;


    /*
       Display what the microphone currently
       understands.
    */

    transcript.textContent =
      completeTranscript ||
      "Listening...";


    /*
       Compare against the target paragraph.
    */

    if (
      completeTranscript.length > 0
    ) {

      compareSpeech(
        completeTranscript
      );

    }

  };


  /* --------------------------------
     MICROPHONE ENDS
  -------------------------------- */

  recognition.onend = () => {

    isListening = false;

    micButton.classList.remove(
      "listening"
    );


    /*
       DO NOT automatically call
       recognition.start() here.

       This is important.

       The microphone is now OFF until
       the user manually presses the button.
    */

    micStatus.textContent =
      "Microphone off. Tap the microphone to continue.";


    if (
      finalTranscript.trim()
    ) {

      compareSpeech(
        finalTranscript.trim()
      );


      restartButton.style.display =
        "inline-block";

    }

  };


  /* --------------------------------
     ERRORS
  -------------------------------- */

  recognition.onerror = (event) => {

    console.log(
      "Speech recognition error:",
      event.error
    );


    isListening = false;


    micButton.classList.remove(
      "listening"
    );


    if (
      event.error === "not-allowed"
    ) {

      micStatus.textContent =
        "Microphone permission was blocked. Please allow microphone access.";

    }

    else if (
      event.error === "no-speech"
    ) {

      micStatus.textContent =
        "I didn't hear speech. Try speaking a little louder.";

    }

    else if (
      event.error === "aborted"
    ) {

      micStatus.textContent =
        "Microphone stopped.";

    }

    else {

      micStatus.textContent =
        "Something went wrong with speech recognition.";

    }

  };

}


/* =====================================================
   MICROPHONE BUTTON
===================================================== */

micButton.addEventListener(
  "click",
  () => {

    /*
       Create recognition the first time
       the user actually presses the mic.
    */

    if (!recognition) {

      setupSpeechRecognition();

    }


    if (!recognition) {

      return;

    }


    /*
       MANUAL TOGGLE

       OFF → ON
       ON → OFF
    */

    if (isListening) {

      stopRecognition();

    }

    else {

      startRecognition();

    }

  }
);


/* =====================================================
   START RECOGNITION
===================================================== */

function startRecognition() {

  if (!recognition) {

    return;

  }


  /*
     Start a NEW recognition session.

     We intentionally do not erase the old
     transcript here.

     This means the user can stop the mic
     and manually start it again.
  */

  resultCard.classList.add(
    "hidden"
  );


  micStatus.textContent =
    "Starting microphone...";


  try {

    recognition.start();

  }

  catch (error) {

    console.log(
      "Recognition start:",
      error
    );

  }

}


/* =====================================================
   STOP RECOGNITION
===================================================== */

function stopRecognition() {

  if (!recognition) {

    return;

  }


  try {

    recognition.stop();

  }

  catch (error) {

    console.log(
      "Recognition stop:",
      error
    );

  }

}


/* =====================================================
   CLEAN TRANSCRIPT
===================================================== */

function cleanTranscript(text) {

  /*
     Remove excessive whitespace.
  */

  return text
    .replace(/\s+/g, " ")
    .trim();

}


/* =====================================================
   TEXT NORMALIZATION
===================================================== */

function cleanWord(word) {

  return word
    .toLowerCase()
    .replace(/[.,!?;:"'()[\]{}]/g, "")
    .trim();

}


/* =====================================================
   GET WORDS
===================================================== */

function getWords(text) {

  return text
    .split(/\s+/)
    .map(cleanWord)
    .filter(Boolean);

}


/* =====================================================
   SIMPLE WORD COMPARISON
===================================================== */

function compareSpeech(spokenText) {

  if (!currentParagraph) {

    return;

  }


  const targetWords =
    getWords(
      currentParagraph.text
    );


  const spokenWords =
    getWords(spokenText);


  let matched = 0;


  wordResults.innerHTML =
    "";


  targetWords.forEach(
    (targetWord, index) => {

      const spokenWord =
        spokenWords[index];


      const wordElement =
        document.createElement("span");


      wordElement.classList.add(
        "word"
      );


      wordElement.textContent =
        targetWord;


      wordElement.dataset.word =
        targetWord;


      /*
         If the microphone did not hear
         the word or heard something different,
         mark the TARGET word as wrong.
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

      else {

        matched++;

      }


      wordElement.addEventListener(
        "click",
        () => {

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
     Score is always between 0 and 100.
  */

  const percentage =
    targetWords.length === 0
      ? 0
      : Math.round(
          (
            matched /
            targetWords.length
          ) * 100
        );


  /*
     NEW SCORE DISPLAY
  */

  resultSummary.textContent =
    `Score: ${percentage} / 100 — ` +
    `${matched} of ${targetWords.length} words matched. ` +
    `Tap a highlighted word to practice it.`;


  resultCard.classList.remove(
    "hidden"
  );

}


/* =====================================================
   SIMPLE WORD SIMILARITY
===================================================== */

function wordsAreSimilar(
  target,
  spoken
) {

  if (
    target === spoken
  ) {

    return true;

  }


  /*
     Small spelling differences are allowed.
  */

  if (
    target.startsWith(spoken) ||
    spoken.startsWith(target)
  ) {

    if (
      Math.abs(
        target.length -
        spoken.length
      ) <= 2
    ) {

      return true;

    }

  }


  return false;

}


/* =====================================================
   WORD INFORMATION
===================================================== */

function showWordInfo(word) {

  selectedWord =
    word;


  selectedWordDisplay.textContent =
    word;


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


/* =====================================================
   CLOSE WORD INFORMATION
===================================================== */

closeWordInfo.addEventListener(
  "click",
  () => {

    wordInfo.classList.add(
      "hidden"
    );

  }
);


/* =====================================================
   PRONUNCIATION
===================================================== */

pronounceButton.addEventListener(
  "click",
  () => {

    if (!selectedWord) {

      return;

    }


    if (
      !window.speechSynthesis
    ) {

      alert(
        "Speech pronunciation is not supported in this browser."
      );

      return;

    }


    window.speechSynthesis.cancel();


    const utterance =
      new SpeechSynthesisUtterance(
        selectedWord
      );


    utterance.lang =
      "en-US";


    utterance.rate =
      0.75;


    window.speechSynthesis.speak(
      utterance
    );

  }
);


/* =====================================================
   SOUND EXAMPLES
===================================================== */

function getSimilarSoundExamples(word) {

  const soundExamples = {

    three:
      "tree, free, see",

    see:
      "sea, tree, free",

    beach:
      "peach, teach, reach",

    day:
      "say, way, play",

    food:
      "mood, rude, good",

    work:
      "word, world",

    read:
      "need, seed, lead",

    light:
      "right, night, sight",

    walk:
      "talk, chalk, stalk",

    thing:
      "think, sink, ring"

  };


  return (
    soundExamples[word] ||
    "Similar-sounding examples will be added to the pronunciation dictionary."
  );

}


/* =====================================================
   INITIALIZE
===================================================== */

/*
   IMPORTANT:

   We DO NOT start the microphone here.

   Recognition is created only when the
   user presses the microphone button.
*/

console.log(
  "SpeakUp loaded successfully."
);
