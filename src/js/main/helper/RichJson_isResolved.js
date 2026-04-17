import {
    __RICH_JSON_COMMAND_WILDCARD,
    __RICH_JSON_INTERPOLATION_WILDCARD,
    __RICH_JSON_KEY_COMMAND_MEMBER,
    __RICH_JSON_LATE_CONSTRUCTOR_MEMBER,
    getArrayElement,
    getObjectField,
    RichJsonParser
} from "../core/RichJson.js";
import {getFieldByKey, isJsonObject} from "./RichJsonHelper.js";

/**
 * Checks if the given object has unresolved RichJson expressions in it.
 * @param object
 * @returns {boolean}
 */
export function isResolved(object) {
    let parser = new RichJsonParser();
    return __isResolved(parser, object, parser.cache.resolveAddress(object))
}

function __isResolved(parser, object, address) {
    if (object === undefined) {
        return true;
    }

    if (getFieldByKey(parser.cache.stack, address) !== undefined) {
        return true;
    }
    parser.cache.stack[address] = object;

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
            if (__RICH_JSON_COMMAND_WILDCARD.test(member) ||
                __RICH_JSON_INTERPOLATION_WILDCARD.test(member)) {
                return false;
            }
        } else if (!__isResolved(parser, member, parser.cache.resolveAddress(member))) {
            return false;
        }
    }

    return true;
}
