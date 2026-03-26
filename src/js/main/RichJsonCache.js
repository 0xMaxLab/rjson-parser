export class RichJsonCache {
    INSTANCE_ADDRESS_MAP = new WeakMap();
    NEXT_ADDRESS = 0;

    level = 0;
    stack = {};
    inheritances = {};

    /**
     * Resolves a unique address for given object.
     * @param {object} object
     * @returns {String} The address
     */
    resolveAddress(object) {
        if (!this.INSTANCE_ADDRESS_MAP.has(object)) {
            this.INSTANCE_ADDRESS_MAP.set(object, String(this.NEXT_ADDRESS++));
            return String(this.NEXT_ADDRESS - 1);
        }
        return this.INSTANCE_ADDRESS_MAP.get(object);
    }
}