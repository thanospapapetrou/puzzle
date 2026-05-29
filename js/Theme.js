'use strict';

const ERROR_LOADING = (theme, status) => `Error loading theme ${theme}: HTTP status ${status}`;

async function load(theme) {
    const response = await fetch(theme);
    if (!response.ok) {
        throw new Error(ERROR_LOADING(theme, response.status));
    }
    return response.json();
}

const Theme = (async () => {
    return {
        ANIMALS: {name: '🦒 Animals', puzzles: (await load('./json/animals.json'))},
        ART: {name: '🎨 Art', puzzles: (await load('./json/art.json'))},
        POKEMON: {name: '👾 Pokémon', puzzles: (await load('./json/pokemon.json'))}
    };
})();
