import {mergeIntoWithoutRebind} from "../RichJsonHelper";
import {DEBUG_LOG_RICH_JSON} from "../RichJsonConfiguration";
import {__executeRefCommand} from "./RichJson_cmd_ref";
import {__executeEnvCommand} from "./RichJson_cmd_env";
import {__executeFileCommand} from "./RichJson_cmd_file";
import {__executeFolderCommand} from "./RichJson_cmd_folder";
import {__executeMergeCommand} from "./RichJson_cmd_merge";
import {__executeMergeFolderCommand} from "./RichJson_cmd_merge_folder";
import {__executeCopyCommand} from "./RichJson_cmd_copy";
import {__executeCloneCommand} from "./RichJson_cmd_clone";
import {__executeThisCommand} from "./RichJson_cmd_this";
import {__executeInvokeCommand} from "./RichJson_cmd_invoke";
import {__executeArrayCommand} from "./RichJson_cmd_array";

class RichJsonCommandHolder {
    void        = function() {}
    available	= {
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

        a: __executeArrayCommand,
    };
    enabled		    = {};
    built_in		= {};
    kcmd_ignored	= {};

    constructor() {
        mergeIntoWithoutRebind(this.enabled, this.available);
        mergeIntoWithoutRebind(this.built_in, this.available);
    }
}

export let __RICH_JSON_COMMANDS         = new RichJsonCommandHolder();
export let __RICH_JSON_LATE_APPLIES     = ["this", "clone", "invoke"];

export function __setRichJsonCommandEnabled(command, enabled) {
    if (!Object.hasOwn(__RICH_JSON_COMMANDS.available, command)) {
        __throwCommandNotFound(command);
    }

    if (enabled) {
        __RICH_JSON_COMMANDS.enabled[command] = __RICH_JSON_COMMANDS.available[command];
    } else {
        __RICH_JSON_COMMANDS.enabled[command] = __RICH_JSON_COMMANDS.void;
    }

    if (DEBUG_LOG_RICH_JSON) {
        console.debug(`RichJson command '${command}' was ${enabled ? "enabled" : "disabled"}.`);
    }
}

export function __throwCommandNotFound(command) {
    throw(`RichJson Command '${command}' not found`);
}


