import { exec } from 'child_process';
import { copySync, removeSync } from 'fs-extra';

removeSync('BipInEx/bin');
exec('dotnet build', { cwd: 'BepInEx' }, (error, stdout, stder) => {
  if (!stdout.includes('Build succeeded')) {
    console.error(error);
    console.error(stdout);
    console.error(stder);
  } else copySync('BepInEx/bin/Debug/net472/EntryPointSelector.dll', '../../../BepInEx/plugins/EntryPointSelector.dll');
});
