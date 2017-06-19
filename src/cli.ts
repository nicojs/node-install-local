import { LocalInstaller, progress, readLocalDependencies } from './index';
import { saveIfNeeded } from './index';

export function execute(argv: string[]) {

    const args = argv
        .filter((_, i) => i > 1);

    const argumentDependencies = args
        .filter(arg => arg.substr(0, 1) !== '-');
    const options = args
        .filter(arg => arg.substr(0, 1) === '-');

    const l = console.log;
    if (options.indexOf('--help') >= 0 || options.indexOf('-h') >= 0) {
        l();
        l('Install packages locally.');
        l();
        l('Usage:');
        l(' install-local');
        l(' install-local [options] <directory>[, <directory>, ...]');
        l();
        l('Installs packages from the filesystem into the current directory.');
        l();
        l('Options: ');
        l();
        l(' -h, --help      Output this help');
        l(' -S, --save      Saved packages will appear in your package.json under "localDependencies"');
        l();
        l('Examples: ');
        l(' install-local');
        l('   install the "localDependencies" of your current package');
        l(' install-local ..');
        l('   install the package located in the parent folder into the current directory.');
        l(' install-local --save ../sibling ../sibling2');
        l('   install the packages of 2 sibling directories into the current directory and save them to "localDependencies" in your package.json file.');
        return Promise.resolve();
    } else {
        return readLocalDependencies(argumentDependencies).then(localDependencies => {
            const installer = new LocalInstaller({ '.': localDependencies });
            progress(installer);
            installer.install()
                .then(saveIfNeeded(options));
        });
    }
}
