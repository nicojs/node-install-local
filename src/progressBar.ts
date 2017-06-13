import * as _ from 'lodash';
import * as path from 'path';
import * as Progress from 'progress';
import { LocalInstaller } from './LocalInstaller';

export function progressBar(installer: LocalInstaller, stream = process.stderr) {
    let progress: Progress;

    const tick = (phase: 'packing' | 'installing', last: string | null = null, numberOfTicks = 1) =>
        progress.tick(numberOfTicks, { phase, last: last ? `(${last})` : '' });

    installer.on('install_targets_identified', installTargets => {
        const packSteps = _.uniqBy(_.flatMap(installTargets, target => target.sources), _ => _.directory).length;
        const phaseSteps = 2;
        const installSteps = _.sum(_.flatMap(installTargets, target => target.sources.length));
        const steps = installSteps + packSteps + phaseSteps;
        progress = new Progress(`install-local: [:bar] :phase:last`, { total: steps, stream });
    });
    installer.on('packing_start', _ => tick('packing'));
    installer.on('packed', dir => tick('packing', path.basename(dir)));
    installer.on('install_start', _ => tick('installing'));
    installer.on('installed', target => tick('installing', path.basename(target.directory), target.sources.length));
    installer.on('install_end', () => progress.terminate());
}
