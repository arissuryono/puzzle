const axios = require("axios");

const getPuzzelUrl = (id = 0) =>
  `https://test8020cto.herokuapp.com/get_puzzle?id=${id}`;

const getGuesslUrl = (id = 0, words = []) =>
  `https://test8020cto.herokuapp.com/guess?id=${id}&guess=${words.join("+")}`;

const parseHints = (string = "") => {
  return string.split(" ");
};

const checkVocabWithPattern = (vocab = "", hint = "") => {
  const arrVocab = vocab.split("");
  const arrHint = hint.split("");
  for (let index = 0; index < vocab.length; index++) {
    if (arrHint[index] !== "." && arrHint[index] !== arrVocab[index])
      return false;
  }
  return true;
};

const runTest = async (startAt = "0", stopAt = "-1") => {
  const historyId = ["0"];
  let puzzleId = startAt;
  const vocabURL = "https://test8020cto.herokuapp.com/vocabulary?o";

  const resultVocab = await axios
    .get(vocabURL)
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      console.log("Exit application, Failed fetch vocabs");
      // console.error(error);
    });

  if (!resultVocab) return false;

  const { vocabulary: vocabs } = resultVocab;

  vocabs.sort();

  while (puzzleId !== stopAt) {
    const { hint } = await axios
      .get(getPuzzelUrl(puzzleId))
      .then((res) => res.data)
      .catch((error) => {
        console.log("Failed fetching hints");
        console.error(error?.response);
      });

    const hints = parseHints(hint);
    let currentNumCorrect = hints.length > 0 ? hints.length - 1 : 0;

    const posted = hints;
    for (let index = 0; index < hints.length; index++) {
      let hint = hints[index];
      // let pattern = hint;
      let blackList = [];
      for (let i = 0; i < vocabs.length; i++) {
        const vocab = vocabs[i];

        // if (vocab.length !== hint.length || !checkVocabWithPattern(vocab, hint))
        //   console.log(`Skipping vocab: ${vocab}`);

        if (
          vocab.length === hint.length &&
          checkVocabWithPattern(vocab, hint)
        ) {
          posted[index] = vocab;
          const response = await axios
            .get(getGuesslUrl(puzzleId, posted))
            .then((res) => res.data)
            .catch((error) => {
              console.log("Failed fetch guess result");
              console.error(error?.response);
            });

          const { numCorrect, nextId } = response;

          console.log({
            puzzleId,
            historyId,
            hint,
            vocab,
            index,
            posted,
            blackList,
            currentNumCorrect,
            numCorrect,
            nextId,
          });

          // next if we got the word correct
          if (numCorrect && numCorrect === currentNumCorrect + hint.length) {
            currentNumCorrect = numCorrect;
            break;
          }
          if (numCorrect && numCorrect > currentNumCorrect) {
            // console.log(checkForPattern(vocab, hint));
            const letters = vocab.split("");
            const patterns = hint.split("");

            // // we're gonna check letter by letter
            for (let x = 0; x < letters.length; x++) {
              const newPosted = posted;
              // const arrPattern = pattern.split("")
              const tempChar = patterns[x];
              patterns[x] = letters[x];
              newPosted[index] = patterns.join("");
              const response2 = await axios
                .get(getGuesslUrl(puzzleId, newPosted))
                .then((res) => res.data)
                .catch((error) => {
                  console.error(error?.response);
                });
              const { numCorrect: numCorrect2 } = response2;
              console.log({ newPosted, numCorrect2 });
              if (numCorrect2 === currentNumCorrect) {
                patterns[x] = tempChar;
              } else {
                currentNumCorrect = numCorrect2;
              }
              hint = patterns.join("");
            }
          }

          //   to the next puzzle
          if (nextId) {
            historyId.push(nextId);
            puzzleId = nextId;
            break;
          }
        }
      }
    }
  }
};

runTest("0", "-1");
