interface SerializableDisease<T> {
    deserialize(input: Object, name: String): T;
}

export default SerializableDisease;