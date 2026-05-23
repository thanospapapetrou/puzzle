'use strict';

class Puzzle {
    static #CONTEXT = '2d';
    static #PARAMETERS = {
        theme: {name: 'theme', selector: 'select#parameterTheme'},
        rows: {name: 'rows', min: 2, max: 10, selector: 'input#parameterRows'},
        columns: {name: 'columns', min: 2, max: 10, selector: 'input#parameterColumns'},
        example: {name: 'example', selector: 'input#parameterExample'}
    };
    static #SELECTORS = {parameters: 'form#parameters', puzzle: 'canvas#puzzle', info: 'div#info', theme: 'span#theme',
        id: 'span#id', rows: 'span#rows', columns: 'span#columns', time: 'span#time', example: 'canvas#example'};
    static #SIZES = {puzzle: {width: 500, height: 500}, example: {width: 100, height: 100}};

    // TODO
    // slide
    // random image
    // initialization menu
    // borders?

    #puzzle;
    #example;
    #image;
    #tiles;
    #selected;
    #listener;
    #timer;

    static main() {
        const parameters = new URLSearchParams(location.search);
        const theme = Object.keys(Theme).filter((theme) => (theme == parameters.get(Puzzle.#PARAMETERS.theme.name)))[0]
                || null;
        let rows = parseInt(parameters.get(Puzzle.#PARAMETERS.rows.name));
        rows = ((Puzzle.#PARAMETERS.rows.min <= rows) && (rows <= Puzzle.#PARAMETERS.rows.max)) ? rows : null;
        let columns = parseInt(parameters.get(Puzzle.#PARAMETERS.columns.name));
        columns = ((Puzzle.#PARAMETERS.columns.min <= columns) && (columns <= Puzzle.#PARAMETERS.columns.max))
                ? columns: null;
        const example = (parameters.get(Puzzle.#PARAMETERS.example.name) === true.toString());
        (theme != null) && (document.querySelector(Puzzle.#PARAMETERS.theme.selector).value = theme);
        (rows != null) && (document.querySelector(Puzzle.#PARAMETERS.rows.selector).value = rows);
        (columns != null) && (document.querySelector(Puzzle.#PARAMETERS.columns.selector).value = columns);
        (example != null) && (document.querySelector(Puzzle.#PARAMETERS.example.selector).checked = example);
        if ((theme != null) && (rows != null) && (columns != null) && (example != null)) {
            document.querySelector(Puzzle.#SELECTORS.parameters).style.display = Display.NONE;
            new Puzzle(theme, './img/rillaboom.png', 3, 3);
        }
    }

    constructor(theme, img, rows, columns) {
        this.#puzzle = document.querySelector(Puzzle.#SELECTORS.puzzle);
        this.#example = document.querySelector(Puzzle.#SELECTORS.example);
        this.#image = new Image(Puzzle.#SIZES.puzzle.width, Puzzle.#SIZES.puzzle.height);
        this.theme = theme;
        this.rows = rows;
        this.columns = columns;
        this.#tiles = [];
        this.#selected = null;
        this.listener = null;
        this.shuffle();
        const that = this;
        this.#image.onload = function() {
            that.render();
            that.renderOriginal();
            that.#puzzle.style.display = Display.INLINE_BLOCK;
            document.querySelector(Puzzle.#SELECTORS.info).style.display = Display.INLINE_BLOCK;
            that.listener = that.pick.bind(that);
            // TODO pointer
            that.#timer = new Timer(Puzzle.#SELECTORS.time);
        };
        this.#image.src = img;
    }

    set theme(theme) {
        document.querySelector(Puzzle.#SELECTORS.theme).firstChild.nodeValue = Theme[theme];
    }

    get rows() {
        return parseInt(document.querySelector(Puzzle.#SELECTORS.rows).firstChild.nodeValue);
    }

    set rows(rows) {
        document.querySelector(Puzzle.#SELECTORS.rows).firstChild.nodeValue = rows;
    }
    
    get columns() {
        return parseInt(document.querySelector(Puzzle.#SELECTORS.columns).firstChild.nodeValue);
    }
    
    set columns(columns) {
        document.querySelector(Puzzle.#SELECTORS.columns).firstChild.nodeValue = columns;
    }

    get finished() {
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                if ((this.#tiles[row][column].row != row) || (this.#tiles[row][column].column != column)) {
                    return false;
                }
            }
        }
        return true;
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
                        this.#tiles[row][column].column * this.#image.naturalWidth / this.columns,
                        this.#tiles[row][column].row * this.#image.naturalHeight / this.rows,
                        this.#image.naturalWidth / this.columns, this.#image.naturalHeight / this.rows,
                        column * Puzzle.#SIZES.puzzle.width / this.columns,
                        row * Puzzle.#SIZES.puzzle.height / this.rows,
                        Puzzle.#SIZES.puzzle.width / this.columns, Puzzle.#SIZES.puzzle.height / this.rows);
            }
        }
        if (this.finished) {
            this.#timer.stop();
            this.listener = null; // TODO does not stop
            //TODO alert('Well done!');
        }
    }

    pick(event) {
        const row = Math.floor((event.clientY - this.#puzzle.getBoundingClientRect().top)
                / Puzzle.#SIZES.puzzle.height * this.rows);
        const column = Math.floor((event.clientX - this.#puzzle.getBoundingClientRect().left)
                / Puzzle.#SIZES.puzzle.width * this.columns);
        this.#selected = {row, column};
        this.listener = this.swap.bind(this);
    }

    swap() {
        const row = Math.floor((event.clientY - this.#puzzle.getBoundingClientRect().top)
                / Puzzle.#SIZES.puzzle.height * this.rows);
        const column = Math.floor((event.clientX - this.#puzzle.getBoundingClientRect().left)
                / Puzzle.#SIZES.puzzle.width * this.columns);
        if ((this.#selected.row == row) && (this.#selected.column == column)) {
            // TODO do nothing
        } else {
            const tempRow = this.#tiles[this.#selected.row][this.#selected.column].row;
            const tempColumn = this.#tiles[this.#selected.row][this.#selected.column].column;
            this.#tiles[this.#selected.row][this.#selected.column].row = this.#tiles[row][column].row;
            this.#tiles[this.#selected.row][this.#selected.column].column = this.#tiles[row][column].column;
            this.#tiles[row][column].row = tempRow;
            this.#tiles[row][column].column = tempColumn;
            this.render();
        }
        this.#selected = null;
        this.listener = this.pick.bind(this);
    }

    renderOriginal() {
        this.#example.width = Puzzle.#SIZES.example.width;
        this.#example.height = Puzzle.#SIZES.example.height;
        this.#example.getContext(Puzzle.#CONTEXT).drawImage(this.#image,
                0, 0, this.#image.naturalWidth, this.#image.naturalHeight,
                0, 0, this.#example.width, this.#example.height);
    }

    shuffle() {
        for (let row = 0; row < this.rows; row++) {
            this.#tiles[row] = [];
            for (let column = 0; column < this.columns; column++) {
                this.#tiles[row][column] = {row, column};
            }
        }
        for (let k = this.rows * this.columns - 1; k >= 0; k--) {
            const l = Math.floor(Math.random() * (k + 1));
            const krow = Math.floor(k / this.columns);
            const kcol = k % this.columns;
            const lrow = Math.floor(l / this.columns);
            const lcol = l % this.columns;
            const tempRow = this.#tiles[krow][kcol].row;
            const tempColumn = this.#tiles[krow][kcol].column;
            this.#tiles[krow][kcol].row = this.#tiles[lrow][lcol].row;
            this.#tiles[krow][kcol].column = this.#tiles[lrow][lcol].column;
            this.#tiles[lrow][lcol].row = tempRow;
            this.#tiles[lrow][lcol].column = tempColumn;
        }
        console.log(this.#tiles);
    }
}
