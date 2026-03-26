export class RichJsonCache {
    addressMap = new WeakMap();
    nextAddress = 0;

    level = 0;
    stack = {};

    /**
     * Resolves a unique address for given object.
     * @param {object} object
     * @returns {String} The address
     */
    resolveAddress(object) {
        if (!this.addressMap.has(object)) {
            this.addressMap.set(object, String(this.nextAddress++));
            return String(this.nextAddress - 1);
        }
        return this.addressMap.get(object);
    }
}