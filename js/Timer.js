'use strict';

class Timer {
    static #FORMAT = (min, s) => `${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    static #MS_PER_S = 1000;
    static #S_PER_MIN = 60;

    #element;
    #start;
    #interval;

    constructor(element) {
        this.#element = document.querySelector(element);
        this.#start = new Date();
        this.#interval = setInterval(this.#update.bind(this), Timer.#MS_PER_S);
        this.#update();
    }

    stop() {
        clearInterval(this.#interval);
    }

    #update() {
        const seconds = Math.floor((new Date() - this.#start) / Timer.#MS_PER_S);
        this.#element.firstChild.nodeValue = Timer.#FORMAT(Math.floor(seconds / Timer.#S_PER_MIN), seconds % Timer.#S_PER_MIN);
    }
}
