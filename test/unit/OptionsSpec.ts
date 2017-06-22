import { expect } from 'chai';
import { Options } from '../../src/Options';

describe('Options', () => {

    it('should parse "node install-local --save --target-siblings some dependencies"', () => {
        const options = new Options(['node', 'install-local', '--save', '--target-siblings', 'some', 'dependencies']);
        expect(options.save).to.be.ok;
        expect(options.targetSiblings).to.be.ok;
        expect(options.dependencies).to.deep.eq(['some', 'dependencies']);
    });

    it('should parse "node install-local -S -T some dependencies"', () => {
        const options = new Options(['node', 'install-local', '-S', '-T', 'some', 'dependencies']);
        expect(options.save).to.be.ok;
        expect(options.targetSiblings).to.be.ok;
        expect(options.dependencies).to.deep.eq(['some', 'dependencies']);
    });

    it('should reject when validating with --save and --target-siblings', () => {
        const options = new Options(['node', 'install-local', '-S', '-T']);
        return expect(options.validate()).rejectedWith('Invalid use of option --target-siblings. Cannot be used together with --save');
    });

    it('should reject when validating with --target-siblings and dependencies', () => {
        const options = new Options(['node', 'install-local', '-T', 'some', 'dependencies']);
        return expect(options.validate()).rejectedWith('Invalid use of option --target-siblings. Cannot be used together with a dependency list');
    });
});
