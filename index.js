const axios = require("axios");

const getPuzzelUrl = (id = 0) =>
  `https://test8020cto.herokuapp.com/get_puzzle?id=${id}`;

const getGuesslUrl = (id = 0, words = []) =>
  `https://test8020cto.herokuapp.com/guess?id=${id}&guess=${words.join("+")}`;

const parseHints = (string = "") => {
  return string.split(" ");
};

// const distinct = (value, index, self) => {
//   return self.indexOf(value) === index;
// };

// const isBlackListed = (blackList, word) => {
//   const checks = word.split("");
//   for (let i = 0; i < checks.length; i++) {
//     const element = checks[i];
//     if (blackList.includes(element)) {
//       return true;
//       break;
//     }
//   }
//   return false;
// };

// const setBlackList = (blackList, word) => {
//   const letters = word.split("");
//   const newList = blackList.concat(letters);
//   return newList.filter(distinct);
// };

const runTest = async () => {
  const historyId = ["0"];
  let puzzleId = 0;
  const vocabURL = "https://test8020cto.herokuapp.com/vocabulary?o";

  const { vocabulary: vocabs } = await axios
    .get(vocabURL)
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      console.error(error);
    });

  while (puzzleId !== "-1") {
    const { hint } = await axios
      .get(getPuzzelUrl(puzzleId))
      .then((res) => res.data)
      .catch((error) => {
        console.error(error);
      });

    const hints = parseHints(hint);
    let currentNumCorrect = hints.length > 0 ? hints.length - 1 : 0;

    const posted = hints;
    for (let index = 0; index < hints.length; index++) {
      const hint = hints[index];
      let blackList = [];
      for (let i = 0; i < vocabs.length; i++) {
        const vocab = vocabs[i];

        if (
          vocab.length === hint.length &&
          !blackList.includes(vocab.substr(0, 1))
          // wee only check for forst letter, there's a bug when using the wohle word
        ) {
          posted[index] = vocab;
          const response = await axios
            .get(getGuesslUrl(puzzleId, posted))
            .then((res) => res.data)
            .catch((error) => ({ error: error.response.data }));
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

          // blacklisted the character if numCorrect is still the same
          if (numCorrect && numCorrect === currentNumCorrect) {
            //   we only gonna put the first letter, we have a race condition
            blackList.push(vocab.substr(0, 1));
            // blackList = blackList.concat(vocab.split(""));
          }
          // next if we got the word correct
          if (numCorrect && numCorrect === currentNumCorrect + hint.length) {
            currentNumCorrect = numCorrect;
            break;
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

runTest();
