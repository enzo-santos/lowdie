import {Lowdie} from "../index";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function readLine(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

class LocalEntrypoint {
  async run() {
    const lowdie = new Lowdie();
    console.log('$ Greet Lowdie!');
    // noinspection InfiniteLoopJS
    for (; ;) {
      const question = await readLine('> ');
      const answers = lowdie.answer(0, question);
      for (const answer of answers) {
        console.log(answer.text);
        console.log();
        const input = answer.input;
        if (input) {
          switch (input.type) {
            case "none":
              break;
            case 'text':
            case 'card':
              console.log(`$ Choose from ${input.options.map(item => `"${item}"`).join(', ')}:`);
              break;
          }
        }
      }
    }
  }
}

async function main() {
  const entrypoint = new LocalEntrypoint();
  await entrypoint.run();
}
main().finally(() => {});