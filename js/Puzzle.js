'use strict';

class Puzzle {
    static #BORDER = {width: 1, selected: 15, color: 'black', style: 'square'};
    static #CONTEXT = '2d';
    static #FORMAT = (id) => `#${id.toString().padStart(4, '0')}`;
    static #MESSAGE = {
        id: (id) => `ID: ${id}`,
        tiles: (tiles) => `Tiles: ${JSON.stringify(tiles)}`,
        wellDone: 'Well done!'
    };
    static #PARAMETERS = {
        theme: {name: 'theme', selector: 'select#parameterTheme'},
        rows: {name: 'rows', min: 2, max: 10, selector: 'input#parameterRows'},
        columns: {name: 'columns', min: 2, max: 10, selector: 'input#parameterColumns'},
        example: {name: 'example', selector: 'input#parameterExample'},
        id: {name: 'id'}
    };
    static #SELECTORS = {parameters: 'form#parameters', main: 'div#main', title: 'h2#title',
        description: 'h3#description', puzzle: 'canvas#puzzle', info: 'div#info', theme: 'span#theme', id: 'span#id',
        rows: 'span#rows', columns: 'span#columns', time: 'span#time', example: 'canvas#example'};
    static #SIZES = {puzzle: {width: 600, height: 600}, example: {width: 300, height: 300}};

    // TODO
    // slide
    // do not distort image

    #puzzle;
    #example;
    #image;
    #tiles;
    #timer;
    #listener;
    #cursor;

    static async main() {
        const parameters = new URLSearchParams(location.search);
        const theme = Object.keys(await Theme).filter((theme) => (theme == parameters.get(Puzzle.#PARAMETERS.theme.name)))[0]
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
            let id = parseInt(parameters.get(Puzzle.#PARAMETERS.id.name));
            const puzzles = (await Theme)[theme].puzzles;
            id = (id < puzzles.length) ? id : Math.floor(Math.random() * puzzles.length);
            document.querySelector(Puzzle.#SELECTORS.parameters).style.display = Display.NONE;
            new Puzzle((await Theme)[theme], id, rows, columns, example);
        }
    }

    constructor(theme, id, rows, columns, example) {
        this.#puzzle = document.querySelector(Puzzle.#SELECTORS.puzzle);
        this.#example = document.querySelector(Puzzle.#SELECTORS.example);
        this.#image = new Image(Puzzle.#SIZES.puzzle.width, Puzzle.#SIZES.puzzle.height);
        this.title = theme.puzzles[id].title;
        this.description = theme.puzzles[id].description;
        this.theme = theme;
        this.id = id;
        this.rows = rows;
        this.columns = columns;
        this.shuffle();
        this.selected = null;
        this.listener = null;
        this.#image.onload = function() {
            if (example) {
                this.#example.width = Puzzle.#SIZES.example.width;
                this.#example.height = Puzzle.#SIZES.example.height;
                this.#example.getContext(Puzzle.#CONTEXT).drawImage(this.#image,
                        0, 0, this.#image.naturalWidth, this.#image.naturalHeight,
                        0, 0, this.#example.width, this.#example.height);
            }
            this.#timer = new Timer(Puzzle.#SELECTORS.time);
            this.render();
            document.body.style.cursor = Cursor.DEFAULT;
            this.#puzzle.style.cursor = Cursor.GRAB;
            this.listener = this.pick.bind(this);
            document.querySelector(Puzzle.#SELECTORS.main).style.display = Display.INLINE_BLOCK;
            document.querySelector(Puzzle.#SELECTORS.info).style.display = Display.INLINE_BLOCK;
        }.bind(this);
        document.body.style.cursor = Cursor.WAIT;
        this.#image.src = theme.puzzles[id].url;
    }

    set title(title) {
        document.querySelector(Puzzle.#SELECTORS.title).firstChild.nodeValue = title;
    }

    set description(description) {
        document.querySelector(Puzzle.#SELECTORS.description).firstChild.nodeValue = description;
    }

    set theme(theme) {
        document.querySelector(Puzzle.#SELECTORS.theme).firstChild.nodeValue = theme.name;
    }

    set id(id) {
        console.log(Puzzle.#MESSAGE.id(Puzzle.#FORMAT(id)));
        document.querySelector(Puzzle.#SELECTORS.id).firstChild.nodeValue = Puzzle.#FORMAT(id);
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

    get selected() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                if (this.#tiles[i][j].selected) {
                    return {row: i, column: j};
                }
            }
        }
        return null;
    }

    set selected(tile) {
        this.selected && (this.#tiles[this.selected.row][this.selected.column].selected = false);
        tile && (this.#tiles[tile.row][tile.column].selected = true);
        this.render();
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
        this.#puzzle.removeEventListener(Event.MOUSE_DOWN, this.#listener);
        this.#listener = listener;
        this.#puzzle.addEventListener(Event.MOUSE_DOWN, this.#listener);
    }

    set cursor(cursor) {
        this.#puzzle.removeEventListener(Event.MOUSE_MOVE, this.#cursor);
        this.#cursor = cursor;
        this.#puzzle.addEventListener(Event.MOUSE_MOVE, this.#cursor);
    }

    render() {
        this.#puzzle.width = this.#image.width;
        this.#puzzle.height = this.#image.height;
        const context = this.#puzzle.getContext(Puzzle.#CONTEXT);
        context.strokeStyle = Puzzle.#BORDER.color;
        context.lineCap = Puzzle.#BORDER.style;
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                context.drawImage(this.#image,
                        this.#tiles[row][column].column * this.#image.naturalWidth / this.columns,
                        this.#tiles[row][column].row * this.#image.naturalHeight / this.rows,
                        this.#image.naturalWidth / this.columns, this.#image.naturalHeight / this.rows,
                        column * Puzzle.#SIZES.puzzle.width / this.columns,
                        row * Puzzle.#SIZES.puzzle.height / this.rows,
                        Puzzle.#SIZES.puzzle.width / this.columns, Puzzle.#SIZES.puzzle.height / this.rows);
                if (!this.finished) {
                    context.beginPath();
                    context.lineWidth = this.#tiles[row][column].selected ? Puzzle.#BORDER.selected
                            : Puzzle.#BORDER.width;
                    // left border
                    if (this.#tiles[row][column].selected || (column == 0)
                            || (this.#tiles[row][column - 1].row != this.#tiles[row][column].row)
                            || (this.#tiles[row][column - 1].column != this.#tiles[row][column].column - 1)) {
                        context.moveTo(column * Puzzle.#SIZES.puzzle.width / this.columns + context.lineWidth / 2,
                                row * Puzzle.#SIZES.puzzle.height / this.rows + context.lineWidth / 2);
                        context.lineTo(column * Puzzle.#SIZES.puzzle.width / this.columns + context.lineWidth / 2,
                                (row + 1) * Puzzle.#SIZES.puzzle.height / this.rows - context.lineWidth / 2);
                    }
                    // bottom border
                    if (this.#tiles[row][column].selected || (row == this.rows - 1)
                            || (this.#tiles[row + 1][column].row != this.#tiles[row][column].row + 1)
                            || (this.#tiles[row + 1][column].column != this.#tiles[row][column].column)) {
                        context.moveTo(column * Puzzle.#SIZES.puzzle.width / this.columns + context.lineWidth / 2,
                                (row + 1) * Puzzle.#SIZES.puzzle.height / this.rows - context.lineWidth / 2);
                        context.lineTo((column + 1) * Puzzle.#SIZES.puzzle.width / this.columns - context.lineWidth / 2,
                                (row + 1) * Puzzle.#SIZES.puzzle.height / this.rows - context.lineWidth / 2);
                    }
                    // right border
                    if (this.#tiles[row][column].selected || (column == this.columns - 1)
                            || (this.#tiles[row][column + 1].row != this.#tiles[row][column].row)
                            || (this.#tiles[row][column + 1].column != this.#tiles[row][column].column + 1)) {
                        context.moveTo((column + 1) * Puzzle.#SIZES.puzzle.width / this.columns - context.lineWidth / 2,
                                (row + 1) * Puzzle.#SIZES.puzzle.height / this.rows - context.lineWidth / 2);
                        context.lineTo((column + 1) * Puzzle.#SIZES.puzzle.width / this.columns - context.lineWidth / 2,
                                row * Puzzle.#SIZES.puzzle.height / this.rows + context.lineWidth / 2);
                    }
                    // top border
                    if (this.#tiles[row][column].selected || (row == 0)
                            || (this.#tiles[row - 1][column].row != this.#tiles[row][column].row - 1)
                            || (this.#tiles[row - 1][column].column != this.#tiles[row][column].column)) {
                        context.moveTo((column + 1) * Puzzle.#SIZES.puzzle.width / this.columns - context.lineWidth / 2,
                                row * Puzzle.#SIZES.puzzle.height / this.rows + context.lineWidth / 2);
                        context.lineTo(column * Puzzle.#SIZES.puzzle.width / this.columns + context.lineWidth / 2,
                                row * Puzzle.#SIZES.puzzle.height / this.rows + context.lineWidth / 2);

                    }
                    context.stroke();
                }
            }
        }
    }

    pick(event) {
        const row = Math.floor((event.clientY - this.#puzzle.getBoundingClientRect().top)
                / Puzzle.#SIZES.puzzle.height * this.rows);
        const column = Math.floor((event.clientX - this.#puzzle.getBoundingClientRect().left)
                / Puzzle.#SIZES.puzzle.width * this.columns);
        this.selected = {row, column};
        this.cursor = this.drop.bind(this);
        this.listener = this.swap.bind(this);
    }

    swap(event) {
        const row = Math.floor((event.clientY - this.#puzzle.getBoundingClientRect().top)
                / Puzzle.#SIZES.puzzle.height * this.rows);
        const column = Math.floor((event.clientX - this.#puzzle.getBoundingClientRect().left)
                / Puzzle.#SIZES.puzzle.width * this.columns);
        if (!this.#tiles[row][column].selected) {
            [this.#tiles[this.selected.row][this.selected.column].row, this.#tiles[row][column].row] =
                    [this.#tiles[row][column].row, this.#tiles[this.selected.row][this.selected.column].row];
            [this.#tiles[this.selected.row][this.selected.column].column, this.#tiles[row][column].column] =
                    [this.#tiles[row][column].column, this.#tiles[this.selected.row][this.selected.column].column];
            this.selected = null;
            this.cursor = null;
            this.#puzzle.style.cursor = this.finished ? Cursor.DEFAULT : Cursor.GRAB;
            this.listener = this.finished ? null : this.pick.bind(this);
            if (this.finished) {
                this.#timer.stop();
                setTimeout(() => alert(Puzzle.#MESSAGE.wellDone));
            }
        }
    }

    drop(event) {
        const row = Math.floor((event.clientY - this.#puzzle.getBoundingClientRect().top)
                / Puzzle.#SIZES.puzzle.height * this.rows);
        const column = Math.floor((event.clientX - this.#puzzle.getBoundingClientRect().left)
                / Puzzle.#SIZES.puzzle.width * this.columns);
        this.#puzzle.style.cursor = this.#tiles[row][column].selected ? Cursor.NO_DROP : Cursor.GRABBING;
    }

    shuffle() {
        this.#tiles = [];
        for (let row = 0; row < this.rows; row++) {
            this.#tiles[row] = [];
            for (let column = 0; column < this.columns; column++) {
                this.#tiles[row][column] = {row: row, column: column, selected: false};
            }
        }
        for (let k = this.rows * this.columns - 1; k > 0; k--) {
            const l = Math.floor(Math.random() * k);
            [this.#tiles[Math.floor(k / this.columns)][k % this.columns].row,
                    this.#tiles[Math.floor(l / this.columns)][l % this.columns].row] =
                    [this.#tiles[Math.floor(l / this.columns)][l % this.columns].row,
                    this.#tiles[Math.floor(k / this.columns)][k % this.columns].row];
            [this.#tiles[Math.floor(k / this.columns)][k % this.columns].column,
                    this.#tiles[Math.floor(l / this.columns)][l % this.columns].column] =
                    [this.#tiles[Math.floor(l / this.columns)][l % this.columns].column,
                    this.#tiles[Math.floor(k / this.columns)][k % this.columns].column];
        }
        console.log(Puzzle.#MESSAGE.tiles(this.#tiles));
    }
}
