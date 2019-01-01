
/**
 * A 2-dimensional number field backed by a single-dimensional array
 */
export class Field {
    public static zero(width: number, height: number) {
        return new Field(new Uint8Array(width * height), width);
    }

    public readonly length: number;

    constructor(public readonly data: Uint8Array, private readonly width: number) {
        this.length = data.length;
    }

    public at(x: number, y: number) {
        return this.data[y * this.width + x];
    }

    public set(x: number, y: number, value: number) {
        this.data[y * this.width + x] = value;
    }

    public clone(): Field {
        return new Field(this.data.slice(0), this.width);
    }
}