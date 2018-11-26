export function getRandom<T>(list:T[]){
    if (list.length !== 0){
        const len = list.length;
        const index = Math.floor(Math.random() * len);
        return list[index];
    }
    else {
        return undefined
    }
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