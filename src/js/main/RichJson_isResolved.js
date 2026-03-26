import {
    __RICH_JSON_COMMAND_WILDCARD,
    __RICH_JSON_INTERPOLATION_WILDCARD,
    __RICH_JSON_KEY_COMMAND_MEMBER,
    __RICH_JSON_LATE_CONSTRUCTOR_MEMBER, getArrayElement, getObjectField, RichJsonParser
} from "./RichJson.js";
import {getFieldByKey, isJsonObject, matchesWildcard, resolveAddress} from "./RichJsonHelper.js";

/**
 * Checks if the given object has unresolved RichJson expressions in it.
 * @param object
 * @returns {boolean}
 */
export function isResolved(object) {
    return __isResolved(new RichJsonParser(), object, resolveAddress(object))
}

function __isResolved(parser, object, address) {
    if (object === undefined) {
        return true;
    }

    if (getFieldByKey(parser.__RICH_JSON_CIRCULAR_CACHE.stack, address) !== undefined) {
        return true;
    }
    parser.__RICH_JSON_CIRCULAR_CACHE.stack[address] = object;

    let isJsonObj = isJsonObject(object);
    if (isJsonObj && (
        Object.hasOwn(object, __RICH_JSON_KEY_COMMAND_MEMBER) ||
        Object.hasOwn(object, __RICH_JSON_LATE_CONSTRUCTOR_MEMBER)
    )) {
        return false;
    }

    let names = isJsonObj ? Object.keys(object) : object;
    let get = isJsonObj ? getObjectField : getArrayElement;
    let member = undefined;
    for (let i = 0; i < names.length; ++i) {
        member = get(object, names[i], i);
        if (!parser.__isMemberRichJsonAble(member)) {
            continue;
        }
        if (typeof member === "string") {
            if (matchesWildcard(member, __RICH_JSON_COMMAND_WILDCARD) ||
                matchesWildcard(member, __RICH_JSON_INTERPOLATION_WILDCARD)) {
                return false;
            }
        } else if (!__isResolved(parser, member, resolveAddress(member))) {
            return false;
        }
    }

    return true;
}
