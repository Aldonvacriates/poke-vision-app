document.addEventListener("DOMContentLoaded", () => {
  const pokemonListContainer = document.getElementById(
    "pokemon-list-container"
  );
  const paginationControls = document.getElementById("pagination-controls");
  const loadingMessageEl = document.getElementById("listLoadingMessage");
  const errorMessageEl = document.getElementById("listErrorMessage");

  const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon";
  const ITEMS_PER_PAGE = 40;

  let allPokemonData = [];
  let currentPage = 1;
  let totalPages = 0;

  async function fetchAllPokemon() {
    displayMessage("Loading all Pokémon, please wait...", "loading");
    pokemonListContainer.innerHTML = "";
    paginationControls.innerHTML = "";

    try {
      const response = await fetch(`${POKEAPI_BASE_URL}?limit=1500`);
      if (!response.ok) {
        throw new Error(
          `API Error: ${response.status} - ${
            response.statusText || "Unknown error"
          }`
        );
      }
      const data = await response.json();

      allPokemonData = data.results.map((pokemon) => {
        const urlParts = pokemon.url.split("/");
        const id = urlParts[urlParts.length - 2];
        return {
          name: pokemon.name,
          url: pokemon.url,
          id: id,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
        };
      });

      allPokemonData = allPokemonData.filter(
        (p) => p.id && !isNaN(parseInt(p.id))
      );
      totalPages = Math.ceil(allPokemonData.length / ITEMS_PER_PAGE);

      if (totalPages > 0) {
        displayPage(currentPage);
        setupPagination();
      } else {
        displayMessage("No Pokémon found or unable to load list.", "error");
      }
      clearMessages("loading");
    } catch (error) {
      console.error("Failed to fetch Pokémon list:", error);
      displayMessage(`Failed to load Pokémon: ${error.message}`, "error");
      clearMessages("loading");
    }
  }

  function displayPage(page) {
    pokemonListContainer.innerHTML = "";
    currentPage = page;

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pokemonOnPage = allPokemonData.slice(start, end);

    if (pokemonOnPage.length === 0 && page > 1) {
      displayPage(page - 1);
      return;
    }

    let itemDelay = 0;
    pokemonOnPage.forEach((pokemon) => {
      const listItem = document.createElement("div");
      listItem.classList.add("pokemon-list-item");
      listItem.style.animationDelay = `${itemDelay}s`;
      itemDelay += 0.03;

      const img = document.createElement("img");
      img.src = pokemon.sprite;
      img.alt = pokemon.name;
      img.loading = "lazy";
      img.onerror = function () {
        this.onerror = null;
        this.src =
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        this.alt = "Image not found";
        this.style.backgroundColor = "rgba(255,255,255,0.02)";
      };

      const nameEl = document.createElement("h3");
      nameEl.textContent = pokemon.name;

      const idSpan = document.createElement("span");
      idSpan.classList.add("list-item-id");
      idSpan.textContent = `#${String(pokemon.id).padStart(3, "0")}`;

      listItem.appendChild(img);
      listItem.appendChild(nameEl);
      listItem.appendChild(idSpan);

      listItem.addEventListener("click", () => {
        window.location.href = `index.html?pokemon=${pokemon.name}`;
      });

      pokemonListContainer.appendChild(listItem);
    });
    updatePaginationControls();
  }

  function setupPagination() {
    paginationControls.innerHTML = "";
    if (totalPages <= 1) return;

    const prevButton = document.createElement("button");
    prevButton.id = "prevPage";
    prevButton.textContent = "Previous";
    prevButton.addEventListener("click", () => {
      if (currentPage > 1) {
        displayPage(currentPage - 1);
      }
    });

    const nextButton = document.createElement("button");
    nextButton.id = "nextPage";
    nextButton.textContent = "Next";
    nextButton.addEventListener("click", () => {
      if (currentPage < totalPages) {
        displayPage(currentPage + 1);
      }
    });

    const pageInfo = document.createElement("span");
    pageInfo.id = "pageInfo";
    pageInfo.classList.add("page-info");

    paginationControls.appendChild(prevButton);
    paginationControls.appendChild(pageInfo);
    paginationControls.appendChild(nextButton);

    updatePaginationControls();
  }

  function updatePaginationControls() {
    const prevButton = document.getElementById("prevPage");
    const nextButton = document.getElementById("nextPage");
    const pageInfo = document.getElementById("pageInfo");

    if (totalPages <= 1) {
      if (paginationControls) paginationControls.innerHTML = "";
      return;
    }

    if (prevButton) prevButton.disabled = currentPage === 1;
    if (nextButton) nextButton.disabled = currentPage === totalPages;
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
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
      if (errorMessageEl) {
        errorMessageEl.textContent = "";
        errorMessageEl.classList.remove("visible");
      }
    }
    if (type === "all" || type === "loading") {
      if (loadingMessageEl) {
        loadingMessageEl.textContent = "";
        loadingMessageEl.classList.remove("visible");
      }
    }
  }

  fetchAllPokemon();
});
