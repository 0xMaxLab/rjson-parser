import "../helper/RichJsonHelper.js"
import {
    __mergeIntoTarget,
    cloneObject,
    concatArrays,
    concatStrings,
    getFieldByKey,
    getKeysSorted,
    isJsonObject,
    mergeIntoTarget
} from "../helper/RichJsonHelper.js";
import {__RICH_JSON_COMMANDS, setCommandEnabled, __throwCommandNotFound} from "./RichJsonCommandHolder.js";
import {__mapClassByName} from "../other/RichJsonClassMapping.js";
import {__RICH_JSON_CONFIG} from "../other/RichJsonConfiguration.js";
import {RichJsonCache} from "./RichJsonCache.js";

export const __RICH_JSON_COMMAND_PREFIX = "$"
export const __RICH_JSON_COMMAND_SUFFIX = ":"
export const __RICH_JSON_COMMAND_WILDCARD = /^\$.*:.*/
export const __RICH_JSON_COMMAND_DELIMITER = ","
export const __RICH_JSON_COMMAND_PATH_DELIMITER = "/"
export const __RICH_JSON_COMMAND_PIPE_SIGN = "|"
export const __RICH_JSON_COMMAND_REF = "$ref"
export const __RICH_JSON_COMMAND_CLONE = "clone"
export const __RICH_JSON_KEY_COMMAND_MEMBER = "__$_rich_json_key_commands_$__"

export const __RICH_JSON_ARRAY_WILDCARD = /.*\[.*].*/
export const __RICH_JSON_ARRAY_DELIMITERS = /[\[\]]/
export const __RICH_JSON_ARRAY_REPLACE_SUBSTRING = "]["
export const __RICH_JSON_ARRAY_REPLACE_NEWSTRING = "]|["

export const __RICH_JSON_CONSTRUCTOR_SIGN = "="
export const __RICH_JSON_LATE_CONSTRUCTOR_SIGN = "=="
export const __RICH_JSON_LATE_CONSTRUCTOR_MEMBER = "__#_rich_json_construct_#__"
export const __RICH_JSON_INHERITANCE_SIGN = "::"

export const __RICH_JSON_NAME_IS_COMMAND = (name) => (name.charAt(0) === __RICH_JSON_COMMAND_PREFIX && name.indexOf(__RICH_JSON_COMMAND_SUFFIX) >= 0)
export const __RICH_JSON_NAME_IS_CONSTRUCTOR = (name) => (name.indexOf(__RICH_JSON_CONSTRUCTOR_SIGN) >= 0)
export const __RICH_JSON_NAME_IS_LATE_CONSTRUCTOR = (name) => (name.indexOf(__RICH_JSON_LATE_CONSTRUCTOR_SIGN) >= 0)
export const __RICH_JSON_NAME_IS_INHERITANCE = (name) => (name.indexOf(__RICH_JSON_INHERITANCE_SIGN) >= 0)

export const __RICH_JSON_INTERPOLATION_WILDCARD = /.*\{.*}.*/
export const __RICH_JSON_INTERPOLATION_OPENING_SIGN = "{"
export const __RICH_JSON_INTERPOLATION_CLOSING_SIGN = "}"

export const getObjectField = (object, name) => object[name];
export const setObjectField = (object, name, i, value) => object[name] = value;
export const getArrayElement = (array, name, i) => array[i];
export const setArrayElement = (array, name, i, value) => array[i] = value;

export class RichJsonContext {
    root = undefined;
    current = undefined;
    currentCommand = undefined;
    currentMember = undefined;
    currentAddress = undefined;
    currentName = undefined;
}

export class RichJsonParser {
    cache = new RichJsonCache();
    con = new RichJsonContext();

    constructor() {
        this.cache.inheritances = {};
        this.cache.cloneAddress = undefined;
    }

    parse(current, isRoot = false) {
        this.con.current = current;
        this.cache.level++;

        if (isRoot) {
            this.con.root = current;
            this.con.current = current;
            this.con.currentMember = current;
            this.con.currentAddress = this.cache.resolveAddress(current);
            this.con.current = this.__parseRichJsonInMember();
            this.cache.level--;
            if (__RICH_JSON_CONFIG.logEnabled && this.cache.level === 0) {
                console.log("RichJson was applied successfully.");
            }
            return current;
        }

        let isJsonObj = isJsonObject(current);
        let currentName = this.con.currentName;
        let currentAddress = this.con.currentAddress;
        let get;
        let set;
        let names;
        let name;

        if (isJsonObj) {
            this.__preprocess_kcommands_constructors_inheritances();
            get = getObjectField;
            set = setObjectField;
            names = getKeysSorted(current);
        } else {
            get = getArrayElement;
            set = setArrayElement;
            names = current;
        }

        for (let i = 0; i < names.length; ++i) {
            name = names[i];
            this.con.currentMember = get(current, name, i);
            this.con.currentAddress = isJsonObject(this.con.currentMember) || Array.isArray(this.con.currentMember)
                ? this.cache.resolveAddress(this.con.currentMember)
                : concatStrings(currentAddress, isJsonObj ? `_${name}` : `_${i}`)
            ;
            this.con.currentName = isJsonObj ? name : `"${currentName}_${i}`;
            this.con.currentMember = this.__parseRichJsonInMember();
            set(current, name, i, this.con.currentMember);
        }

        this.cache.level--;
        return current;
    }

    __preprocess_kcommands_constructors_inheritances() {
        let names = Object.keys(this.con.current);
        let iscmd;
        let kcmd;
        let isctr;
        let ctr;
        let isite;
        let ite;
        let name;
        let member;

        for (let i = 0; i < names.length; ++i) {
            name = names[i];
            iscmd = __RICH_JSON_NAME_IS_COMMAND(name);
            isctr = __RICH_JSON_NAME_IS_CONSTRUCTOR(name);
            isite = __RICH_JSON_NAME_IS_INHERITANCE(name);
            if (iscmd || isctr || isite) {
                member = this.con.current[name];
                delete this.con.current[name];
                // split key commands before inheritances
                if (iscmd) {
                    name = name.split(__RICH_JSON_COMMAND_SUFFIX, 2);
                    kcmd = name[0].substring(1).split(__RICH_JSON_COMMAND_PREFIX);
                    member[__RICH_JSON_KEY_COMMAND_MEMBER] = kcmd;
                    name = name[1];
                }
                // split inheritances before constructor (<name>=<class>::<inheritances>)
                if (isite) {
                    name = name.split(__RICH_JSON_INHERITANCE_SIGN, 2);
                    ite = name[1].trim();
                    name = name[0];
                }
                if (isctr) {
                    if (__RICH_JSON_NAME_IS_LATE_CONSTRUCTOR(name)) {
                        name = name.split(__RICH_JSON_LATE_CONSTRUCTOR_SIGN, 2);
                        member[__RICH_JSON_LATE_CONSTRUCTOR_MEMBER] = __mapClassByName(name[1].trim());
                        name = name[0];
                    } else {
                        name = name.split(__RICH_JSON_CONSTRUCTOR_SIGN, 2);
                        ctr = __mapClassByName(name[1].trim());
                        let cache = new RichJsonCache();
                        cache.stack = [];
                        member = __mergeIntoTarget(cache, new ctr(), member, true);
                        name = name[0];
                    }
                }
                if (isite) { // new object reference after constructor call
                    this.cache.inheritances[this.cache.resolveAddress(member)] = ite;
                }
                this.con.current[name.trim()] = member;
                if (!isJsonObject(member)) {
                    throw (`Inheritance on member '${name}' is not possible, because it is not a object.`);
                }
            }
        }
    }

    __parseRichJsonInMember() {
        if (Object.hasOwn(this.cache.stack, this.con.currentAddress)) {
            if (__RICH_JSON_CONFIG.debugEnabled) {
                console.debug(`RichJson cache <-- '${this.con.currentAddress}' ${this.cache.stack[this.con.currentAddress]}`);
            }
            return this.cache.stack[this.con.currentAddress];
        } else {
            if (__RICH_JSON_CONFIG.debugEnabled) {
                console.debug(`RichJson cache --> '${this.con.currentAddress}' ${this.con.currentMember}`);
            }
            this.cache.stack[this.con.currentAddress] = this.con.currentMember;
        }

        if (!this.__isMemberRichJsonAble(this.con.currentMember)) {
            return this.con.currentMember;
        }

        if (typeof this.con.currentMember === "string") {
            if (__RICH_JSON_CONFIG.stringInterpolationsEnabled && __RICH_JSON_INTERPOLATION_WILDCARD.test(this.con.currentMember)) {
                this.con.currentMember = this.__parseInterpolations();
                if (!this.con.currentMember.isParsed) {
                    return this.con.currentMember.result;
                } else {
                    this.con.currentMember = this.con.currentMember.result;
                }
            }
            return this.__executeRichJsonCommandIfContainedInMember();
        } else {
            let kcmd_ignored;
            let currentAddress = this.con.currentAddress;
            let isJsonObj = isJsonObject(this.con.currentMember);
            if (isJsonObj) {
                this.__executeClone(); // clone must be done first
                this.__callConstructor();
                this.cache.stack[currentAddress] = this.con.currentMember;
                kcmd_ignored = this.__getIgnoresForKeyCommands();
                kcmd_ignored.forEach(function (_ignored) {
                    setCommandEnabled(_ignored, false);
                });
                this.__resolveInheritances();
            }

            this.con.currentMember = this.parse(this.con.currentMember);

            if (isJsonObj) {
                this.__resetCloneIfPossible(currentAddress);
                kcmd_ignored.forEach(function (_ignored) {
                    setCommandEnabled(_ignored, true);
                });
                this.con.currentMember = this.__executeKeyCommands();
            }
            return this.con.currentMember;
        }
    }

    __isMemberRichJsonAble(member) {
        return typeof member === "string" || Array.isArray(member) || isJsonObject(member);
    }

    __parseInterpolations() {
        let rv = "";
        let inp = this.con.currentMember;
        let ipnLevel = -1;
        let ipns = [];
        let ipnParsed;
        let c;

        for (let i = 0; i < inp.length; ++i) {
            c = inp.charAt(i);
            if (c === __RICH_JSON_INTERPOLATION_OPENING_SIGN) {
                c = inp.charAt(i + 1);
                if ((c === __RICH_JSON_INTERPOLATION_OPENING_SIGN || c === __RICH_JSON_INTERPOLATION_CLOSING_SIGN)
                    && inp.charAt(i + 2) === __RICH_JSON_INTERPOLATION_CLOSING_SIGN) { // in order to escape '{{}' or '{}}'
                    rv += c;
                    i += 2;
                } else {
                    ipnLevel++;
                }
            } else if (c === __RICH_JSON_INTERPOLATION_CLOSING_SIGN) {
                this.con.currentMember = ipns[ipnLevel].rv;
                ipns[ipnLevel].rv = "";
                ipnLevel--;
                if ((ipns.length === ipnLevel + 3 && !ipns[ipnLevel + 2].isParsed)) { // in order to not resolve if children are unresolved
                    this.con.currentMember = concatStrings(__RICH_JSON_INTERPOLATION_OPENING_SIGN, this.con.currentMember, __RICH_JSON_INTERPOLATION_CLOSING_SIGN);
                } else {
                    this.con.currentMember = this.__executeRichJsonCommandIfContainedInMember();
                }
                ipnParsed = !__RICH_JSON_COMMAND_WILDCARD.test(this.con.currentMember);
                if (!ipnParsed) {
                    ipns[ipnLevel + 1].isParsed = false;
                }
                this.con.currentMember = ipnParsed
                    ? this.con.currentMember
                    : concatStrings(__RICH_JSON_INTERPOLATION_OPENING_SIGN, this.con.currentMember, __RICH_JSON_INTERPOLATION_CLOSING_SIGN)
                ;
                if (ipnLevel === -1) {
                    rv += this.con.currentMember;
                } else {
                    ipns[ipnLevel].rv += this.con.currentMember;
                }
            } else if (ipnLevel > -1) { // must be a ipn char
                if (ipns.length < ipnLevel + 1) {
                    ipns.push({rv: "", isParsed: true});
                }
                ipns[ipnLevel].rv += c;
            } else { // must be a normal char
                rv += c;
            }
        }

        this.cache.stack[this.con.currentAddress] = rv;
        return {result: rv, isParsed: ipns.length === 0 ? true : ipns[0].isParsed};
    }

    __getIgnoresForKeyCommands() {
        let rv = [];

        if (Object.hasOwn(this.con.currentMember, __RICH_JSON_KEY_COMMAND_MEMBER)) {
            let kcmd = undefined;
            for (let i = 0, len = this.con.currentMember[__RICH_JSON_KEY_COMMAND_MEMBER].length; i < len; ++i) {
                kcmd = this.con.currentMember[__RICH_JSON_KEY_COMMAND_MEMBER][i];
                if (this.__isRichJsonCommandEnabled(kcmd) && Object.hasOwn(__RICH_JSON_COMMANDS.kcmd_ignored, kcmd)) {
                    rv = concatArrays(rv, __RICH_JSON_COMMANDS.kcmd_ignored[kcmd]);
                }
            }
        }

        return rv;
    }

    __executeRichJsonCommandIfContainedInMember() {
        if (__RICH_JSON_COMMAND_WILDCARD.test(this.con.currentMember)) {
            this.cache.stack[this.con.currentAddress] = {};
            this.con.currentMember = this.con.currentMember.split(__RICH_JSON_COMMAND_SUFFIX, 2);
            this.con.currentCommand = this.con.currentMember[0];
            this.con.currentMember = this.con.currentMember[1].trim();
            this.con.currentMember = this.__tryRichJsonCommand();
            this.__resetCloneIfPossible(this.con.currentAddress);
            if (typeof this.con.currentMember === "function" && isJsonObject(this.con.currentMember)) { // in order to keep reference
                mergeIntoTarget(this.cache.stack[this.con.currentAddress], this.con.currentMember);
            } else {
                this.cache.stack[this.con.currentAddress] = this.con.currentMember;
            }
        }
        return this.con.currentMember;
    }

    __tryRichJsonCommand() {
        try {
            let unresolved_command = this.con.currentCommand;
            this.con.currentCommand = this.con.currentCommand.substring(1);
            this.con.currentMember = this.con.currentMember.replace(__RICH_JSON_ARRAY_REPLACE_SUBSTRING, __RICH_JSON_ARRAY_REPLACE_NEWSTRING);
            let unresolved_member = this.con.currentMember;

            let pipe_commands;
            if (this.con.currentMember.includes(__RICH_JSON_COMMAND_PIPE_SIGN)) {
                pipe_commands = this.con.currentMember.split(__RICH_JSON_COMMAND_PIPE_SIGN);
                this.con.currentMember = pipe_commands.shift();
            }

            let batch_commands = this.con.currentCommand.split(__RICH_JSON_COMMAND_PREFIX);
            for (let i = 0; i < batch_commands.length; ++i) {
                this.con.currentCommand = batch_commands[i];
                if (this.__isRichJsonCommandEnabled(this.con.currentCommand)) {
                    if (typeof this.con.currentMember === "string" && __RICH_JSON_ARRAY_WILDCARD.test(this.con.currentMember)) {
                        let array = this.con.currentMember.split(__RICH_JSON_ARRAY_DELIMITERS, 3);
                        this.con.currentMember = array[0];
                        this.con.currentMember = __RICH_JSON_COMMANDS.enabled[this.con.currentCommand](this, this.con);
                        this.con.currentMember = this.con.currentMember[array[1].trim()];
                    } else {
                        this.con.currentMember = __RICH_JSON_COMMANDS.enabled[this.con.currentCommand](this, this.con);
                    }
                } else {
                    return `${unresolved_command}${unresolved_member}`; // reset member due to disabled command
                }
            }

            if (pipe_commands === undefined) {
                return this.con.currentMember;
            }

            let root = this.con.root;
            for (let i = 0; i < pipe_commands.length; ++i) {
                this.con.currentCommand = pipe_commands[i].split(__RICH_JSON_COMMAND_SUFFIX, 2);
                if (this.con.currentCommand.length === 1) {
                    this.con.currentCommand.splice(0, 0, __RICH_JSON_COMMAND_REF);
                }
                this.con.root = this.con.currentMember;
                this.con.currentMember = this.con.currentCommand[1].trim();
                this.con.currentCommand = this.con.currentCommand[0].trim();
                this.con.currentMember = this.__tryRichJsonCommand();
                if (__RICH_JSON_COMMAND_WILDCARD.test(this.con.currentMember)) {
                    return `${unresolved_command}${unresolved_member}`; // reset member due to disabled command
                }
            }
            this.con.root = root;

            return this.con.currentMember;
        } catch (exception) {
            console.error(exception.stack);
            throw (`RichJson ${__RICH_JSON_COMMAND_PREFIX}${this.con.currentCommand} could not be resolved in ${this.con.currentName}.`);
        }
    }

    __isRichJsonCommandEnabled(command) {
        if (!Object.hasOwn(__RICH_JSON_COMMANDS.available, command)) {
            __throwCommandNotFound(command);
        }
        return __RICH_JSON_COMMANDS.enabled[command] !== __RICH_JSON_COMMANDS.void;
    }

    __executeClone() {
        if (Object.hasOwn(this.con.currentMember, __RICH_JSON_KEY_COMMAND_MEMBER)) {
            let key_commands = this.con.currentMember[__RICH_JSON_KEY_COMMAND_MEMBER];
            if (key_commands.includes(__RICH_JSON_COMMAND_CLONE) && this.__isRichJsonCommandEnabled(__RICH_JSON_COMMAND_CLONE)) {
                this.con.currentCommand = __RICH_JSON_COMMAND_CLONE;
                this.con.currentMember = this.__tryRichJsonKeyCommand();
                key_commands = this.con.currentMember[__RICH_JSON_KEY_COMMAND_MEMBER];
                key_commands.splice(key_commands.indexOf(__RICH_JSON_COMMAND_CLONE), 1);
            }
        }
    }

    __callConstructor() {
        if (__RICH_JSON_CONFIG.lateConstructorEnabled && Object.hasOwn(this.con.currentMember, __RICH_JSON_LATE_CONSTRUCTOR_MEMBER)) {
            let cstr = this.con.currentMember[__RICH_JSON_LATE_CONSTRUCTOR_MEMBER];
            this.con.currentMember = __mergeIntoTarget(new cstr(), this.con.currentMember);
            delete this.con.currentMember[__RICH_JSON_LATE_CONSTRUCTOR_MEMBER];
            if (__RICH_JSON_CONFIG.debugEnabled)
                console.debug(`RichJson resolved construct for '${typeof cstr}'.`);
        }
    }

    __resolveInheritances() {
        if (getFieldByKey(this.cache.inheritances, this.con.currentAddress) === undefined) {
            return;
        }

        let inheritance_chain = this.cache.inheritances[this.con.currentAddress].split(__RICH_JSON_COMMAND_DELIMITER);
        let member = this.con.currentMember;

        for (let i = 0; i < inheritance_chain.length; ++i) {
            this.con.currentMember = inheritance_chain[i].trim();
            if (__RICH_JSON_COMMAND_WILDCARD.test(this.con.currentMember)) {
                this.con.currentMember = this.con.currentMember.split(__RICH_JSON_COMMAND_SUFFIX, 2);
                this.con.currentCommand = this.con.currentMember[0].trim();
                this.con.currentMember = this.con.currentMember[1].trim();
            } else {
                this.con.currentCommand = __RICH_JSON_COMMAND_REF;
            }
            this.con.currentMember = mergeIntoTarget(member, cloneObject(this.__tryRichJsonCommand()));
        }
    }

    __resetCloneIfPossible(_address) {
        if (this.__isCloneApplying && this.cache.cloneAddress === _address) {
            this.cache.cloneAddress = undefined;
        }
    }

    __isCloneApplying() {
        return this.cache.cloneAddress !== undefined;
    }

    __executeKeyCommands() {
        if (Object.hasOwn(this.con.currentMember, __RICH_JSON_KEY_COMMAND_MEMBER)) {
            let key_commands = this.con.currentMember[__RICH_JSON_KEY_COMMAND_MEMBER];
            let command;
            for (let i = 0; i < key_commands.length; ++i) {
                command = key_commands[i];
                if (this.__isRichJsonCommandEnabled(command)) {
                    this.con.currentCommand = command;
                    this.con.currentMember = this.__tryRichJsonKeyCommand();
                    key_commands.splice(i, 1);
                    i--;
                }
            }
            if (isJsonObject(this.con.currentMember) && this.con.currentMember[__RICH_JSON_KEY_COMMAND_MEMBER].length === 0) { // due to keep
                delete this.con.currentMember[__RICH_JSON_KEY_COMMAND_MEMBER];
            }
        }
        return this.con.currentMember;
    }

    __tryRichJsonKeyCommand() {
        try {
            return __RICH_JSON_COMMANDS.enabled[this.con.currentCommand](this, this.con);
        } catch (exception) {
            console.error(exception.stack);
            throw (`RichJson key command ${__RICH_JSON_COMMAND_PREFIX}${this.con.currentCommand} could not be resolved in ${this.con.currentName}.`);
        }
    }
}
