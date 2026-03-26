import {__RICH_JSON_CLASS_MAPPING} from "./RichJsonClassMapping.js";
import {RichJsonCache} from "./RichJsonCache.js";

/**
 * Merges two or more objects together into a new object.
 * @param {object} objects Going to be merged
 * @returns {object} The merged object
 */
export function mergeObjects(...objects) {
    return mergeIntoTarget({}, ...objects);
}

/**
 * Merges objects into target object.
 * @param {object} target
 * @param {object} others Going to be merged
 * @returns {object} The merged target
 */
export function mergeIntoTarget(target, ...others) {
    let other = undefined;
    let cache = undefined;

    for (let i = 0; i < others.length; i++) {
        other = others[i];
        if (other === undefined) {
            continue;
        }
        cache = new RichJsonCache();
        __mergeIntoTarget(cache, target, other);
        if (cache.level !== 0) {
            console.error(`RichJson mergeIntoTarget failed!`);
        }
    }

    return target;
}

export function __mergeIntoTarget(cache, target, other, force = false) {
    cache.stack[cache.resolveAddress(other)] = other;
    cache.level++;

    let names = Object.keys(other);
    let name = undefined;
    let member = undefined;

    for (let j = 0; j < names.length; j++) {
        name = names[j];
        member = other[name];

        if (typeof member === "function") {
            if (!force && !Object.hasOwn(target, name)) {
                target[name] = member.bind(target);
            }
        } else {
            if (member !== undefined && isJsonObject(member) && isJsonObject(target[name])) {
                if (!Object.hasOwn(cache.stack, cache.resolveAddress(member))) {
                    __mergeIntoTarget(cache, target[name], member);
                }
            } else if (!force && !Object.hasOwn(target, name)) {
                target[name] = member;
            }
        }
    }

    cache.level--;
    return target;
}

/**
 * Merges two or more objects together into a new object, without rebinding functions.
 * @param {object} objects Going to be merged
 * @returns {object} The merged object
 */
export function mergeObjectsWithoutRebind(...objects) {
    return mergeIntoWithoutRebind({}, ...objects);
}

/**
 * Merges objects into target object, without rebinding functions.
 * @param {object} target
 * @param {object} others Going to be merged
 * @returns {object} The merged target
 */
export function mergeIntoWithoutRebind(target, ...others) {
    let other = undefined;
    let cache = undefined;

    for (let i = 0; i < others.length; i++) {
        other = others[i];
        if (other === undefined) {
            continue;
        }
        cache = new RichJsonCache();
        __mergeIntoWithoutRebind(cache, target, other);
        if (cache.level !== 0) {
            console.error(`RichJson mergeIntoWithoutRebind failed!`);
        }
    }

    return target;
}

function __mergeIntoWithoutRebind(cache, target, other, force = false) {
    cache.stack[cache.resolveAddress(other)] = other;
    cache.level++;

    let names = Object.keys(other);
    let name = undefined;
    let member = undefined;

    for (let j = 0; j < names.length; j++) {
        name = names[j];
        member = other[name];
        if (typeof member === "function") {
            if (!force && !Object.hasOwn(target, name)) target[name] = member;
        } else {
            if (member !== undefined && isJsonObject(member) && isJsonObject(target[name])) {
                if (!Object.hasOwn(cache.stack, cache.resolveAddress(member))) {
                    __mergeIntoWithoutRebind(cache, target[name], member);
                }
            } else {
                if (!force && !Object.hasOwn(target, name)) target[name] = member;
            }
        }
    }

    cache.level--;
    return target;
}

/**
 * Clones an object or array. Circular dependencies are correctly resolved and functions are rebound.
 * @param {object} object
 * @returns {object} The clone
 */
export function cloneObject(object) {
    let cache = new RichJsonCache();
    cache.str = isJsonObject(object);
    cache.rv = (isJsonObject(object) ? {} : []);
    cache.next = undefined;
    cache.next = cache.rv;
    cache.stack[cache.resolveAddress(object)] = cache.rv;
    object = _cloneObject(cache, object);
    if (cache.level !== 0) {
        console.error(`RichJson cloneObject failed!`);
    }
    return object;
}

function _cloneObject(cache, object) {
    if (object == null || (!isJsonObject(object) && !Array.isArray(object))) {
        return object;
    }

    let target = cache.next;
    let name = undefined;
    let member = undefined;
    let newObj = undefined;

    cache.level++;
    if (isJsonObject(object)) {
        let names = Object.keys(object);
        for (let i = 0; i < names.length; i++) {
            name = names[i];
            member = object[name];
            if (typeof member === "function") {
                target[name] = member.bind(target);
            } else if (isJsonObject(member) || Array.isArray(member)) {
                if (getFieldByKey(cache.stack, cache.resolveAddress(member)) === undefined) {
                    newObj = (isJsonObject(member)) ? {} : [];
                    cache.str = isJsonObject(member);
                    cache.stack[cache.resolveAddress(member)] = newObj;
                    cache.next = newObj;
                    target[name] = _cloneObject(cache, member);
                } else {
                    target[name] = cache.stack[cache.resolveAddress(member)];
                }
            } else {
                target[name] = member;
            }
        }
    } else {
        for (let i = 0; i < object.length; i++) {
            member = object[i];
            if (isJsonObject(member) || Array.isArray(member)) {
                if (getFieldByKey(cache.stack, cache.resolveAddress(member)) === undefined) {
                    newObj = (isJsonObject(member)) ? {} : [];
                    cache.str = isJsonObject(member);
                    cache.stack[cache.resolveAddress(member)] = newObj;
                    cache.next = newObj;
                    target.push(_cloneObject(cache, member));
                } else {
                    target.push(cache.stack[cache.resolveAddress(member)]);
                }
            } else {
                target.push(member);
            }
        }
    }
    cache.level--;

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

