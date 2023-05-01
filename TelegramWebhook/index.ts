import {ttt} from './tictactoe';

const {getRandomInt} = require('./utils');

type TicTacToeSetupState = {
  name: 'tic-tac-toe',
  startMove: 'You' | 'I',
  difficultyLabel: 'easy' | 'normal' | 'hard'
};
type TicTacToeState = {
  name: 'tic-tac-toe',
  difficulty: ttt.BoardDifficulty,
  piece: ttt.Piece,
  board?: ttt.Board,
};
type RockPaperScissorsState = {
  name: 'rock-paper-scissors',
  move?: 'rock' | 'paper' | 'scissors',
};
type GameState = TicTacToeSetupState | TicTacToeState | RockPaperScissorsState;

type ChatContext = { key: BotState, game?: GameState };

type TextPlayerInput = { type: 'text', options: string[] };
type CardPlayerInput = { type: 'card', options: string[] };
type NonePlayerInput = { type: 'none' };
export type PlayerInput = TextPlayerInput | CardPlayerInput | NonePlayerInput;

abstract class BotState {
  abstract texts(context: ChatContext): Generator<string, void, void>;

  abstract onUserQuestion(context: ChatContext): PlayerInput;

  abstract onUserAnswer(context: ChatContext, label: string): BotState;
}

namespace GeneralStates {
  export class StartConversationState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      yield 'Hi! I\'m Lowdie, but you can call me Lodi. I\'m pretty sure we\'re gonna have fun! So, what we\'re gonna play?';
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return {type: 'card', options: ['Rock-paper-scissors', 'Tic-tac-toe']};
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      switch (label) {
        case 'Tic-tac-toe':
          return BotStates.TTT_SETUP_SETTINGS;
        case 'Rock-paper-scissors':
          return BotStates.RPS_USER_MOVE;
        default:
          return BotStates.BOT_INVALID_STATE;
      }
    }
  }

  export class ResumeConversationState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      yield 'What we\'re gonna play now?';
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return BotStates.BOT_START_CONVERSATION.onUserQuestion(context);
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      return BotStates.BOT_START_CONVERSATION.onUserAnswer(context, label);
    }
  }

  export class InvalidState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      yield 'Hey, that\'s invalid!';
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return {type: 'none'};
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      return context.key.onUserAnswer(context, label);
    }
  }
}
namespace RockPaperScissorsStates {
  export class UserMoveState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      yield 'Select your move.';
      context.game = {name: 'rock-paper-scissors'};
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return {type: 'card', options: ['Rock', 'Paper', 'Scissors']};
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      label = label.toLowerCase();
      if (label === 'rock' || label === 'paper' || label == 'scissors') {
        (context.game as RockPaperScissorsState).move = label;
        return BotStates.RPS_BOT_MOVE;
      }
      return BotStates.BOT_INVALID_STATE;
    }
  }

  export class BotMoveState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      const playerMove = (context.game as RockPaperScissorsState).move!.toLowerCase();
      const move = ['rock', 'paper', 'scissors'][getRandomInt(0, 2)];
      const wins = {'rock': 'scissors', 'paper': 'rock', 'scissors': 'paper'}
      if (move === playerMove) {
        yield `Since I would play ${move}, it's a tie!`;
      } else if (wins[move] === playerMove) {
        yield `Since I would play ${move}, I've won!`;
      } else {
        yield `Since I would play ${move}, you've won!`;
      }

      delete context.game;
      yield* BotStates.RPS_POST_GAME.texts(context);
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return BotStates.RPS_POST_GAME.onUserQuestion(context);
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      return BotStates.RPS_POST_GAME.onUserAnswer(context, label);
    }
  }

  export class PostGameState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      yield 'Wanna play again?';
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return {type: 'card', options: ['Of course!', 'No, thanks.']};
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      switch (label) {
        case 'Of course!':
          return BotStates.RPS_USER_MOVE;
        case 'No, thanks.':
          return BotStates.BOT_RESUME_CONVERSATION;
        default:
          return BotStates.BOT_INVALID_STATE;
      }
    }
  }
}
namespace TicTacToeStates {
  export class SetupSettingsState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      yield 'Let\'s set things up.';

      context.game = {
        name: 'tic-tac-toe',
        startMove: 'You',
        difficultyLabel: 'normal',
      };
      yield* BotStates.TTT_SETTINGS.texts(context);
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return {type: 'none'};
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      return BotStates.TTT_SETTINGS.onUserAnswer(context, label);
    }
  }

  export class SettingsState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      const game = context.game as TicTacToeSetupState;
      const msg = [
        `- ${game.startMove} will start playing. (send \`/startmove [you|me]\` to change).`,
        `- My difficulty is ${game.difficultyLabel}. (send \`/difficulty [easy|normal|hard]\` to change).`,
        '',
        'If everything is OK, just send OK.',
      ];
      yield msg.join('\n');
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return {type: 'none'};
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      const game = context.game as TicTacToeSetupState;

      const match = label.match(/\/(piece|startmove|difficulty) (\w+)/)
      if (match === null) {
        if (label.toLowerCase() === 'ok') {
          const piece = game.startMove === 'I' ? 'O' : 'X';
          context.game = {
            name: game.name,
            piece: ttt.Piece.decode(piece),
            difficulty: ttt.BoardDifficulty.decode(game.difficultyLabel),
          };

          switch (game.startMove) {
            case 'I':
              return BotStates.TTT_BOT_GAME_STARTED;
            case 'You':
              return BotStates.TTT_PLAYER_GAME_STARTED;
          }
        }
        return BotStates.BOT_INVALID_STATE;
      }

      const arg = match[2].toLowerCase();
      switch (match[1]) {
        case 'startmove': {
          if (['you', 'me'].indexOf(arg) >= 0) {
            game.startMove = {you: 'I', me: 'You'}[arg];
            break;
          }
          return BotStates.BOT_INVALID_STATE;
        }
        case 'difficulty': {
          if (arg === 'easy' || arg === 'normal' || arg == 'hard') {
            game.difficultyLabel = arg;
            break;
          }
          return BotStates.BOT_INVALID_STATE;
        }
        default:
          return BotStates.BOT_INVALID_STATE;
      }
      return BotStates.TTT_SETTINGS;
    }
  }

  export class GameStartedState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      const game = context.game as TicTacToeState;
      game.board = ttt.Board.empty(game.difficulty);
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return {type: 'none'};
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      return BotStates.TTT_GAME_ON_PROGRESS.onUserAnswer(context, label);
    }
  }

  export class BotGameStartedState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      yield* BotStates.TTT_GAME_STARTED.texts(context);

      const game = context.game as TicTacToeState;
      const board = game.board;
      const userPiece = game.piece;
      const cpuPiece = userPiece.opponent();
      board.insertRandom(cpuPiece);

      yield* BotStates.TTT_GAME_ON_PROGRESS.texts(context);
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return {type: 'none'};
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      return BotStates.TTT_GAME_STARTED.onUserAnswer(context, label);
    }
  }

  export class PlayerGameStartedState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      yield* BotStates.TTT_GAME_STARTED.texts(context);
      yield* BotStates.TTT_GAME_ON_PROGRESS.texts(context);
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return {type: 'none'};
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      return BotStates.TTT_GAME_STARTED.onUserAnswer(context, label);
    }
  }

  export class GameOnProgressState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      const game = context.game as TicTacToeState;

      const board = game.board;
      yield `\`\`\`\n${board.encode()}\`\`\``;
      yield 'Your turn.';
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return {type: 'none'};
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      const match = label.trim().match(/(\w)(\d)/);

      // If the user enters an invalid position
      if (match === null) {
        return BotStates.TTT_INVALID_INPUT_POSITION;
      }

      const game = context.game as TicTacToeState;
      const piece = game.piece;
      const board = game.board;
      const [letter, number] = match.slice(1, 3);
      const [r, c] = [letter.toLowerCase(), number];

      if (['a', 'b', 'c'].indexOf(r) === -1) {
        return BotStates.TTT_OUT_OF_BOUNDS_INPUT_POSITION;
      }
      if (['1', '2', '3'].indexOf(c) === -1) {
        return BotStates.TTT_OUT_OF_BOUNDS_INPUT_POSITION;
      }

      // If the user tries to insert in a position that already has a piece
      // This condition can also satisfy if the board has no more pieces, but
      // we'll handle it a few lines below
      if (!board.insertPosition(piece, r.toUpperCase(), parseInt(c))) {
        return BotStates.TTT_INCORRECT_INPUT_POSITION;
      }

      // If the user inserts in a position that makes him/her win the game
      if (board.isSolved()) {
        return BotStates.TTT_PLAYER_WIN;
      }

      const opponentPiece = piece.opponent();

      // If the user inserts in the last empty position in the board
      // (i.e. if the bot can't find a place to insert a piece)
      // Since we've already checked if the user has won, it's a tie
      if (!board.move(opponentPiece)) {
        return BotStates.TTT_TIE;
      }

      // If the bot inserts in a position that makes it win the game
      if (board.isSolved()) {
        return BotStates.TTT_BOT_WIN;
      }

      // If the bot inserts in the last empty position in the board,
      // Since we've already checked if the bot has won, it's a tie
      if (board.isFull()) {
        return BotStates.TTT_TIE;
      }

      // If the game has not winners or the board is not full, keep playing
      return BotStates.TTT_GAME_ON_PROGRESS;
    }
  }

  export class IncorrectInputPositionState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      yield 'You can\'t put it there, it\'s already occupied!';
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return {type: 'none'};
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      return BotStates.TTT_GAME_ON_PROGRESS.onUserAnswer(context, label);
    }
  }

  export class OutOfBoundsInputPositionState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      yield 'Hey, this doesn\'t even exist!';
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return {type: 'none'};
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      return BotStates.TTT_GAME_ON_PROGRESS.onUserAnswer(context, label);
    }
  }

  export class InvalidInputPositionState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      yield 'Hmmm, I can\'t understand your position. If you say something like A1 or B2, I can definitely understand you. Shall we try?';
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return {type: 'none'};
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      return BotStates.TTT_GAME_ON_PROGRESS.onUserAnswer(context, label);
    }
  }

  export class TieState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      yield* BotStates.TTT_END_OF_GAME.texts(context);
      yield 'Hey, it\'s a tie!';
      yield* BotStates.TTT_POST_GAME.texts(context);
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return BotStates.TTT_POST_GAME.onUserQuestion(context);
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      return BotStates.TTT_POST_GAME.onUserAnswer(context, label);
    }
  }

  export class BotWinState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      yield* BotStates.TTT_END_OF_GAME.texts(context);
      yield 'Hey, I won!';
      yield* BotStates.TTT_POST_GAME.texts(context);
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return BotStates.TTT_POST_GAME.onUserQuestion(context);
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      return BotStates.TTT_POST_GAME.onUserAnswer(context, label);
    }
  }

  export class PlayerWinState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      yield* BotStates.TTT_END_OF_GAME.texts(context);
      yield 'Hey, you won!';
      yield* BotStates.TTT_POST_GAME.texts(context);
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return BotStates.TTT_POST_GAME.onUserQuestion(context);
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      return BotStates.TTT_POST_GAME.onUserAnswer(context, label);
    }
  }

  export class PostGameState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      yield 'Wanna play again?';
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return {type: 'card', options: ['Of course!', 'No, thanks.']};
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      switch (label) {
        case 'Of course!':
          return BotStates.TTT_SETUP_SETTINGS;
        case 'No, thanks.':
          return BotStates.BOT_RESUME_CONVERSATION;
        default:
          return BotStates.BOT_INVALID_STATE;
      }
    }
  }

  export class EndOfGameState extends BotState {
    * texts(context: ChatContext): Generator<string, void, void> {
      const game = context.game as TicTacToeState;
      const board = game.board;
      yield `\`\`\`\n${board.encode()}\`\`\``;
      delete context.game;
    }

    onUserQuestion(context: ChatContext): PlayerInput {
      return {type: 'none'};
    }

    onUserAnswer(context: ChatContext, label: string): BotState {
      return BotStates.TTT_POST_GAME.onUserAnswer(context, label);
    }
  }
}

class BotStates {
  // GeneralStates
  static readonly BOT_START_CONVERSATION = new GeneralStates.StartConversationState();
  static readonly BOT_RESUME_CONVERSATION = new GeneralStates.ResumeConversationState();
  static readonly BOT_INVALID_STATE = new GeneralStates.InvalidState();
  // RockPaperScissorsStates
  static readonly RPS_USER_MOVE = new RockPaperScissorsStates.UserMoveState();
  static readonly RPS_BOT_MOVE = new RockPaperScissorsStates.BotMoveState();
  static readonly RPS_POST_GAME = new RockPaperScissorsStates.PostGameState();
  // TicTacToeStates
  static readonly TTT_SETUP_SETTINGS = new TicTacToeStates.SetupSettingsState();
  static readonly TTT_SETTINGS = new TicTacToeStates.SettingsState();
  static readonly TTT_GAME_STARTED = new TicTacToeStates.GameStartedState();
  static readonly TTT_BOT_GAME_STARTED = new TicTacToeStates.BotGameStartedState();
  static readonly TTT_PLAYER_GAME_STARTED = new TicTacToeStates.PlayerGameStartedState();
  static readonly TTT_GAME_ON_PROGRESS = new TicTacToeStates.GameOnProgressState();
  static readonly TTT_INCORRECT_INPUT_POSITION = new TicTacToeStates.IncorrectInputPositionState();
  static readonly TTT_OUT_OF_BOUNDS_INPUT_POSITION = new TicTacToeStates.OutOfBoundsInputPositionState();
  static readonly TTT_INVALID_INPUT_POSITION = new TicTacToeStates.InvalidInputPositionState();
  static readonly TTT_TIE = new TicTacToeStates.TieState();
  static readonly TTT_BOT_WIN = new TicTacToeStates.BotWinState();
  static readonly TTT_PLAYER_WIN = new TicTacToeStates.PlayerWinState();
  static readonly TTT_POST_GAME = new TicTacToeStates.PostGameState();
  static readonly TTT_END_OF_GAME = new TicTacToeStates.EndOfGameState();
}

type StateDatabase = { [id: number]: ChatContext };

type LowdieAnswer = { text: string, input?: PlayerInput };

export class Lowdie {
  private readonly states: StateDatabase = {};

  * answer(chatId: number, text: string): Generator<LowdieAnswer, void, void> {
    let state: BotState;
    let context: ChatContext | undefined = this.states[chatId];
    if (context == null) {
      state = BotStates.BOT_START_CONVERSATION;
      context = {key: BotStates.BOT_START_CONVERSATION};
      this.states[chatId] = context;
    } else {
      state = context.key.onUserAnswer(context, text);
      if (!state) return;
    }

    const texts = [...state.texts(context)];
    const headTexts = texts.slice(0, -1);
    const [tailText] = texts.slice(-1);

    for (let text of headTexts) {
      yield {text};
    }

    const input = state.onUserQuestion(context);
    yield {text: tailText, input: input};

    if (state === BotStates.BOT_INVALID_STATE) return;
    context.key = state;
  }
}
