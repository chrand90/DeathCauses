interface Serializable<T> {
    deserialize(input: Object): T;
}

export default Serializable;