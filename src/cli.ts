import { installLocal } from './index';

const args = process.argv
    .filter((_, i) => i > 1);

if (args.length < 2) {
    console.log();
    console.log('Install packages locally without changing the package.json');
    console.log();
    console.log('Usage: install-local <from> <to> [<to>, ...]');
    console.log('Installs package in <from> directory in package of <to> directories.');
    process.exit(1);
}
installLocal(args[0], ...args.slice(1)).catch(err => {
    console.error(err);
    process.exit(1);
});
