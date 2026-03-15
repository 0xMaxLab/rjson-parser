import {__RICH_JSON_CLASS_MAPPING} from "./RichJsonClassMapping";

let INSTANCE_ADDRESS_MAP = new WeakMap();
let NEXT_ADDRESS = 0;

let MERGE_OBJECTS_CIRCULAR_LEVEL = 0;
let MERGE_OBJECTS_CIRCULAR_CACHE = [];

/**
 * Merges two or more objects together into a new object.
 * @param {object} objects Going to be merged
 * @returns {object} The merged object
 */
export function mergeObjects(...objects) {
    let rv = {};
    for (let i = 0; i < objects.length; i++) {
        mergeIntoTarget(rv, objects[i]);
    }
    return rv;
}

/**
 * Merges objects into target object.
 * @param {object} target
 * @param {object} others Going to be merged
 * @returns {object} The merged target
 */
export function mergeIntoTarget(target, ...others) {
    if (MERGE_OBJECTS_CIRCULAR_LEVEL === 0) {
        MERGE_OBJECTS_CIRCULAR_CACHE = [];
    }

    let other = undefined;

    MERGE_OBJECTS_CIRCULAR_LEVEL++;
    for (let i = 0; i < others.length; i++) {
        other = others[i];
        if (other === undefined) continue;
        __mergeIntoTarget(target, other);
    }
    MERGE_OBJECTS_CIRCULAR_LEVEL--;

    return target;
}

export function __mergeIntoTarget(target, other, force = false) {
    let names = Object.keys(other);
    let name = undefined;
    let member = undefined;

    for (let j = 0; j < names.length; j++) {
        name = names[j];
        member = other[name];

        if (typeof member === "function") {
            if (!force && !Object.hasOwn(target, name)) target[name] = member.bind(target);
        } else {
            if (member !== undefined &&
                isJsonObject(member) && isJsonObject(target[name]) &&
                !MERGE_OBJECTS_CIRCULAR_CACHE.includes(member)) {
                MERGE_OBJECTS_CIRCULAR_CACHE.push(member);
                mergeIntoTarget(target[name], member);
            } else {
                if (!force && !Object.hasOwn(target, name)) target[name] = member;
            }
        }
    }

    return target;
}

/**
 * Merges two or more objects together into a new object, without rebinding functions.
 * @param {object} objects Going to be merged
 * @returns {object} The merged object
 */
export function mergeObjectsWithoutRebind(...objects) {
    let rv = {};
    for (let i = 0; i < objects.length; i++) {
        mergeIntoWithoutRebind(rv, objects[i]);
    }
    return rv;
}

/**
 * Merges objects into target object, without rebinding functions.
 * @param {object} target
 * @param {object} others Going to be merged
 * @returns {object} The merged target
 */
export function mergeIntoWithoutRebind(target, ...others) {
    if (MERGE_OBJECTS_CIRCULAR_LEVEL === 0) {
        MERGE_OBJECTS_CIRCULAR_CACHE = [];
    }

    let other = undefined;

    MERGE_OBJECTS_CIRCULAR_LEVEL++;
    for (let i = 0; i < others.length; i++) {
        other = others[i];
        if (other === undefined) continue;
        __mergeIntoWithoutRebind(target, other);
    }
    MERGE_OBJECTS_CIRCULAR_LEVEL--;

    return target;
}

export function __mergeIntoWithoutRebind(target, other, force = false) {
    let names = Object.keys(other);
    let name = undefined;
    let member = undefined;

    for (let j = 0; j < names.length; j++) {
        name = names[j];
        member = other[name];
        if (typeof member === "function") {
            if (!force && !Object.hasOwn(target, name)) target[name] = member;
        } else {
            if (member !== undefined &&
                isJsonObject(member) && isJsonObject(target[name]) &&
                !MERGE_OBJECTS_CIRCULAR_CACHE.includes(member)) {
                MERGE_OBJECTS_CIRCULAR_CACHE.push(member);
                mergeIntoWithoutRebind(target[name], member);
            } else {
                if (!force && !Object.hasOwn(target, name)) target[name] = member;
            }
        }
    }

    return target;
}

/**
 * Clones an object or array. Circular dependencies are correctly resolved and functions are rebound.
 * @param {object} object
 * @returns {object} The clone
 */
export function cloneObject(object) {
    if (object == null || (!isJsonObject(object) && !Array.isArray(object))) {
        return object;
    }

    if (MERGE_OBJECTS_CIRCULAR_LEVEL === 0) {
        MERGE_OBJECTS_CIRCULAR_CACHE = {
            str: isJsonObject(object),
            rv: (isJsonObject(object) ? {} : []),
            next: undefined,
            stack: {},
        };
        MERGE_OBJECTS_CIRCULAR_CACHE.next = MERGE_OBJECTS_CIRCULAR_CACHE.rv;
        MERGE_OBJECTS_CIRCULAR_CACHE.stack[resolveAddress(object)] = MERGE_OBJECTS_CIRCULAR_CACHE.rv;
    }

    let target = MERGE_OBJECTS_CIRCULAR_CACHE.next;
    let name = undefined;
    let member = undefined;
    let newObj = undefined;

    MERGE_OBJECTS_CIRCULAR_LEVEL++;
    if (isJsonObject(object)) {
        let names = Object.keys(object);
        for (let i = 0; i < names.length; i++) {
            name = names[i];
            member = object[name];
            if (typeof member === "function") {
                target[name] = member.bind(target);
            } else if (isJsonObject(member) || Array.isArray(member)) {
                if (getFieldByKey(MERGE_OBJECTS_CIRCULAR_CACHE.stack, resolveAddress(member)) === undefined) {
                    newObj = (isJsonObject(member)) ? {} : [];
                    MERGE_OBJECTS_CIRCULAR_CACHE.str = isJsonObject(member);
                    MERGE_OBJECTS_CIRCULAR_CACHE.stack[resolveAddress(member)] = newObj;
                    MERGE_OBJECTS_CIRCULAR_CACHE.next = newObj;
                    target[name] = cloneObject(member);
                } else {
                    target[name] = MERGE_OBJECTS_CIRCULAR_CACHE.stack[resolveAddress(member)];
                }
            } else {
                target[name] = member;
            }
        }
    } else {
        for (let i = 0; i < object.length; i++) {
            member = object[i];
            if (isJsonObject(member) || Array.isArray(member)) {
                if (getFieldByKey(MERGE_OBJECTS_CIRCULAR_CACHE.stack, resolveAddress(member)) === undefined) {
                    newObj = (isJsonObject(member)) ? {} : [];
                    MERGE_OBJECTS_CIRCULAR_CACHE.str = isJsonObject(member);
                    MERGE_OBJECTS_CIRCULAR_CACHE.stack[resolveAddress(member)] = newObj;
                    MERGE_OBJECTS_CIRCULAR_CACHE.next = newObj;
                    target.push(cloneObject(member));
                } else {
                    target.push(MERGE_OBJECTS_CIRCULAR_CACHE.stack[resolveAddress(member)]);
                }
            } else {
                target.push(member);
            }
        }
    }
    MERGE_OBJECTS_CIRCULAR_LEVEL--;

    return target;
}

/**
 * Gets a field of an object by key.
 * @param {object} object
 * @param {string} key
 * @returns {object} object[key] - If object has field
 * @returns {undefined} undefined - If object has not
 */
export function getFieldByKey(object, key) {
    return Object.hasOwn(object, key) ? object[key] : undefined;
}

/**
 * Resolves a unique address for given object.
 * @param {object} object
 * @returns {String} The address
 */
export function resolveAddress(object) {
    if (!INSTANCE_ADDRESS_MAP.has(object)) {
        INSTANCE_ADDRESS_MAP.set(object, String(NEXT_ADDRESS++));
        return String(NEXT_ADDRESS - 1);
    }
    return INSTANCE_ADDRESS_MAP.get(object);
}

export function __resetAddressCache() {
    INSTANCE_ADDRESS_MAP = new WeakMap();
    NEXT_ADDRESS = 0;
}

/**
 * Gets keys sorted of given object.
 * @param {object} object
 * @returns {String[]} The keys
 */
export function getKeysSorted(object) {
    let rv = Object.keys(object);
    rv.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: "base"}));
    return rv;
}

/**
 * Checks if given object is a JSON object.
 * @param {object} object
 * @returns {boolean}
 */
export function isJsonObject(object) {
    return typeof object === 'object' && !Array.isArray(object) && (object.constructor === Object || Object.hasOwn(__RICH_JSON_CLASS_MAPPING, object.constructor.name));
}

/**
 * Concat redundancy strings.
 * @param {...String} strings
 * @returns {String}
 */
export function concatStrings(...strings) {
    let rv = "";
    strings.forEach((str) => rv += str);
    return rv;
}

/**
 * Concat redundancy arrays.
 * @param {...Array} arrays
 * @returns {Array}
 */
export function concatArrays(...arrays) {
    let rv = [];
    arrays.forEach((array) => rv.push(array));
    return rv;
}

/**
 * Checks if the given string matches the wildcard.
 * @param string
 * @param wildcard
 * @returns {boolean}
 */
export function matchesWildcard(string, wildcard) {
    if (typeof string !== "string") return false;
    const escaped = wildcard.replace(/[.+?^${}()|\[\]\\]/g, "\\$&");
    const regexStr = "^" + escaped.replace(/\*/g, ".*") + "$";
    wildcard = new RegExp(regexStr);
    return wildcard.test(string);
}

