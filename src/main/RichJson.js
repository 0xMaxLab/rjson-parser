
import "./RichJsonHelper"
import {
    resolveAddress, concatArrays, cloneObject,
    isJsonObject, concatStrings, matchesWildcard,
    getKeysSorted, mergeIntoTarget,
    getFieldByKey, __mergeIntoTarget, __resetAddressCache
} from "./RichJsonHelper";
import {
    __setRichJsonCommandEnabled,
    __RICH_JSON_COMMANDS,
    __throwCommandNotFound
} from "./commands/RichJson_cmd";
import {DEBUG_LOG_RICH_JSON, RICH_JSON_LATE_CONSTRUCT_ENABLED} from "./RichJsonConfiguration";
import {getArrayElement, getObjectField, setArrayElement, setObjectField} from "./RichJson_GetterAndSetter";
import {__mapClassByName} from "./RichJsonClassMapping";

export const __RICH_JSON_COMMAND_PREFIX				        = "#"
export const __RICH_JSON_COMMAND_SUFFIX				        = ":"
export const __RICH_JSON_COMMAND_WILDCARD				    = "#*:*"
export const __RICH_JSON_COMMAND_DELIMITER			        = ","
export const __RICH_JSON_COMMAND_PATH_DELIMITER		        = "/"
export const __RICH_JSON_COMMAND_PIPE_SIGN			        = "|"
export const __RICH_JSON_COMMAND_REF					    = "#ref"
export const __RICH_JSON_COMMAND_CLONE					    = "clone"
export const __RICH_JSON_KEY_COMMAND_MEMBER			        = "__#_rich_json_key_commands_#__"

export const __RICH_JSON_ARRAY_WILDCARD				        = "*[*]*"
export const __RICH_JSON_ARRAY_DELIMITERS			        = /[\[\]]/
export const __RICH_JSON_ARRAY_REPLACE_SUBSTRING		    = "]["
export const __RICH_JSON_ARRAY_REPLACE_NEWSTRING		    = "]|["

export let __RICH_JSON_CLONE_ADDRESS				        = undefined
export const __RICH_JSON_CLONE_IS_APPLYING			        = () => __RICH_JSON_CLONE_ADDRESS !== undefined

export const __RICH_JSON_CONSTRUCTOR_SIGN				    = "="
export const __RICH_JSON_LATE_CONSTRUCTOR_SIGN		        = "=="
export const __RICH_JSON_LATE_CONSTRUCTOR_MEMBER		    = "__#_rich_json_construct_#__"
export const __RICH_JSON_INHERITANCE_SIGN				    = "::"

export const __RICH_JSON_NAME_IS_COMMAND			        = (name) => (name.charAt(0) === __RICH_JSON_COMMAND_PREFIX && name.indexOf(__RICH_JSON_COMMAND_SUFFIX) >= 0)
export const __RICH_JSON_NAME_IS_CONSTRUCTOR		        = (name) => (name.indexOf(__RICH_JSON_CONSTRUCTOR_SIGN) >= 0)
export const __RICH_JSON_NAME_IS_LATE_CONSTRUCTOR	        = (name) => (name.indexOf(__RICH_JSON_LATE_CONSTRUCTOR_SIGN) >= 0)
export const __RICH_JSON_NAME_IS_INHERITANCE		        = (name) => (name.indexOf(__RICH_JSON_INHERITANCE_SIGN) >= 0)

export const __RICH_JSON_INTERPOLATION_WILDCARD		        = "*{*}*"
export const __RICH_JSON_INTERPOLATION_OPENING_SIGN	        = "{"
export const __RICH_JSON_INTERPOLATION_CLOSING_SIGN	        = "}"

export let __RICH_JSON_CIRCULAR_LEVEL = 0
export let __RICH_JSON_CIRCULAR_CACHE = {
    stack: {},
    resolved: {},
    inheritances: {},
    interfaces: {}
};

export function __parseRichJson(current, root, currentAddress, currentName) {
    __RICH_JSON_CIRCULAR_LEVEL++;

    if (currentAddress === undefined) {
        current = __parseRichJsonInMember(root, current, current, resolveAddress(current), "");
        __RICH_JSON_CIRCULAR_LEVEL--;
        if (__RICH_JSON_CIRCULAR_LEVEL === 0) {
            __resetRichJsonCache();
        }
        return current;
    }

    let isJsonObj   = isJsonObject(current);
    let get;
    let set;
    let names;
    let name;
    let member;
    let address;

    if (isJsonObj) {
        __preprocess_kcommands_constructors_inheritances(current);
        get = getObjectField;
        set = setObjectField;
        names = getKeysSorted(current);
    } else {
        get = getArrayElement;
        set = setArrayElement;
        names = current;
    }

    for (let i = 0; i < names.length; ++i) {
        name	= names[i];
        member	= get(current, name, i);
        address = isJsonObject(member) || Array.isArray(member)
            ? resolveAddress(member)
            : concatStrings(currentAddress, isJsonObj ? `_${name}` : `_${i}`)
        ;
        member = __parseRichJsonInMember(root, current, member, address, isJsonObj ? name : `"${currentName}_${i}`);
        set(current, name, i, member);
    }

    __RICH_JSON_CIRCULAR_LEVEL--;
    return current;
}

function __preprocess_kcommands_constructors_inheritances(currentMember) {
    let names = Object.keys(currentMember);
    let iscmd;
    let kcmd;
    let isctr;
    let ctr;
    let isite;
    let ite;
    let name;
    let member;

    for (let i = 0; i < names.length; ++i) {
        name	= names[i];
        iscmd	= __RICH_JSON_NAME_IS_COMMAND(name);
        isctr	= __RICH_JSON_NAME_IS_CONSTRUCTOR(name);
        isite	= __RICH_JSON_NAME_IS_INHERITANCE(name);
        if (iscmd || isctr || isite) {
            member = currentMember[name];
            delete currentMember[name];
            // split key commands before inheritances
            if (iscmd) {
                name = name.split(__RICH_JSON_COMMAND_SUFFIX, 2);
                kcmd = name[0].substring(1).split(__RICH_JSON_COMMAND_PREFIX);
                member[__RICH_JSON_KEY_COMMAND_MEMBER] = kcmd;
                name = name[1];
            }
            // split inheritances before constructor (<name>=<class>::<inheritances>)
            if (isite) {
                name	= name.split(__RICH_JSON_INHERITANCE_SIGN, 2);
                ite		= name[1].trim();
                name	= name[0];
            }
            if (isctr) {
                if (__RICH_JSON_NAME_IS_LATE_CONSTRUCTOR(name)) {
                    name	= name.split(__RICH_JSON_LATE_CONSTRUCTOR_SIGN, 2);
                    member[__RICH_JSON_LATE_CONSTRUCTOR_MEMBER] = __mapClassByName(name[1].trim());
                    name	= name[0];
                } else {
                    name	= name.split(__RICH_JSON_CONSTRUCTOR_SIGN, 2);
                    ctr		= __mapClassByName(name[1].trim());
                    member	= __mergeIntoTarget(new ctr(), member, true);
                    name	= name[0];
                }
            }
            if (isite) { // new object reference after constructor call
                __RICH_JSON_CIRCULAR_CACHE.inheritances[resolveAddress(member)] = ite;
            }
            currentMember[name.trim()] = member;
            if (!isJsonObject(member)) {
                throw(`Inheritance on member '${name}' is not possible, because it is not a object.`);
            }
        }
    }
}

export function __isMemberRichJsonAble(member) {
    return typeof member === "string" || Array.isArray(member) || isJsonObject(member);
}

export function __parseRichJsonInMember(root, current, currentMember, currentAddress, currentName) {
    if (Object.hasOwn(__RICH_JSON_CIRCULAR_CACHE.stack, currentAddress)) {
        if (DEBUG_LOG_RICH_JSON) {
            console.log(`RichJson cache <-- '${currentAddress}' ${__RICH_JSON_CIRCULAR_CACHE.stack[currentAddress]}`);
        }
        return __RICH_JSON_CIRCULAR_CACHE.stack[currentAddress];
    } else {
        if (DEBUG_LOG_RICH_JSON) {
            console.debug(`RichJson cache --> '${currentAddress}' ${currentMember}`);
        }
        __RICH_JSON_CIRCULAR_CACHE.stack[currentAddress] = currentMember;
    }

    if (!__isMemberRichJsonAble(currentMember)) {
        return currentMember;
    }

    if (typeof currentMember === "string") {
        if (matchesWildcard(currentMember, __RICH_JSON_INTERPOLATION_WILDCARD)) {
            currentMember = __parseInterpolations(root, current, currentMember, currentAddress, currentName);
            if (!currentMember.isParsed) {
                return currentMember.result;
            } else {
                currentMember = currentMember.result;
            }
        }
        return __executeRichJsonCommandIfContainedInMember(root, current, currentMember, currentAddress, currentName);
    } else {
        let kcmd_ignored;
        let isJsonObj = isJsonObject(currentMember);
        if (isJsonObj) {
            currentMember = __executeClone(root, current, currentMember, currentAddress, currentName); // clone must be done first
            currentMember = __callConstructor(currentMember);
            __RICH_JSON_CIRCULAR_CACHE.stack[currentAddress] = currentMember;
            kcmd_ignored = __getIgnoresForKeyCommands(currentMember);
            kcmd_ignored.forEach(function(_ignored) {
                __setRichJsonCommandEnabled(_ignored, false);
            });
            __resolveInheritances(root, current, currentMember, currentAddress, currentName);
        }

        __parseRichJson(currentMember, root, currentAddress, currentName);

        if (isJsonObj) {
            __resetCloneIfPossible(currentAddress);
            kcmd_ignored.forEach(function(_ignored) {
                __setRichJsonCommandEnabled(_ignored, true);
            });
            currentMember = __executeKeyCommands(root, current, currentMember, currentAddress, currentName);
        }
        return currentMember;
    }
}

function __getIgnoresForKeyCommands(currentMember) {
    let rv = [];

    if (Object.hasOwn(currentMember, __RICH_JSON_KEY_COMMAND_MEMBER)) {
        let kcmd = undefined;
        for (let i = 0, len = currentMember[__RICH_JSON_KEY_COMMAND_MEMBER].length; i < len; ++i) {
            kcmd = currentMember[__RICH_JSON_KEY_COMMAND_MEMBER][i];
            if (__isRichJsonCommandEnabled(kcmd) && Object.hasOwn(__RICH_JSON_COMMANDS.kcmd_ignored, kcmd)) {
                rv = concatArrays(rv, __RICH_JSON_COMMANDS.kcmd_ignored[kcmd]);
            }
        }
    }

    return rv;
}

function __parseInterpolations(root, current, currentMember, currentAddress, currentName) {
    let rv				= "";
    let ipnLevel		= -1;
    let ipns			= [];
    let ipnParsed;
    let ipnResult;
    let c;

    for (let i = 0; i <= currentMember.length; ++i) {
        c = currentMember.charAt(i);
        if (c === __RICH_JSON_INTERPOLATION_OPENING_SIGN) {
            c = currentMember.charAt(i + 1);
            if ((c === __RICH_JSON_INTERPOLATION_OPENING_SIGN || c === __RICH_JSON_INTERPOLATION_CLOSING_SIGN)
                && currentMember.charAt(i + 2) === __RICH_JSON_INTERPOLATION_CLOSING_SIGN) { // in order to escape '{{}' or '{}}'
                rv += c;
                i += 2;
            } else {
                ipnLevel++;
            }
        } else if (c === __RICH_JSON_INTERPOLATION_CLOSING_SIGN) {
            ipnResult = ipns[ipnLevel].rv;
            ipns[ipnLevel].rv = "";
            ipnLevel--;
            if ((ipns.length === ipnLevel + 3 && !ipns[ipnLevel + 2].isParsed)) { // in order to not resolve if children are unresolved
                ipnResult = concatStrings(__RICH_JSON_INTERPOLATION_OPENING_SIGN, ipnResult, __RICH_JSON_INTERPOLATION_CLOSING_SIGN);
            } else {
                ipnResult = __executeRichJsonCommandIfContainedInMember(root, current, ipnResult, currentAddress, currentName);
            }
            ipnParsed = !matchesWildcard(ipnResult, __RICH_JSON_COMMAND_WILDCARD);
            if (!ipnParsed) {
                ipns[ipnLevel + 1].isParsed = false;
            }
            ipnResult = ipnParsed
                ? ipnResult
                : concatStrings(__RICH_JSON_INTERPOLATION_OPENING_SIGN, ipnResult, __RICH_JSON_INTERPOLATION_CLOSING_SIGN)
            ;
            if (ipnLevel === -1) {
                rv += ipnResult;
            } else {
                ipns[ipnLevel].rv += ipnResult;
            }
        } else if (ipnLevel > -1) { // must be a ipn char
            if (ipns.length < ipnLevel + 1) {
                ipns.push({ rv: "", isParsed: true});
            }
            ipns[ipnLevel].rv += c;
        } else { // must be a normal char
            rv += c;
        }
    }

    __RICH_JSON_CIRCULAR_CACHE.stack[currentAddress] = rv;
    return { result: rv, isParsed: ipns.length === 0 ? true : ipns[0].isParsed };
}

function __executeRichJsonCommandIfContainedInMember(root, current, currentMember, currentAddress, currentName) {
    if (matchesWildcard(currentMember, __RICH_JSON_COMMAND_WILDCARD)) {
        __RICH_JSON_CIRCULAR_CACHE.stack[currentAddress] = {};
        currentMember	= currentMember.split(__RICH_JSON_COMMAND_SUFFIX, 2);
        let command	    = currentMember[0];
        currentMember	= currentMember[1].trim();
        currentMember	= __tryRichJsonCommand(root, current, command, currentMember, currentAddress, currentName);
        __resetCloneIfPossible(currentAddress);
        if (typeof currentMember === "function" && isJsonObject(currentMember)) { // in order to keep reference
            mergeIntoTarget(__RICH_JSON_CIRCULAR_CACHE.stack[currentAddress], currentMember);
        } else {
            __RICH_JSON_CIRCULAR_CACHE.stack[currentAddress] = currentMember;
        }
    }
    return currentMember;
}

function __tryRichJsonCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    try {
        currentCommand = currentCommand.substring(1);
        currentMember = currentMember.replace(__RICH_JSON_ARRAY_REPLACE_SUBSTRING, __RICH_JSON_ARRAY_REPLACE_NEWSTRING);
        let unresolved_member = currentMember;

        let pipe_commands;
        let pcommand;
        if (currentMember.includes(__RICH_JSON_COMMAND_PIPE_SIGN)) {
            pipe_commands = currentMember.split(__RICH_JSON_COMMAND_PIPE_SIGN);
            currentMember = pipe_commands.shift();
        }

        let batch_commands = currentCommand.split(__RICH_JSON_COMMAND_PREFIX);
        let bcommand;
        for (let i = 0; i < batch_commands.length; ++i) {
            bcommand = batch_commands[i];
            if (__isRichJsonCommandEnabled(bcommand)) {
                if (matchesWildcard(currentMember, __RICH_JSON_ARRAY_WILDCARD)) {
                    let array = currentMember.split(__RICH_JSON_ARRAY_DELIMITERS, 3);
                    currentMember = __RICH_JSON_COMMANDS.enabled[bcommand](root, current, bcommand, array[0], currentAddress, currentName);
                    currentMember = currentMember[array[1].trim()];
                } else {
                    currentMember = __RICH_JSON_COMMANDS.enabled[bcommand](root, current, bcommand, currentMember, currentAddress, currentName);
                }
            } else {
                return `${__RICH_JSON_COMMAND_PREFIX}${currentCommand}${__RICH_JSON_COMMAND_SUFFIX}${unresolved_member}`; // reset member due to disabled command
            }
        }

        if (pipe_commands === undefined) {
            return currentMember;
        }

        for (let i = 0; i < pipe_commands.length; ++i) {
            pcommand = pipe_commands[i].split(__RICH_JSON_COMMAND_SUFFIX, 2);
            if (pcommand.length === 1) {
                pcommand.splice(0, 0, __RICH_JSON_COMMAND_REF);
            }
            currentMember = __tryRichJsonCommand(currentMember, current, pcommand[0].trim(), pcommand[1].trim(), currentAddress, currentName);
            if (matchesWildcard(currentMember, __RICH_JSON_COMMAND_WILDCARD)) {
                return `${__RICH_JSON_COMMAND_PREFIX}${currentCommand}${__RICH_JSON_COMMAND_SUFFIX}${unresolved_member}`; // reset member due to disabled command
            }
        }

        return currentMember;
    } catch (exception) {
        __resetRichJsonCache();
        console.error(exception.stack);
        throw(`RichJson ${__RICH_JSON_COMMAND_PREFIX}${currentCommand} could not be resolved in ${currentName}.`);
    }
}

function __isRichJsonCommandEnabled(command) {
    if (!Object.hasOwn(__RICH_JSON_COMMANDS.available, command)) {
        __throwCommandNotFound(command);
    }
    return __RICH_JSON_COMMANDS.enabled[command] !== __RICH_JSON_COMMANDS.void;
}

function __executeClone(root, current, currentMember, currentAddress, currentName) {
    if (Object.hasOwn(currentMember, __RICH_JSON_KEY_COMMAND_MEMBER)) {
        let key_commands = currentMember[__RICH_JSON_KEY_COMMAND_MEMBER];
        if (key_commands.includes(__RICH_JSON_COMMAND_CLONE) && __isRichJsonCommandEnabled(__RICH_JSON_COMMAND_CLONE)) {
            currentMember = __tryRichJsonKeyCommand(root, current, __RICH_JSON_COMMAND_CLONE, currentMember, currentAddress, currentName);
            key_commands = currentMember[__RICH_JSON_KEY_COMMAND_MEMBER];
            key_commands.splice(key_commands.indexOf(__RICH_JSON_COMMAND_CLONE), 1);
        }
    }
    return currentMember;
}

function __callConstructor(currentMember) {
    if (RICH_JSON_LATE_CONSTRUCT_ENABLED && Object.hasOwn(currentMember, __RICH_JSON_LATE_CONSTRUCTOR_MEMBER)) {
        let cstr = currentMember[__RICH_JSON_LATE_CONSTRUCTOR_MEMBER];
        currentMember = __mergeIntoTarget(new cstr(), currentMember);
        delete currentMember[__RICH_JSON_LATE_CONSTRUCTOR_MEMBER];
        if (DEBUG_LOG_RICH_JSON)
            console.debug(`RichJson resolved construct for '${typeof cstr}' in '${_name}'.`);
    }
    return currentMember;
}

function __resolveInheritances(root, current, currentMember, currentAddress, currentName) {
    if (getFieldByKey(__RICH_JSON_CIRCULAR_CACHE.inheritances, currentAddress) === undefined) {
        return;
    }

    let inheritance_chain = __RICH_JSON_CIRCULAR_CACHE.inheritances[currentAddress].split(__RICH_JSON_COMMAND_DELIMITER);
    let inheritance;
    let command;

    for (let i = 0; i < inheritance_chain.length; ++i) {
        inheritance = inheritance_chain[i].trim();
        if (matchesWildcard(inheritance, __RICH_JSON_COMMAND_WILDCARD)) {
            inheritance	= inheritance.split(__RICH_JSON_COMMAND_SUFFIX, 2);
            command		= inheritance[0].trim();
            inheritance	= inheritance[1].trim();
        } else {
            command		= __RICH_JSON_COMMAND_REF;
        }
        mergeIntoTarget(currentMember, cloneObject(__tryRichJsonCommand(root, current, command, inheritance, currentAddress, currentName)));
    }
}

function __resetCloneIfPossible(_address) {
    if (__RICH_JSON_CLONE_IS_APPLYING && __RICH_JSON_CLONE_ADDRESS === _address) {
        __RICH_JSON_CLONE_ADDRESS = undefined;
    }
}

function __executeKeyCommands(root, current, currentMember, currentAddress, currentName) {
    if (Object.hasOwn(currentMember, __RICH_JSON_KEY_COMMAND_MEMBER)) {
        let key_commands = currentMember[__RICH_JSON_KEY_COMMAND_MEMBER];
        let command;
        for (let i = 0; i < key_commands.length; ++i) {
            command = key_commands[i];
            if (__isRichJsonCommandEnabled(command)) {
                currentMember = __tryRichJsonKeyCommand(root, current, command, currentMember, currentAddress, currentName);
                key_commands.splice(i, 1);
                i--;
            }
        }
        if (isJsonObject(currentMember) && currentMember[__RICH_JSON_KEY_COMMAND_MEMBER].length === 0) { // due to keep
            delete currentMember[__RICH_JSON_KEY_COMMAND_MEMBER];
        }
    }
    return currentMember;
}

function __tryRichJsonKeyCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    try {
        return __RICH_JSON_COMMANDS.enabled[currentCommand](root, current, currentCommand, currentMember, currentAddress, currentName);
    } catch (exception) {
        __resetRichJsonCache();
        console.error(exception.stack);
        throw (`RichJson key command ${__RICH_JSON_COMMAND_PREFIX}${currentCommand} could not be resolved in ${currentName}.`);
    }
}

function __resetRichJsonCache() {
    __RICH_JSON_CIRCULAR_LEVEL = 0;
    __RICH_JSON_CIRCULAR_CACHE.stack = {};
    __RICH_JSON_CIRCULAR_CACHE.inheritances = {};
    __RICH_JSON_CIRCULAR_CACHE.interfaces = {};
    __resetAddressCache();
    if (DEBUG_LOG_RICH_JSON) {
        console.debug("RichJson cache was reseted.");
    }
}
