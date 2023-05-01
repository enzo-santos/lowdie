const {getRandomInt, shuffle} = require("./utils");

export namespace ttt {
    export abstract class Piece {
        private readonly value: string

        static decode(value: string): Piece | null {
            const norm = value.toLowerCase();
            return norm === "x" ? X : norm === "o" ? O : null;
        }

        protected constructor(value: string) {
            this.value = value;
        }

        abstract opponent(): Piece;

        toString(): string {
            return this.value;
        }
    }
    export class BoardDifficulty {
        static readonly EASY = new BoardDifficulty(0);
        static readonly NORMAL = new BoardDifficulty(1);
        static readonly HARD = new BoardDifficulty(2);

        public static decode(value: string): BoardDifficulty | null {
            const norm = value.toLowerCase();
            switch (norm) {
                case "easy": return this.EASY;
                case "normal": return this.NORMAL;
                case "hard": return this.HARD;
                default: return null;
            }
        }

        private readonly value: number

        constructor(value: number) {
            this.value = value;
        }
    }
    export enum BoardEncoding { ASCII, PRETTY }
    export abstract class Board {
        /**
         * The overlying 3x3 matrix of this board.
         */
        protected readonly matrix: BoardMatrix

        /**
         * Create an empty board.
         * @returns {Board} the empty board.
         */
        static empty(difficulty: BoardDifficulty): Board {
            const matrix = [
                [null, null, null],
                [null, null, null],
                [null, null, null]
            ];

            switch (difficulty) {
                case BoardDifficulty.EASY: return new EasyBoard(matrix);
                case BoardDifficulty.NORMAL: return new NormalBoard(matrix);
                case BoardDifficulty.HARD: return new HardBoard(matrix);
            }
        }

        protected constructor(matrix: BoardMatrix) {
            this.matrix = matrix;
        }

        /**
         * Try to insert a piece into a given position notation on the board.
         * @param piece the piece to be inserted.
         * @param r the letter representing the row, where the first row is A and the third is C.
         * @param c the number representing the column, where the first column is 1 and the third is 3.
         * @returns {boolean} if the piece was inserted successfully (i.e. if the given position was empty).
         */
        insertPosition(piece: Piece, r: string, c: number): boolean {
            const x = r.charCodeAt(0) - 65;
            if (x < 0 || x > 2) return false;
            const y = c - 1;
            if (y < 0 || y > 2) return false;

            if (this.matrix[x][y] !== null) {
                return false;
            }
            this.matrix[x][y] = piece;
            return true;
        }

        /**
         * Try to insert a random piece into a empty slot in the board.
         * @param piece the piece to be inserted.
         * @returns {boolean} if the piece was inserted successfully (i.e. if there were any empty slots in the board).
         */
        insertRandom(piece: Piece): boolean {
            const emptyPositions = this.matrix.flatMap((row, x) => {
                return row
                    .map((piece, y) => piece === null ? y : null)
                    .filter((y) => y !== null)
                    .map((y) => [x, y]);
            });
            if (!emptyPositions.length) {
                return false;
            }

            const i = getRandomInt(0, emptyPositions.length - 1);
            const [x, y] = emptyPositions[i];
            this.matrix[x][y] = piece;
            return true;
        }

        /**
         * Yield the indices of all the eight possible lines in this board.
         * @returns {Generator<*[]|*, void, *>} indices of the three rows, the three columns and the two diagonals from the board.
         */
        *indices(): Generator<Array<Pair<number>>> {
            let idx = [];

            // Yield rows
            for (let x = 0; x < 3; x++) {
                idx = [];
                for (let y = 0; y < 3; y++) {
                    idx.push([x, y]);
                }
                yield idx;
            }

            // Yield columns
            for (let y = 0; y < 3; y++) {
                idx = [];
                for (let x = 0; x < 3; x++) {
                    idx.push([x, y]);
                }
                yield idx;
            }

            // Yield diagonals
            for (let i = 0; i < 2; i++) {
                idx = [];
                for (let j = 0; j < 3; j++) {
                    idx.push([j, 2*i*(1-j)+j]);
                }
                yield idx;
            }
        }

        /**
         * Select a slot on the board using some strategy.
         * @param piece the piece to be defined.
         * @returns {boolean} if the move was made successfully (i.e. if there were any empty slots in the board).
         */
        abstract move(piece: Piece): boolean;

        isFull(): boolean {
            return this.size() === 9;
        }

        size(): number {
            let count = 0;
            for (let idx of this.indices()) {
                const line = idx.map(([x, y]) => this.matrix[x][y]);
                line.forEach(piece => count += piece === null ? 0 : 1);
            }
            return count;
        }

        isSolved(): boolean {
            for (const idx of this.indices()) {
                const line = idx.map(([x, y]) => this.matrix[x][y]);
                const v0 = line[0];
                if (v0 !== null && line.every(v => v === v0)) {
                    return true;
                }
            }
            return false;
        }

        private prettyEncode(): string {
            const xLabels = ["1", "2", "3"];
            const yLabels = ["A", "B", "C"];

            const text = [];
            for (let i = 0; i < 3; i++) {
                if (i === 0) {
                    text.push("╔══━╋━━━╋━━━╋━━━╋━");
                } else {
                    text.push("╠══━╋━━━╋━━━╋━━━╋━");
                }

                let line = "║ ";
                line += `${yLabels[i]} ┃ `;
                for (let j = 0; j < 3; j++) {
                    const value = this.matrix[i][j] === null ? " " : this.matrix[i][j];
                    line += `${value} ┃ `;
                }
                text.push(line);
            }
            text.push("╚══━╋━━━╋━━━╋━━━╋━");

            let line = "    ║ ";
            for (let i = 0; i < 3; i++) {
                line += `${xLabels[i]} ║ `;
            }
            text.push(line);

            text.push("    ╚═══╩═══╩═══╝");
            return text.join("\n");
        }

        private asciiEncode(): string {
            const xLabels = ["1", "2", "3"];
            const yLabels = ["A", "B", "C"];

            const text = [];
            for (let i = 0; i < 3; i++) {
                if (i > 0) {
                    text.push("+---+---+---+---");
                }

                let line = "| ";
                line += `${yLabels[i]} | `;
                for (let j = 0; j < 3; j++) {
                    const value = this.matrix[i][j] === null ? " " : this.matrix[i][j];
                    if (j < 2) {
                        line += `${value} | `;
                    } else {
                        line += `${value}`;
                    }
                }
                text.push(line);
            }
            text.push("+---+---+---+---+");

            let line = "    | ";
            for (let i = 0; i < 3; i++) {
                line += `${xLabels[i]} | `;
            }
            text.push(line);

            text.push("    +---+---+---+");
            return text.join("\n");
        }

        encode(encoding: BoardEncoding = BoardEncoding.ASCII): string {
            switch (encoding) {
                case BoardEncoding.ASCII: return this.asciiEncode();
                case BoardEncoding.PRETTY: return this.prettyEncode();
            }
        }
    }
}

type Pair<T> = Array<T>;
type BoardMatrix = Array<Array<ttt.Piece | null>>;

class XPiece extends ttt.Piece {
    constructor() {
        super("X");
    }

    opponent(): ttt.Piece {
        return O;
    }
}
class OPiece extends ttt.Piece {
    constructor() {
        super("O");
    }

    opponent(): ttt.Piece {
        return X;
    }
}

const X = new XPiece();
const O = new OPiece();

class EasyBoard extends ttt.Board {
    constructor(matrix: BoardMatrix) {
        super(matrix);
    }

    move(piece: ttt.Piece): boolean {
        // Just insert randomly
        return this.insertRandom(piece);
    }
}
class NormalBoard extends ttt.Board {
    constructor(matrix: BoardMatrix) {
        super(matrix);
    }

    move(piece: ttt.Piece): boolean {
        const opponentPiece = piece.opponent();
        for (let idx of this.indices()) {
            const line = idx.map(([x, y]) => this.matrix[x][y]);

            // Count the occurrence of each piece in this line
            const info: Map<ttt.Piece | null, number> = new Map();
            line.forEach((piece) => {
                const count = info.get(piece) || 1;
                info.set(piece, count + 1);
            });

            // Check if there is a favourable one-to-win situation
            // If there is, insert a piece in the remaining slot and win the game
            if (info.get(piece) === 2 && info.get(null) === 1) {
                const i = line.indexOf(null);
                const [x, y] = idx[i];
                this.matrix[x][y] = piece;
                return true;
            }

            // Check if there is an unfavourable one-to-win situation
            // If there is, insert a piece in the remaining slot to block the opponent
            if (info.get(opponentPiece) === 2 && info.get(null) === 1) {
                const i = line.indexOf(null);
                const [x, y] = idx[i];
                this.matrix[x][y] = piece;
                return true;
            }
        }

        // If there is no one-to-win situation, pick a random position
        return this.insertRandom(piece);
    }
}
class HardBoard extends ttt.Board {
    constructor(matrix: BoardMatrix) {
        super(matrix);
    }

    move(piece: ttt.Piece): boolean {
        const opponentPiece = piece.opponent();
        for (let idx of this.indices()) {
            const line = idx.map(([x, y]) => this.matrix[x][y]);

            // Count the occurrence of each piece in this line
            const info: Map<ttt.Piece | null, number> = new Map();
            line.forEach((piece) => {
                const count = info.get(piece) || 1;
                info.set(piece, count + 1);
            });

            // Check if there is a favourable one-to-win situation
            // If there is, insert a piece in the remaining slot and win the game
            if (info.get(piece) === 2 && info.get(null) === 1) {
                const i = line.indexOf(null);
                const [x, y] = idx[i];
                this.matrix[x][y] = piece;
                return true;
            }

            // Check if there is an unfavourable one-to-win situation
            // If there is, insert a piece in the remaining slot to block the opponent
            if (info.get(opponentPiece) === 2 && info.get(null) === 1) {
                const i = line.indexOf(null);
                const [x, y] = idx[i];
                this.matrix[x][y] = piece;
                return true;
            }
        }

        switch (this.size()) {
            // If it's X, insert at a corner
            case 0:
            case 2:
            case 4: {
                const idx = shuffle([[0, 0], [0, 2], [2, 0], [2, 2]]);
                for (const [x, y] of idx) {
                    if (this.matrix[x][y] !== null) {
                        continue;
                    }

                    this.matrix[x][y] = piece;
                    return true;
                }
            }
        }
        return this.insertRandom(piece);
    }
}