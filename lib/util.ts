export function pick<T>(list:T[]){
    if (list.length !== 0){
        const len = list.length;
        const index = Math.floor(Math.random() * len);
        return list[index];
    }
    else {
        return undefined
    }
}

export function pickAndRemove<T>(list:T[]){
    if (list.length !== 0){
        const len = list.length;
        const index = Math.floor(Math.random() * len);
        return list.splice(index,1)[0]; //remove element at index index from the list list
    }
    else {
        return undefined
    }
}

/**
 * Return a random number between [a..b)
 */
export function randInt(a: number, b: number) {
    return Math.floor(a + Math.random() * (b - a));
}

export class Timer {
    public totalMillis = 0;
    public increments = 0;

    private startTime?: [number, number];

    public start() {
        this.startTime = process.hrtime();
    }

    public end() {
        const end = process.hrtime();
        const delta = (end[0] * 1000 + end[1] / 1E6) - (this.startTime[0] * 1000 + this.startTime[1] / 1E6);

        this.totalMillis += delta;
        this.increments += 1;
    }

    public get average() {
        if (this.increments === 0) { return 0; }
        return this.totalMillis / this.increments;
    }
}

/**
 * Return the numbers [0..n)
 */
export function range(n: number): number[] {
    const ret: number[] = [];

    for (let i = 0; i < n; i++) {
        ret.push(i);
    }

    return ret;
}

export function timeIt(n: number, fn: () => void) {
    const timer = new Timer();
    timer.start();
    for (let i = 0; i < n; i++) {
        fn();
    }
    timer.end();
    return timer.totalMillis;
}
