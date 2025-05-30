document.addEventListener("DOMContentLoaded", () => {
  const pokemonInput = document.getElementById("pokemonInput");
  const searchButton = document.getElementById("searchButton");

  const pokemonDetailsSection = document.getElementById(
    "pokemon-details-section"
  );
  const pokemonImage = document.getElementById("pokemonImage");
  const pokemonNameEl = document.getElementById("pokemonName");
  const pokemonIdEl = document.getElementById("pokemonId");
  const pokemonTypesEl = document.getElementById("pokemonTypes");

  const errorMessageEl = document.getElementById("errorMessage");
  const loadingMessageEl = document.getElementById("loadingMessage");

  const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon/";

  // Initial setup
  pokemonDetailsSection.classList.add("hidden");
  clearMessages("all");

  searchButton.addEventListener("click", handleSearch);
  pokemonInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  });

  async function handleSearch() {
    const searchTerm = pokemonInput.value.trim().toLowerCase();

    if (!searchTerm) {
      displayMessage("Please enter a Pokémon name or ID.", "error");
      hidePokemonDetails();
      return;
    }

    clearMessages("all");
    displayMessage("Discovering Pokémon...", "loading");
    hidePokemonDetails();
    pokemonImage.classList.add("loading");

    try {
      const response = await fetch(`${POKEAPI_BASE_URL}${searchTerm}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Pokémon "${pokemonInput.value.trim()}" not found.`);
        } else {
          throw new Error(
            `API Error: ${response.status} - ${
              response.statusText || "Unknown error"
            }`
          );
        }
      }

      const data = await response.json();
      displayPokemonData(data);
    } catch (error) {
      console.error("Fetch error:", error);
      displayMessage(error.message, "error");
      hidePokemonDetails();
    } finally {
      clearMessages("loading");
      pokemonImage.classList.remove("loading");
    }
  }

  function displayPokemonData(pokemon) {
    pokemonNameEl.textContent = pokemon.name;
    pokemonIdEl.textContent = `#${String(pokemon.id).padStart(3, "0")}`;

    const imageUrl =
      pokemon.sprites.other?.["official-artwork"]?.front_default ||
      pokemon.sprites.front_default ||
      "";

    if (imageUrl) {
      pokemonImage.src = imageUrl;
      pokemonImage.alt = `Image of ${pokemon.name}`;
      pokemonImage.style.display = "block";
    } else {
      pokemonImage.src = "#";
      pokemonImage.alt = "No image available";
      pokemonImage.style.display = "none";
    }

    pokemonTypesEl.innerHTML = "";
    pokemon.types.forEach((typeInfo) => {
      const typeSpan = document.createElement("span");
      typeSpan.textContent = typeInfo.type.name;
      typeSpan.className = `type-${typeInfo.type.name}`;
      pokemonTypesEl.appendChild(typeSpan);
    });

    showPokemonDetails();
    clearMessages("error");
  }

  function showPokemonDetails() {
    pokemonDetailsSection.classList.remove("hidden");
  }

  function hidePokemonDetails() {
    pokemonDetailsSection.classList.add("hidden");
  }

  function displayMessage(message, type = "error") {
    clearMessages("all");
    if (type === "error") {
      errorMessageEl.textContent = message;
      errorMessageEl.classList.add("visible");
    } else if (type === "loading") {
      loadingMessageEl.textContent = message;
      loadingMessageEl.classList.add("visible");
    }
  }

  function clearMessages(type = "all") {
    if (type === "all" || type === "error") {
      errorMessageEl.textContent = "";
      errorMessageEl.classList.remove("visible");
    }
    if (type === "all" || type === "loading") {
      loadingMessageEl.textContent = "";
      loadingMessageEl.classList.remove("visible");
    }
  }

  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  const autoSearchPokemon = getQueryParam("pokemon");
  if (autoSearchPokemon) {
    pokemonInput.value = autoSearchPokemon;
    handleSearch();
  }
});
