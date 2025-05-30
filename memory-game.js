document.addEventListener("DOMContentLoaded", () => {
  const gameBoard = document.getElementById("memoryGameBoard");
  const attemptsCountEl = document.getElementById("attemptsCount");
  const matchesCountEl = document.getElementById("matchesCount");
  const totalPairsEl = document.getElementById("totalPairs");
  const resetGameButton = document.getElementById("resetGameButton");
  const gameLoadingMessageEl = document.getElementById("gameLoadingMessage");
  const gameWinMessageEl = document.getElementById("gameWinMessage");
  const gameErrorMessageEl = document.getElementById("gameErrorMessage"); // Added for specific game errors

  const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon";
  const NUM_UNIQUE_POKEMON = 8;
  const FLIP_DELAY = 800;

  let cards = [];
  let flippedCards = [];
  let matchedPairs = 0;
  let attempts = 0;
  let lockBoard = false;

  async function initGame() {
    resetGameState();
    displayMessage("Setting up the game...", "loading");
    gameBoard.innerHTML = "";

    try {
      const pokemonList = await fetchPokemonForGame(NUM_UNIQUE_POKEMON);
      if (!pokemonList || pokemonList.length < NUM_UNIQUE_POKEMON) {
        throw new Error("Not enough Pokémon fetched for the game.");
      }

      createCardObjects(pokemonList);
      shuffleCards();
      renderGameBoard();
      totalPairsEl.textContent = NUM_UNIQUE_POKEMON;
      clearMessages("loading");
    } catch (error) {
      console.error("Error initializing game:", error);
      displayMessage(`${error.message}. Please try resetting.`, "error");
    }
  }

  function resetGameState() {
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    attempts = 0;
    lockBoard = false;
    updateStats();
    clearMessages("all");
    gameBoard.classList.remove("game-won");
  }

  async function fetchPokemonForGame(count) {
    const randomOffset = Math.floor(Math.random() * 800);
    const response = await fetch(
      `${POKEAPI_BASE_URL}?limit=${count * 3}&offset=${randomOffset}`
    );
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();

    const uniquePokemon = [];
    const fetchedResults = [...data.results];

    while (uniquePokemon.length < count && fetchedResults.length > 0) {
      const randomIndex = Math.floor(Math.random() * fetchedResults.length);
      const pokemon = fetchedResults.splice(randomIndex, 1)[0];

      const urlParts = pokemon.url.split("/");
      const id = urlParts[urlParts.length - 2];
      if (id && !isNaN(parseInt(id))) {
        uniquePokemon.push({
          id: `pokemon-${id}`,
          name: pokemon.name,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
        });
      }
    }
    if (uniquePokemon.length < count) {
      console.warn(
        "Could only fetch",
        uniquePokemon.length,
        "unique Pokémon. Game might have fewer pairs."
      );
    }
    return uniquePokemon.slice(0, count);
  }

  function createCardObjects(pokemonList) {
    pokemonList.forEach((pokemon) => {
      cards.push({ ...pokemon, uniqueCardId: `${pokemon.id}-a` });
      cards.push({ ...pokemon, uniqueCardId: `${pokemon.id}-b` });
    });
  }

  function shuffleCards() {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }

  function renderGameBoard() {
    let columns = 4;
    if (cards.length === 12) columns = 4;
    else if (cards.length === 18) columns = 6;
    else if (cards.length === 8) columns = 4;
    else if (cards.length === 20) columns = 5; // for 10 pairs
    else if (cards.length === 24) columns = 6; // for 12 pairs

    gameBoard.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    if (cards.length === 0) return; // safety check if no cards were created

    cards.forEach((cardData) => {
      const cardElement = document.createElement("div");
      cardElement.classList.add("memory-card");
      cardElement.dataset.id = cardData.id;
      cardElement.dataset.uniqueCardId = cardData.uniqueCardId;

      const cardFront = document.createElement("div");
      cardFront.classList.add("card-face", "card-front");
      const img = document.createElement("img");
      img.src = cardData.sprite;
      img.alt = cardData.name;
      img.loading = "lazy";
      img.onerror = function () {
        this.onerror = null;
        this.src =
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        this.alt = "Sprite error";
      };
      cardFront.appendChild(img);

      const cardBack = document.createElement("div");
      cardBack.classList.add("card-face", "card-back");

      cardElement.appendChild(cardFront);
      cardElement.appendChild(cardBack);

      cardElement.addEventListener("click", () =>
        handleCardClick(cardElement, cardData)
      );
      gameBoard.appendChild(cardElement);
      cardData.element = cardElement;
    });
  }

  function handleCardClick(cardElement, cardData) {
    if (
      lockBoard ||
      cardElement.classList.contains("is-flipped") ||
      cardElement.classList.contains("is-matched")
    ) {
      return;
    }

    flipCard(cardElement);
    flippedCards.push({ element: cardElement, data: cardData });

    if (flippedCards.length === 2) {
      lockBoard = true;
      attempts++;
      updateStats();
      checkForMatch();
    }
  }

  function flipCard(cardElement) {
    cardElement.classList.add("is-flipped");
  }

  function checkForMatch() {
    const [cardOne, cardTwo] = flippedCards;

    if (cardOne.data.id === cardTwo.data.id) {
      matchedPairs++;
      updateStats();
      disableMatchedCards(cardOne.element, cardTwo.element);
      resetFlippedCards();
      if (matchedPairs === cards.length / 2) {
        // Use cards.length / 2 for total pairs
        gameWon();
      }
    } else {
      setTimeout(() => {
        unflipCards(cardOne.element, cardTwo.element);
        resetFlippedCards();
      }, FLIP_DELAY);
    }
  }

  function disableMatchedCards(card1El, card2El) {
    card1El.classList.add("is-matched");
    card2El.classList.add("is-matched");
  }

  function unflipCards(card1El, card2El) {
    card1El.classList.remove("is-flipped");
    card2El.classList.remove("is-flipped");
  }

  function resetFlippedCards() {
    flippedCards = [];
    lockBoard = false;
  }

  function updateStats() {
    attemptsCountEl.textContent = attempts;
    matchesCountEl.textContent = matchedPairs;
  }

  function gameWon() {
    displayMessage(
      `Congratulations! You found all pairs in ${attempts} attempts!`,
      "win"
    );
    gameBoard.classList.add("game-won");
    lockBoard = true;
  }

  function displayMessage(message, type) {
    clearMessages("all");
    if (type === "loading") {
      gameLoadingMessageEl.textContent = message;
      gameLoadingMessageEl.classList.add("visible");
    } else if (type === "win") {
      gameWinMessageEl.textContent = message;
      gameWinMessageEl.classList.add("visible");
    } else if (type === "error") {
      gameErrorMessageEl.textContent = message;
      gameErrorMessageEl.classList.add("visible");
    }
  }

  function clearMessages(type) {
    if (type === "all" || type === "loading") {
      gameLoadingMessageEl.textContent = "";
      gameLoadingMessageEl.classList.remove("visible");
    }
    if (type === "all" || type === "win") {
      gameWinMessageEl.textContent = "";
      gameWinMessageEl.classList.remove("visible");
    }
    if (type === "all" || type === "error") {
      gameErrorMessageEl.textContent = "";
      gameErrorMessageEl.classList.remove("visible");
    }
  }

  resetGameButton.addEventListener("click", initGame);
  initGame();
});
