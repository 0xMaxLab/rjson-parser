import {mergeIntoWithoutRebind} from "./RichJsonHelper";
import {__executeRefCommand} from "./commands/RichJson_ref";
import {__executeEnvCommand} from "./commands/RichJson_env";
import {__executeFileCommand} from "./commands/RichJson_file";
import {__executeFolderCommand} from "./commands/RichJson_folder";
import {__executeMergeCommand} from "./commands/RichJson_merge";
import {__executeMergeFolderCommand} from "./commands/RichJson_merge_folder";
import {__executeCopyCommand} from "./commands/RichJson_copy";
import {__executeCloneCommand} from "./commands/RichJson_clone";
import {__executeThisCommand} from "./commands/RichJson_this";
import {__executeInvokeCommand} from "./commands/RichJson_invoke";

class RichJsonCommandHolder {
    void = function () {
    }
    available = {
        ref: __executeRefCommand,
        env: __executeEnvCommand,
        this: __executeThisCommand,

        merge: __executeMergeCommand,
        copy: __executeCopyCommand,
        clone: __executeCloneCommand,
        invoke: __executeInvokeCommand,

        file: __executeFileCommand,
        folder: __executeFolderCommand,
        merge_folder: __executeMergeFolderCommand,
    };
    enabled = {};
    built_in = {};
    kcmd_ignored = {};

    constructor() {
        mergeIntoWithoutRebind(this.enabled, this.available);
        mergeIntoWithoutRebind(this.built_in, this.available);
    }
}

export let __RICH_JSON_COMMANDS = new RichJsonCommandHolder();
export let __RICH_JSON_LATE_APPLIES = ["this", "clone", "invoke"];

export function __setRichJsonCommandEnabled(command, enabled) {
    if (!Object.hasOwn(__RICH_JSON_COMMANDS.available, command)) {
        __throwCommandNotFound(command);
    }

    if (enabled) {
        __RICH_JSON_COMMANDS.enabled[command] = __RICH_JSON_COMMANDS.available[command];
    } else {
        __RICH_JSON_COMMANDS.enabled[command] = __RICH_JSON_COMMANDS.void;
    }

    if (__RICH_JSON_CONFIG.debugEnabled) {
        console.debug(`RichJson command '${command}' was ${enabled ? "enabled" : "disabled"}.`);
    }
}

export function __throwCommandNotFound(command) {
    throw (`RichJson Command '${command}' not found`);
}


