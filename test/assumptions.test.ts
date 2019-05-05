import 'jest';
import { timeIt } from '../lib/util';

test('Copying a bigger ArrayBuffer is not necessarily slower', () => {
    const sizeFactor = 2;

    const x = new Uint8Array(80 * 80);
    const y = new Uint8Array(80 * 80 * sizeFactor);

    const N = 1000;
    const copyTime = timeIt(N, () => x.slice(0));
    console.log('Copying array', copyTime, 'ms /', N);

    const biggerTime = timeIt(N, () => y.slice(0));
    console.log('Copying bigger array', biggerTime, 'ms /', N);

    console.log('Relative copying speed', biggerTime / copyTime);
});