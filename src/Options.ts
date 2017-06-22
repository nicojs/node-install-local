
export class Options {

    public readonly dependencies: string[];
    public readonly options: string[];

    constructor(argv: string[]) {
        const args = argv // strip the "node install-local" part.
            .filter((_, i) => i > 1);
        this.dependencies = args
            .filter(arg => arg.substr(0, 1) !== '-');
        this.options = args
            .filter(arg => arg.substr(0, 1) === '-');
    }

    public validate(): Promise<void> {
        if (this.dependencies.length > 0 && this.targetSiblings) {
            return Promise.reject(`Invalid use of option --target-siblings. Cannot be used together with a dependency list`);
        } else if (this.targetSiblings && this.save) {
            return Promise.reject(`Invalid use of option --target-siblings. Cannot be used together with --save`);
        } else {
            return Promise.resolve();
        }
    }

    public get help() {
        return this.flag('-h', '--help');
    }

    public get targetSiblings() {
        return this.flag('-T', '--target-siblings');
    }

    public get save() {
        return this.flag('-S', '--save');
    }

    private flag(...options: string[]) {
        return options.some(_ => this.options.indexOf(_) >= 0);
    }
}
