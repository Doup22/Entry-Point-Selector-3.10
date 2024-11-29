import { exec } from 'child_process';
import { watch } from 'fs';
import { resolve } from 'path';

let debounce = false;
let timeout: undefined | number;
export function run() {
  if (debounce) return;
  debounce = true;
  function helper() {
    console.log('Starting server');
    exec('start Aki.Server.exe', { cwd: resolve(__dirname, '..', '..', '..', '..') }, (err, data) => {
      if (err) console.error(err);
      console.log(data);
    });
    clearTimeout(timeout);
    timeout = setTimeout(() => debounce = false, 100) as any;
  }

  console.log('\nStopping previously running servers');
  exec('taskkill /IM "Aki.Server.exe" /F', (err, data) => {
    if (err) {
      if (err.code !== 128) console.error(err);
    } else console.log(data);
    helper();
  });
}

function main() {
  run();
  watch('src', {
    recursive: true,
  }, (eventType, filename) => {
    if (filename.endsWith('.ts') && eventType === 'change') {
      run();
    }
  });
}

if (require.main === module) {
  const command = process.argv[2];
  if (!command || command === 'watch') {
    main();
  } else if (command === 'run') {
    run();
  } else {
    console.error('Unknown command');
  }
}
