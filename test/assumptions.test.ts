import 'jest';
import { timeIt } from '../lib/util';

test('Copying a bigger ArrayBuffer is not necessarily slower', () => {
    const x = new Uint8Array(80 * 80);
    const y = new Uint8Array(80 * 80 * 2);

    const N = 1000;
    const copyTime = timeIt(N, () => x.slice(0));
    console.log('Copying array', copyTime, 'ms /', N);

    const copyTime2 = timeIt(N, () => y.slice(0));
    console.log('Copying bigger array', copyTime2, 'ms /', N);

    console.log('Relative copying speed', copyTime / copyTime2);
});