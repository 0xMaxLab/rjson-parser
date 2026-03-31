import {mergeIntoWithoutRebind} from "../helper/RichJsonHelper.js";
import {__executeRefCommand} from "../commands/RichJson_ref.js";
import {__executeEnvCommand} from "../commands/RichJson_env.js";
import {__executeFileCommand} from "../commands/RichJson_file.js";
import {__executeFolderCommand} from "../commands/RichJson_folder.js";
import {__executeMergeCommand} from "../commands/RichJson_merge.js";
import {__executeMergeFolderCommand} from "../commands/RichJson_merge_folder.js";
import {__executeCopyCommand} from "../commands/RichJson_copy.js";
import {__executeCloneCommand} from "../commands/RichJson_clone.js";
import {__executeThisCommand} from "../commands/RichJson_this.js";
import {__executeInvokeCommand} from "../commands/RichJson_invoke.js";
import {__RICH_JSON_CONFIG} from "../other/RichJsonConfiguration.js";

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


/**
 * Toggles a RichJson command's enabled state.
 * @param {string} command - Name of the command to toggle.
 * @param {boolean} enabled - Whether to enable or disable the command.
 * @throws {Error} If the command is not in the available registry.
 */
export function setCommandEnabled(command, enabled) {
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


