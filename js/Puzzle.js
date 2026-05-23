'use strict';

class Puzzle {
    static #CONTEXT = '2d';
    static #SELECTORS = {columns: 'span#columns', rows: 'span#rows'};
    static #TILE = {width: 100, height: 100};

    // TODO
    // timer
    // #state -> #tiles
    // alert win
    // slide
    // random image
    // initialization menu
    // #example -> #example

    #puzzle;
    #example;
    #image;
    #state;
    #selected;
    #listener;

    static main() {
        new Puzzle('./img/rillaboom.png', 2, 3);
    }

    constructor(img, rows, columns) {
        this.#puzzle = document.querySelector('canvas#puzzle');
        this.#example = document.querySelector('canvas#example');
        this.#image = new Image(columns * Puzzle.#TILE.width, rows * Puzzle.#TILE.height);
        this.rows = rows;
        this.columns = columns;
        this.#state = [];
        this.#selected = null;
        this.listener = null;
        this.shuffle();
        const that = this;
        this.#image.onload = function() {
            that.render();
            that.renderOriginal();
            that.listener = that.pick.bind(that);
            // TODO pointer
        };
        this.#image.src = img;
    }

    get rows() {
        return Number(document.querySelector(Puzzle.#SELECTORS.rows).firstChild.nodeValue);
    }

    set rows(rows) {
        document.querySelector(Puzzle.#SELECTORS.rows).firstChild.nodeValue = rows;
    }
    
    get columns() {
        return Number(document.querySelector(Puzzle.#SELECTORS.columns).firstChild.nodeValue);
    }
    
    set columns(columns) {
        document.querySelector(Puzzle.#SELECTORS.columns).firstChild.nodeValue = columns;
    }

    set listener(listener) {
        this.#puzzle.removeEventListener('mousedown', this.#listener);
        this.#listener = listener;
        this.#puzzle.addEventListener('mousedown', this.#listener);
    }

    render() {
        this.#puzzle.width = this.#image.width;
        this.#puzzle.height = this.#image.height;
        const context = this.#puzzle.getContext(Puzzle.#CONTEXT);
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                context.drawImage(this.#image,
                        this.#state[row][column].column * this.#image.naturalWidth / this.columns,
                        this.#state[row][column].row * this.#image.naturalHeight / this.rows,
                        this.#image.naturalWidth / this.columns, this.#image.naturalHeight / this.rows,
                        column * Puzzle.#TILE.width, row * Puzzle.#TILE.height,
                        Puzzle.#TILE.width, Puzzle.#TILE.height);
            }
        }
    }

    pick(event) {
        const row = Math.floor((event.clientY - this.#puzzle.getBoundingClientRect().top) / Puzzle.#TILE.height);
        const column = Math.floor((event.clientX - this.#puzzle.getBoundingClientRect().left) / Puzzle.#TILE.width);
        this.#selected = {row, column};
        this.listener = this.swap.bind(this);
    }

    swap() {
        const row = Math.floor((event.clientY - this.#puzzle.getBoundingClientRect().top) / Puzzle.#TILE.height);
        const column = Math.floor((event.clientX - this.#puzzle.getBoundingClientRect().left) / Puzzle.#TILE.width);
        if ((this.#selected.row == row) && (this.#selected.column == column)) {
            // TODO do nothing
        } else {
            const tempRow = this.#state[this.#selected.row][this.#selected.column].row;
            const tempColumn = this.#state[this.#selected.row][this.#selected.column].column;
            this.#state[this.#selected.row][this.#selected.column].row = this.#state[row][column].row;
            this.#state[this.#selected.row][this.#selected.column].column = this.#state[row][column].column;
            this.#state[row][column].row = tempRow;
            this.#state[row][column].column = tempColumn;
            this.render();
        }
        this.#selected = null;
        this.listener = this.pick.bind(this);
    }

    renderOriginal() {
        this.#example.width = this.#image.width;
        this.#example.height = this.#image.height;
        this.#example.getContext(Puzzle.#CONTEXT).drawImage(this.#image,
                0, 0, this.#image.naturalWidth, this.#image.naturalHeight,
                0, 0, this.#example.width, this.#example.height);
    }

    shuffle() {
        for (let row = 0; row < this.rows; row++) {
            this.#state[row] = [];
            for (let column = 0; column < this.columns; column++) {
                this.#state[row][column] = {row, column};
            }
        }
        for (let k = this.rows * this.columns - 1; k >= 0; k--) {
            const l = Math.floor(Math.random() * (k + 1));
            const krow = Math.floor(k / this.columns);
            const kcol = k % this.columns;
            const lrow = Math.floor(l / this.columns);
            const lcol = l % this.columns;
            const tempRow = this.#state[krow][kcol].row;
            const tempColumn = this.#state[krow][kcol].column;
            this.#state[krow][kcol].row = this.#state[lrow][lcol].row;
            this.#state[krow][kcol].column = this.#state[lrow][lcol].column;
            this.#state[lrow][lcol].row = tempRow;
            this.#state[lrow][lcol].column = tempColumn;
        }
        console.log(this.#state);
    }
}
