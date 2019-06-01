interface Henk {
    A: string;
    B: number;
}

var x: Henk["A"] = 'asdf';

type DataType = 'float32' | 'string' | 'int32';
type NumericDataType = 'float32' | 'int32';

export interface DataTypeMap {
    float32: Float32Array;
    int32: Int32Array;
    bool: Uint8Array;
    complex64: Float32Array;
    string: string[];
}

interface Tensor<D extends DataType = 'float32'> {
    dtype: DataType;
    data<D extends DataType = NumericDataType>(): Promise<DataTypeMap[D]>;
}

export interface StringTensor extends Tensor {
    dtype: 'string';
    dataSync(): string[];
    data(): Promise<string[]>;
}
