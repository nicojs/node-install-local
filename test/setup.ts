import { use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

use(chaiAsPromised);
use(sinonChai);

export const mochaHooks = {
  afterEach(): void {
    sinon.restore();
  },
};
