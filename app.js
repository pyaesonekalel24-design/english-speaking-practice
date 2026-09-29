/* =====================================================
   SPEAKUP ENGLISH
   VERSION 3
   - Manual microphone only
   - No automatic microphone restart
   - Better transcript handling
   - Duplicate-result protection
   - Improved word alignment
   - 0–100 scoring
   - One-time paragraph scrolling
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
   Used to make sure an old recognition session
   cannot interfere with a newer one.
*/
let recognitionSession = 0;


/*
   Stores individual recognition results.

   This is safer than simply doing:

   finalTranscript += text

   because the browser's result list can contain
   previous final results plus newer results.
*/
let recognitionChunks = [];


/*
   Prevents accidental double-clicks while the
   browser is starting/stopping recognition.
*/
let recognitionBusy = false;


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
   START AGAIN BUTTON
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

    startPractice();

  }
);


resultCard.appendChild(
  restartButton
);


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
     Stop any previous recognition session.
  */

  stopRecognition();


  /*
     New recognition session.
  */

  recognitionSession++;


  /*
     Clear old recognition data.
  */

  recognitionChunks = [];

  finalTranscript = "";


  /*
     Choose new paragraph.
  */

  currentParagraph =
    chooseParagraph();


  currentLevelDisplay.textContent =
    capitalize(currentLevel);


  paragraphText.textContent =
    currentParagraph.text;


  transcript.textContent =
    "Your speech will appear here...";


  resultCard.classList.add(
    "hidden"
  );


  wordInfo.classList.add(
    "hidden"
  );


  restartButton.style.display =
    "none";


  /*
     Reset paragraph animation.

     It will run ONCE only.
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


  /*
     Reset microphone UI.
  */

  isListening = false;

  recognitionBusy = false;

  micButton.classList.remove(
    "listening"
  );


  micStatus.textContent =
    "Tap the microphone and start reading.";


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

    return false;

  }


  recognition =
    new SpeechRecognition();


  /*
     English recognition.
  */

  recognition.lang =
    "en-US";


  /*
     Keep listening while the service allows it.

     IMPORTANT:
     This does NOT mean our code will
     automatically restart it.

     If the browser ends the session,
     the microphone stays OFF.
  */

  recognition.continuous =
    true;


  /*
     IMPORTANT CHANGE:

     We turn interim results OFF.

     That means the app waits for a
     finalized recognition result instead
     of repeatedly replacing temporary guesses.
  */

  recognition.interimResults =
    false;


  recognition.maxAlternatives =
    1;


  /* ===================================================
     START
  =================================================== */

  recognition.onstart = () => {

    isListening = true;

    recognitionBusy = false;

    micButton.classList.add(
      "listening"
    );

    micStatus.textContent =
      "Listening... Read the passage aloud.";

  };


  /* ===================================================
     RESULT
  =================================================== */

  recognition.onresult = (event) => {

    /*
       Only process NEW result positions.

       resultIndex tells us the first result
       that changed.
    */

    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {

      const result =
        event.results[i];


      /*
         We only store FINAL results.

         This prevents temporary recognition
         guesses from polluting the transcript.
      */

      if (
        result.isFinal &&
        result[0]
      ) {

        const text =
          cleanTranscript(
            result[0].transcript
          );


        if (text) {

          /*
             Add this result only if it is
             not an obvious duplicate.
          */

          addRecognitionChunk(text);

        }

      }

    }


    /*
       Rebuild the transcript from our
       controlled chunks.
    */

    finalTranscript =
      recognitionChunks.join(" ");


    finalTranscript =
      cleanTranscript(
        finalTranscript
      );


    transcript.textContent =
      finalTranscript ||
      "Listening...";

  };


  /* ===================================================
     END
  =================================================== */

  recognition.onend = () => {

    isListening = false;

    recognitionBusy = false;

    micButton.classList.remove(
      "listening"
    );


    /*
       CRITICAL:

       DO NOT restart recognition here.

       The user must manually press the
       microphone button again.
    */

    micStatus.textContent =
      "Microphone off. Tap the microphone to continue.";


    /*
       Only score after the microphone
       has actually stopped.
    */

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


  /* ===================================================
     ERROR
  =================================================== */

  recognition.onerror = (event) => {

    console.log(
      "Speech recognition error:",
      event.error
    );


    isListening = false;

    recognitionBusy = false;

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
        "Speech recognition error: " +
        event.error;

    }

  };


  return true;

}


/* =====================================================
   ADD RECOGNITION CHUNK
===================================================== */

function addRecognitionChunk(text) {

  const cleaned =
    cleanTranscript(text);


  if (!cleaned) {

    return;

  }


  /*
     Don't add the exact same phrase twice
     in a row.

     Example:

     "last night"
     "last night"

     becomes:

     "last night"
  */

  const lastChunk =
    recognitionChunks[
      recognitionChunks.length - 1
    ];


  if (
    lastChunk &&
    normalizeForComparison(lastChunk) ===
    normalizeForComparison(cleaned)
  ) {

    return;

  }


  /*
     Detect repeated phrases such as:

     "last night last night"
     
     If the whole new chunk is basically
     two copies of the same phrase, keep one.
  */

  const deduplicated =
    removeRepeatedPhrase(cleaned);


  recognitionChunks.push(
    deduplicated
  );

}


/* =====================================================
   REMOVE OBVIOUS REPEATED PHRASES
===================================================== */

function removeRepeatedPhrase(text) {

  const words =
    getWords(text);


  if (
    words.length < 2
  ) {

    return text;

  }


  /*
     Check whether the text consists of
     the same half repeated twice.

     Example:

     last night last night

     → last night
  */

  if (
    words.length % 2 === 0
  ) {

    const half =
      words.length / 2;


    const firstHalf =
      words.slice(
        0,
        half
      );


    const secondHalf =
      words.slice(
        half
      );


    let identical = true;


    for (
      let i = 0;
      i < half;
      i++
    ) {

      if (
        firstHalf[i] !==
        secondHalf[i]
      ) {

        identical = false;

        break;

      }

    }


    if (identical) {

      return firstHalf.join(" ");

    }

  }


  /*
     Also remove obvious triple repetition.

     Example:

     "last night last night last night"

     → "last night"
  */

  if (
    words.length % 3 === 0
  ) {

    const third =
      words.length / 3;


    const first =
      words.slice(
        0,
        third
      );


    const second =
      words.slice(
        third,
        third * 2
      );


    const thirdPart =
      words.slice(
        third * 2
      );


    if (
      arraysEqual(first, second) &&
      arraysEqual(first, thirdPart)
    ) {

      return first.join(" ");

    }

  }


  return text;

}


/* =====================================================
   ARRAY COMPARISON
===================================================== */

function arraysEqual(a, b) {

  if (
    a.length !==
    b.length
  ) {

    return false;

  }


  for (
    let i = 0;
    i < a.length;
    i++
  ) {

    if (
      a[i] !== b[i]
    ) {

      return false;

    }

  }


  return true;

}


/* =====================================================
   MICROPHONE BUTTON
===================================================== */

micButton.addEventListener(
  "click",
  () => {

    /*
       Prevent accidental double-clicking
       while the browser is changing state.
    */

    if (
      recognitionBusy
    ) {

      return;

    }


    /*
       Create recognition only when
       the user manually presses the button.
    */

    if (!recognition) {

      const ready =
        setupSpeechRecognition();


      if (!ready) {

        return;

      }

    }


    if (
      isListening
    ) {

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

  if (
    !recognition ||
    isListening ||
    recognitionBusy
  ) {

    return;

  }


  recognitionBusy = true;


  /*
     Hide previous result while continuing
     this practice session.
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

    recognitionBusy = false;

  }

}


/* =====================================================
   STOP RECOGNITION
===================================================== */

function stopRecognition() {

  if (
    !recognition
  ) {

    return;

  }


  if (
    !isListening
  ) {

    return;

  }


  recognitionBusy = true;


  try {

    recognition.stop();

  }

  catch (error) {

    console.log(
      "Recognition stop:",
      error
    );

    recognitionBusy = false;

    isListening = false;

  }

}


/* =====================================================
   CLEAN TRANSCRIPT
===================================================== */

function cleanTranscript(text) {

  return text
    .replace(/\s+/g, " ")
    .trim();

}


/* =====================================================
   NORMALIZE FOR COMPARISON
===================================================== */

function normalizeForComparison(text) {

  return text
    .toLowerCase()
    .replace(/[.,!?;:"'()[\]{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();

}


/* =====================================================
   CLEAN WORD
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
   IMPROVED SPEECH COMPARISON
===================================================== */

function compareSpeech(spokenText) {

  if (
    !currentParagraph
  ) {

    return;

  }


  const targetWords =
    getWords(
      currentParagraph.text
    );


  const spokenWords =
    getWords(spokenText);


  /*
     Instead of simply comparing:

     target[0] with spoken[0]
     target[1] with spoken[1]
     target[2] with spoken[2]

     we use a small alignment algorithm.

     This means if the microphone misses
     one word, the entire rest of the
     paragraph doesn't automatically become red.
  */

  const alignment =
    alignWords(
      targetWords,
      spokenWords
    );


  let matched = 0;


  wordResults.innerHTML =
    "";


  targetWords.forEach(
    (targetWord, index) => {

      const wordElement =
        document.createElement("span");


      wordElement.classList.add(
        "word"
      );


      wordElement.textContent =
        targetWord;


      wordElement.dataset.word =
        targetWord;


      const match =
        alignment[index];


      if (match) {

        wordElement.classList.add(
          "correct"
        );

        matched++;

      }

      else {

        wordElement.classList.add(
          "wrong"
        );

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
     Score out of 100.
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


  resultSummary.textContent =
    `Score: ${percentage} / 100 — ` +
    `${matched} of ${targetWords.length} words matched. ` +
    `Tap a highlighted word to practice it.`;


  resultCard.classList.remove(
    "hidden"
  );

}


/* =====================================================
   WORD ALIGNMENT
===================================================== */

function alignWords(
  targetWords,
  spokenWords
) {

  const targetLength =
    targetWords.length;


  const spokenLength =
    spokenWords.length;


  /*
     Create dynamic programming table.

     This is basically a simplified
     edit-distance alignment.

     It lets us account for:

     - missed words
     - extra words
     - slightly different words
  */

  const dp =
    Array.from(
      {
        length:
          targetLength + 1
      },
      () =>
        Array(
          spokenLength + 1
        ).fill(0)
    );


  for (
    let i = 0;
    i <= targetLength;
    i++
  ) {

    dp[i][0] =
      i;

  }


  for (
    let j = 0;
    j <= spokenLength;
    j++
  ) {

    dp[0][j] =
      j;

  }


  for (
    let i = 1;
    i <= targetLength;
    i++
  ) {

    for (
      let j = 1;
      j <= spokenLength;
      j++
    ) {

      const same =
        wordsAreSimilar(
          targetWords[i - 1],
          spokenWords[j - 1]
        );


      const substitution =
        dp[i - 1][j - 1] +
        (same ? 0 : 1);


      const deletion =
        dp[i - 1][j] +
        1;


      const insertion =
        dp[i][j - 1] +
        1;


      dp[i][j] =
        Math.min(
          substitution,
          deletion,
          insertion
        );

    }

  }


  /*
     Walk backwards through the table
     to discover which target words
     actually matched.
  */

  const matched =
    Array(
      targetLength
    ).fill(false);


  let i =
    targetLength;


  let j =
    spokenLength;


  while (
    i > 0 ||
    j > 0
  ) {

    if (
      i > 0 &&
      j > 0
    ) {

      const same =
        wordsAreSimilar(
          targetWords[i - 1],
          spokenWords[j - 1]
        );


      const substitution =
        dp[i - 1][j - 1] +
        (same ? 0 : 1);


      if (
        dp[i][j] ===
        substitution
      ) {

        if (same) {

          matched[i - 1] =
            true;

        }


        i--;

        j--;

        continue;

      }

    }


    if (
      i > 0 &&
      dp[i][j] ===
      dp[i - 1][j] + 1
    ) {

      i--;

      continue;

    }


    if (
      j > 0
    ) {

      j--;

      continue;

    }


    break;

  }


  return matched;

}


/* =====================================================
   WORD SIMILARITY
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
     Small spelling differences.

     Example:

     color / colours

     or tiny recognition differences.
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


  /*
     Basic edit-distance check.

     This allows small transcription
     mistakes without treating completely
     different words as correct.
  */

  if (
    levenshteinDistance(
      target,
      spoken
    ) <= 1 &&
    Math.max(
      target.length,
      spoken.length
    ) >= 4
  ) {

    return true;

  }


  return false;

}


/* =====================================================
   LEVENSHTEIN DISTANCE
===================================================== */

function levenshteinDistance(a, b) {

  const matrix =
    Array.from(
      {
        length:
          a.length + 1
      },
      () =>
        Array(
          b.length + 1
        ).fill(0)
    );


  for (
    let i = 0;
    i <= a.length;
    i++
  ) {

    matrix[i][0] =
      i;

  }


  for (
    let j = 0;
    j <= b.length;
    j++
  ) {

    matrix[0][j] =
      j;

  }


  for (
    let i = 1;
    i <= a.length;
    i++
  ) {

    for (
      let j = 1;
      j <= b.length;
      j++
    ) {

      const cost =
        a[i - 1] ===
        b[j - 1]
          ? 0
          : 1;


      matrix[i][j] =
        Math.min(

          matrix[i - 1][j] + 1,

          matrix[i][j - 1] + 1,

          matrix[i - 1][j - 1] + cost

        );

    }

  }


  return matrix[a.length][b.length];

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

    if (
      !selectedWord
    ) {

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

console.log(
  "SpeakUp Version 3 loaded successfully."
);
