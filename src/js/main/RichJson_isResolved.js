import {
    __isMemberRichJsonAble,
    __RICH_JSON_CIRCULAR_CACHE,
    __RICH_JSON_COMMAND_WILDCARD,
    __RICH_JSON_INTERPOLATION_WILDCARD,
    __RICH_JSON_KEY_COMMAND_MEMBER,
    __RICH_JSON_LATE_CONSTRUCTOR_MEMBER
} from "./RichJson";
import {getFieldByKey, isJsonObject, matchesWildcard, resolveAddress} from "./RichJsonHelper";

let __RICH_JSON_UNRESOLVED_CIRCULAR_LEVEL = 0;
const _getField = (_struct, _name) => _struct[_name];
const _accessArray = (_array, _name, _i) => _array[_i];

/**
 * Checks if the given object has unresolved RichJson expressions in it.
 * @param object
 * @param address
 * @returns {boolean}
 */
export function isResolved(object, address = undefined) {
    if (object === undefined) {
        return true;
    }

    address = address === undefined ? resolveAddress(object) : address;
    if (getFieldByKey(__RICH_JSON_CIRCULAR_CACHE.resolved, address) !== undefined) {
        return true;
    }

    __RICH_JSON_UNRESOLVED_CIRCULAR_LEVEL++;
    __RICH_JSON_CIRCULAR_CACHE.resolved[address] = object;

    let isJsonObj = isJsonObject(object);
    if (isJsonObj && (
        Object.hasOwn(object, __RICH_JSON_KEY_COMMAND_MEMBER) ||
        Object.hasOwn(object, __RICH_JSON_LATE_CONSTRUCTOR_MEMBER)
    )) {
        __decreaseCircularLevel();
        return false;
    }

    let names = isJsonObj ? Object.keys(object) : object;
    let get = isJsonObj ? _getField : _accessArray;
    let member = undefined;
    for (let i = 0; i < names.length; ++i) {
        member = get(object, names[i], i);
        if (!__isMemberRichJsonAble(member)) {
            continue;
        }
        if (typeof member === "string") {
            if (matchesWildcard(member, __RICH_JSON_COMMAND_WILDCARD) ||
                matchesWildcard(member, __RICH_JSON_INTERPOLATION_WILDCARD)) {
                __decreaseCircularLevel();
                return false;
            }
        } else if (!isResolved(member)) {
            __decreaseCircularLevel();
            return false;
        }
    }

    __decreaseCircularLevel();
    return true;
}

function __decreaseCircularLevel() {
    __RICH_JSON_UNRESOLVED_CIRCULAR_LEVEL--;
    if (__RICH_JSON_UNRESOLVED_CIRCULAR_LEVEL === 0) {
        __RICH_JSON_CIRCULAR_CACHE.resolved = {};
    }
}