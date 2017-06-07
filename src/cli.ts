import * as path from 'path';
import { installLocal } from './index';

export function cli(argv: string[]) {

    const directories = argv
        .filter((_, i) => i > 1);

    if (directories.length < 1) {
        console.log();
        console.log('Install packages locally without changing the package.json');
        console.log();
        console.log('Usage: install-local <folder>[, <folder>, ...]');
        console.log('');
        console.log('Installs a package from the filesystem into the current directory without touching the package.json.');
        console.log('');
        console.log('Examples: ');
        console.log(' install-local ..');
        console.log('   install the package located in the parent folder into the current directory.');
        console.log(' install-local ../sibling ../sibling2');
        console.log('   install the packages in 2 sibling directories into the current directory.');
        console.log(' install-local');
        console.log('   Print this help.');
        process.exit(1);
    } else {
        installLocal({ '.': directories }).then(packagesBySource => {
            Object.keys(packagesBySource).forEach(source => {
                console.log(`Installed ${path.basename(source)} into ${packagesBySource[source].map(target => path.basename(target))}`);
            });
        }).catch(err => {
            console.error(err);
            process.exit(1);
        });
    }
}
