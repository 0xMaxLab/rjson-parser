import {__resetAddressCache, getKeysSorted, isJsonObject, resolveAddress} from "@/RichJson/RichJsonHelper";
import {DEBUG_LOG_RICH_JSON} from "@/RichJson/RichJsonConfiguration";
import stringify from "json-stable-stringify";
import {getArrayElement, getObjectField, setObjectField} from "@/RichJson/RichJson_GetterAndSetter";

export const __RICH_JSON_COMPRESS_ADDRESSES = [
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "§", "$", "%", "&", "/", "(", ")", "[", "]", "{", "}", "=", "+", "-", ".", ":", ",", ";", "_", "!", "?", "|", "<", ">"
]

export const __RICH_JSON_COMPRESS_CACHE = {
    records: {},
    redundancy: {},
    excludes: {},
    inheritances: {},
    names: [],
    redundancyNames: [],
    addresses: structuredClone(__RICH_JSON_COMPRESS_ADDRESSES),
}

export let __RICH_JSON_COMPRESS_CIRCULAR_LEVEL = 0;

export function compress(object) {
    __evaluateMembers(object, resolveAddress(object), "root");
    __evaluateRedundancy();
    __evaluateInheritances();
    return __compress(object);
}

function __evaluateMembers(current, currentAddress) {
    __RICH_JSON_COMPRESS_CIRCULAR_LEVEL++;

    let isJsonObj = isJsonObject(current);
    let get;
    let names;
    let name;
    let member;
    let address;
    let memberAsString;

    if (isJsonObj) {
        get = getObjectField;
        names = getKeysSorted(current);
    } else {
        get = getArrayElement;
        names = current;
    }

    for (let i = 0; i < names.length; ++i) {
        name = names[i];
        member = get(current, name, i);

        if (isJsonObj) {
            if (!__RICH_JSON_COMPRESS_CACHE.names.includes(name)) {
                __RICH_JSON_COMPRESS_CACHE.names.push(name);
            } else if (!__RICH_JSON_COMPRESS_CACHE.redundancyNames.includes(name)) {
                __RICH_JSON_COMPRESS_CACHE.redundancyNames.push(name);
            }
            if (__RICH_JSON_COMPRESS_CACHE.addresses.includes(name)) {
                if (!__RICH_JSON_COMPRESS_CACHE.redundancyNames.includes(name)) {
                    __RICH_JSON_COMPRESS_CACHE.redundancyNames.push(name);
                }
            }
        } else {
            if (isJsonObject(member)) {
                __evaluateMembers(member, resolveAddress(member));
            }
            continue;
        }

        if (isJsonObject(member)) {
            address = resolveAddress(member);
            memberAsString = stringify(member);
        } else {
            address = currentAddress;
            memberAsString = Array.isArray(member) ? stringify(member) : member.toString();
        }

        if (__recordMemberAndCheckIsFirstEntry(address, member, memberAsString, name)) {
            if (isJsonObject(member) || Array.isArray(member)) {
                __evaluateMembers(member, address)
            }
        }
    }

    __RICH_JSON_COMPRESS_CIRCULAR_LEVEL--;
    if (__RICH_JSON_COMPRESS_CIRCULAR_LEVEL === 0) {
        __useParentsAsKeyForRecords();
    }

    return current;
}

function __recordMemberAndCheckIsFirstEntry(parentAddress, current, currentAsString, currentName) {
    if (Object.hasOwn(__RICH_JSON_COMPRESS_CACHE.records, currentAsString)) {
        if (!__RICH_JSON_COMPRESS_CACHE.records[currentAsString].names.includes(currentName)) {
            __RICH_JSON_COMPRESS_CACHE.records[currentAsString].names.push(currentName);
        }

        if (isJsonObject(current)) {
            __RICH_JSON_COMPRESS_CACHE.records[currentAsString].children += "_" + resolveAddress(current);
        } else {
            __RICH_JSON_COMPRESS_CACHE.records[currentAsString].children += "_" + parentAddress + "." + currentName;
        }

        __RICH_JSON_COMPRESS_CACHE.records[currentAsString].parents += "_" + parentAddress;

        return false;
    } else {
        __RICH_JSON_COMPRESS_CACHE.records[currentAsString] = {
            value: current,
            names: [currentName],
            children: isJsonObject(current) ? resolveAddress(current) : parentAddress + currentName,
            parents: parentAddress
        };

        return true;
    }
}

function __useParentsAsKeyForRecords() {
    let records = {};
    let names = Object.keys(__RICH_JSON_COMPRESS_CACHE.records);
    let name;
    let member;

    for (let i = 0; i < names.length; ++i) {
        name = names[i];
        member = __RICH_JSON_COMPRESS_CACHE.records[name];
        if (!Object.hasOwn(records, member.parents)) {
            records[member.parents] = [member];
        } else {
            records[member.parents].push(member);
        }
    }

    __RICH_JSON_COMPRESS_CACHE.records = records;
}

function __evaluateRedundancy() {
    let names = getKeysSorted(__RICH_JSON_COMPRESS_CACHE.records);
    let records;
    let record;
    let name;

    for (let i = 0; i < names.length; ++i) {
        records = __RICH_JSON_COMPRESS_CACHE.records[names[i]];
        for (let j = 0; j < records.length; ++j) {
            record = records[j];
            if (record.names.length === 1 || isJsonObject(record.value)) {
                name = record.names[0];
                if (record.parents.includes("_")) {
                    if (isJsonObject(record.value)) {
                        __recordJsonObjectRedundancy(record.children, record.value);
                    } else {
                        __recordRedundancy(record.parents, name, record.value);
                    }
                }
            }
        }
    }
}

function __recordJsonObjectRedundancy(children, value) {
    if (!Object.hasOwn(__RICH_JSON_COMPRESS_CACHE.redundancy, children)) {
        __RICH_JSON_COMPRESS_CACHE.redundancy[children] = value;
    }
    children = children.split("_");
    let excludes = Object.keys(value);
    for (let i = 0; i < children.length; ++i) {
        __RICH_JSON_COMPRESS_CACHE.excludes[children[i]] = excludes;
    }
}

function __recordRedundancy(parents, name, value) {
    if (Object.hasOwn(__RICH_JSON_COMPRESS_CACHE.redundancy, parents)) {
        __RICH_JSON_COMPRESS_CACHE.redundancy[parents][name] = value;
    } else {
        __RICH_JSON_COMPRESS_CACHE.redundancy[parents] = {};
        __RICH_JSON_COMPRESS_CACHE.redundancy[parents][name] = value;
    }
    parents = parents.split("_");
    for (let i = 0; i < parents.length; ++i) {
        if (Object.hasOwn(__RICH_JSON_COMPRESS_CACHE.excludes, parents[i])) {
            __RICH_JSON_COMPRESS_CACHE.excludes[parents[i]].push(name);
        } else {
            __RICH_JSON_COMPRESS_CACHE.excludes[parents[i]] = [name];
        }
    }
}

function __evaluateInheritances() {
    let redundancy = __RICH_JSON_COMPRESS_CACHE.redundancy;
    let names = Object.keys(redundancy);
    let inheritances;
    let nexId = 1;

    for (let i = 0; i < names.length; ++i) {
        inheritances = names[i].split("_");
        for (let j = 0; j < inheritances.length; ++j) {
            __recordInheritance(inheritances[j], nexId);
        }
        redundancy[nexId] = redundancy[names[i]];
        delete redundancy[names[i]];
        nexId++;
    }
}

function __recordInheritance(address, inheritance) {
    if (Object.hasOwn(__RICH_JSON_COMPRESS_CACHE.inheritances, address)) {
        __RICH_JSON_COMPRESS_CACHE.inheritances[address].push(inheritance);
    } else {
        __RICH_JSON_COMPRESS_CACHE.inheritances[address] = [inheritance];
    }
}

function __compress(current, ignoreExcludes = false) {
    __RICH_JSON_COMPRESS_CIRCULAR_LEVEL++;

    let isJsonObj = isJsonObject(current);
    let rv = {};
    let get;
    let set;
    let names;
    let name;
    let member;
    let address;
    let haveChildrenInheritances = false;

    if (isJsonObj) {
        get = getObjectField;
        set = setObjectField;
        names = Object.keys(current);
    } else {
        get = getArrayElement;
        set = setObjectField;
        names = current;
    }

    address = resolveAddress(current);
    let excludes = [];
    if (!ignoreExcludes && Object.hasOwn(__RICH_JSON_COMPRESS_CACHE.excludes, address)) {
        excludes = __RICH_JSON_COMPRESS_CACHE.excludes[address];
    }

    for (let i = 0; i < names.length; ++i) {
        name = names[i];
        if (excludes.includes(names[i])) {
            continue;
        }
        member = get(current, name, i);

        name = __RICH_JSON_COMPRESS_CACHE.redundancyNames.indexOf(name);
        if (name === -1) {
            name = isJsonObj ? names[i] : i;
        } else {
            name = __RICH_JSON_COMPRESS_CACHE.addresses[name];
        }

        if (isJsonObject(member)) {
            address = resolveAddress(member);
            if (Object.hasOwn(__RICH_JSON_COMPRESS_CACHE.inheritances, address)) {
                haveChildrenInheritances = true;
                if (__RICH_JSON_COMPRESS_CACHE.inheritances[address].length > 0) {
                    name += "::" + __RICH_JSON_COMPRESS_CACHE.addresses[__RICH_JSON_COMPRESS_CACHE.inheritances[address].shift()];
                    __RICH_JSON_COMPRESS_CACHE.inheritances[address].forEach(
                        inheritance => name += "," + __RICH_JSON_COMPRESS_CACHE.addresses[inheritance]
                    );
                }
                delete __RICH_JSON_COMPRESS_CACHE.inheritances[address];
            }
            member = __compress(member);
        } else if (Array.isArray(member)) {
            member = __compress(member);
            if (isJsonObject(member)) {
                name = "#a:" + name;
            }
        }

        set(rv, name, i, member);
    }

    if (!haveChildrenInheritances && !isJsonObj) {
        names = getKeysSorted(rv);
        let array = [];
        for (let i = 0; i < names.length; ++i) {
            array[i] = rv[names[i]];
        }
        rv = array;
    }

    __RICH_JSON_COMPRESS_CIRCULAR_LEVEL--;
    if (__RICH_JSON_COMPRESS_CIRCULAR_LEVEL === 0) {
        if (isJsonObj) {
            rv = {"_": rv, "a": __RICH_JSON_COMPRESS_CACHE.redundancyNames};
        } else {
            rv = {"#a:_": rv, "a": __RICH_JSON_COMPRESS_CACHE.redundancyNames};
        }
        names = Object.keys(__RICH_JSON_COMPRESS_CACHE.redundancy);
        for (let i = 0; i < names.length; ++i) {
            name = names[i];
            __RICH_JSON_COMPRESS_CIRCULAR_LEVEL = 1;
            rv[__RICH_JSON_COMPRESS_CACHE.addresses[name]] = __compress(__RICH_JSON_COMPRESS_CACHE.redundancy[name], true);
        }
        __RICH_JSON_COMPRESS_CIRCULAR_LEVEL = 0;
        __resetCompressCache();
    }

    return rv;
}

function __resetCompressCache() {
    __RICH_JSON_COMPRESS_CACHE.records = {};
    __RICH_JSON_COMPRESS_CACHE.redundancy = {};
    __RICH_JSON_COMPRESS_CACHE.excludes = {};
    __RICH_JSON_COMPRESS_CACHE.inheritances = {};
    __RICH_JSON_COMPRESS_CACHE.names = [];
    __RICH_JSON_COMPRESS_CACHE.redundancyNames = [];
    __RICH_JSON_COMPRESS_CACHE.addresses = structuredClone(__RICH_JSON_COMPRESS_ADDRESSES);
    __resetAddressCache();
    if (DEBUG_LOG_RICH_JSON) {
        console.debug("RichJson compress cleared cache");
    }
}
