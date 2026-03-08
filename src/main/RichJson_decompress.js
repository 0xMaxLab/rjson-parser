import {parseRichJson} from "@/RichJson/RichJson_parse";
import {__resetAddressCache, isJsonObject} from "@/RichJson/RichJsonHelper";
import {__RICH_JSON_COMPRESS_ADDRESSES} from "@/RichJson/RichJson_compress";
import {
    getArrayElement,
    getObjectField,
    setArrayElement,
    setObjectField
} from "@/RichJson/RichJson_GetterAndSetter";
import {DEBUG_LOG_RICH_JSON} from "@/RichJson/RichJsonConfiguration";
import {__RICH_JSON_INHERITANCE_SIGN} from "@/RichJson/RichJson";

const __RICH_JSON_DECOMPRESS_CACHE = {
    stack: {},
    names: []
}

export let __RICH_JSON_DECOMPRESS_CIRCULAR_LEVEL = 0

export function decompress(object) {
    if (Object.hasOwn(object, "_")) {
        if (Object.hasOwn(object, "a")) {
            __RICH_JSON_DECOMPRESS_CACHE.names = object["a"];
        }
        object = __decompress(object);
        return parseRichJson(object)["_"];
    } else {
        throw("RichJson the given object is not a compressed object")
    }
}

function __decompress(current) {
    __RICH_JSON_DECOMPRESS_CIRCULAR_LEVEL++;

    let isJsonObj = isJsonObject(current);
    let rv = isJsonObj ? {} : [];
    let get;
    let set;
    let names;
    let name;
    let member;
    let inheritance;

    if (isJsonObj) {
        get     = getObjectField;
        set     = setObjectField;
        names   = Object.keys(current);
    } else {
        get     = getArrayElement;
        set     = setArrayElement;
        names   = current;
    }

    for (let i = 0; i < names.length; ++i) {
        name	= names[i];
        member	= get(current, name, i);

        if (isJsonObject(member) || Array.isArray(member)) {
            member = __decompress(member);
        }

        if (isJsonObj) {
            if (name.includes(__RICH_JSON_INHERITANCE_SIGN)) {
                name = name.split(__RICH_JSON_INHERITANCE_SIGN, 2);
                inheritance = name[1];
                name = __RICH_JSON_COMPRESS_ADDRESSES.indexOf(name[0]);
            } else {
                inheritance = undefined;
                name = __RICH_JSON_COMPRESS_ADDRESSES.indexOf(name);
            }
            if (name === -1 || __RICH_JSON_DECOMPRESS_CIRCULAR_LEVEL === 1) {
                name = names[i];
            } else {
                if (inheritance !== undefined) {
                    name = __RICH_JSON_DECOMPRESS_CACHE.names[name] + "::" + inheritance;
                } else {
                    name = __RICH_JSON_DECOMPRESS_CACHE.names[name];
                }
            }
        }

        set(rv, name, i, member);
    }

    __RICH_JSON_DECOMPRESS_CIRCULAR_LEVEL--;
    if (__RICH_JSON_DECOMPRESS_CIRCULAR_LEVEL === 0) {
        __resetDecompressCache();
    }

    return rv;
}

function __resetDecompressCache() {
    __RICH_JSON_DECOMPRESS_CACHE.stack = {};
    __RICH_JSON_DECOMPRESS_CACHE.names = [];
    __resetAddressCache();
    if (DEBUG_LOG_RICH_JSON) {
        console.debug("RichJson decompress cleared cache");
    }
}