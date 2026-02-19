import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

export function prompt(text: string, defaultValue?: string): Promise<string> {
  return new Promise((resolve) => {
    const defaultText = defaultValue ? ` [${defaultValue}]` : '';
    rl.question(`${text}${defaultText}: `, (answer) => {
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

export function promptYesNo(text: string, defaultYes: boolean = true): Promise<boolean> {
  return new Promise((resolve) => {
    const defaultText = defaultYes ? 'Y/n' : 'y/N';
    rl.question(`${text} [${defaultText}]: `, (answer) => {
      const a = answer.trim().toLowerCase();
      if (!a) return resolve(defaultYes);
      resolve(a === 'y' || a === 'yes' || a === 's' || a === 'si');
    });
  });
}

export function promptSelect<T extends { name: string }>(
  text: string,
  options: T[]
): Promise<T | null> {
  return new Promise((resolve) => {
    console.log(`\n${text}`);
    options.forEach((opt, i) => {
      console.log(`  ${i + 1}. ${opt.name}`);
    });
    console.log(`  0. Cancelar\n`);
    
    rl.question('Selecciona una opción: ', (answer) => {
      const num = parseInt(answer.trim(), 10);
      if (num === 0 || isNaN(num)) {
        resolve(null);
      } else if (num > 0 && num <= options.length) {
        resolve(options[num - 1]);
      } else {
        resolve(null);
      }
    });
  });
}

export function closePrompt(): void {
  rl.close();
}
