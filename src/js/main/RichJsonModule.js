import {__RICH_JSON_COMMANDS, __RICH_JSON_LATE_APPLIES} from "./RichJsonCommandHolder.js";

const __RICH_JSON_MODULES = {};

/**
 * Use this class in order to write your own RichJson modules.
 */
export class RichJsonModule {
    name = "";
    lateApplies = [];
    commands = {};
    kcmdIgnores = {};
    isIncluded = false;

    constructor(name) {
        this.name = name;
    }

    /**
     * Registers a command that is flagged for late application.
     * This adds the command name to the late application queue and defines its
     * execution logic and ignore rules.
     *
     * @param name    The unique identifier for the command.
     * @param func    The function or logic to be executed when the command is called.
     * @param ignores An optional array of identifiers or contexts that this command
     * should ignore. Defaults to undefined.
     * @return        The current instance for method chaining.
     */
    addLateApply(name, func, ignores = undefined) {
        this.lateApplies.push(name);
        if (Array.isArray(ignores)) {
            this.kcmdIgnores[name] = ignores;
        }
        return this.addCommand(name, func);
    }

    /**
     * Adds a standard command to the command registry.
     * Mapping the command name to its respective function and optionally
     * setting up ignore rules.
     *
     * @param name    The unique identifier for the command.
     * @param func    The function or logic to be executed when the command is called.
     * @param ignores An optional array of identifiers or contexts that this command
     * should ignore. Defaults to undefined.
     * @return        The current instance for method chaining.
     */
    addCommand(name, func, ignores = undefined) {
        this.commands[name] = func;
        if (Array.isArray(ignores)) {
            this.kcmdIgnores[name] = ignores;
        }
        return this;
    }

    __include() {
        this.isIncluded = true;
        Object.entries(this.commands).forEach(([name, func]) => {
            if (Object.hasOwn(__RICH_JSON_COMMANDS.built_in, name)) {
                throw (`RichJson you can not override built in commands. Affected command is '#${name}'`);
            }
            __RICH_JSON_COMMANDS.available[name] = func;
            __RICH_JSON_COMMANDS.enabled[name] = func;
        });
        this.lateApplies.forEach((name) => {
            if (!__RICH_JSON_LATE_APPLIES.includes(name)) {
                __RICH_JSON_LATE_APPLIES.push(name);
            }
        });
        Object.entries(this.kcmdIgnores).forEach(([name, ignored]) => {
            __RICH_JSON_COMMANDS.kcmd_ignored[name] = ignored;
        })
    }

    __exclude() {
        this.isIncluded = false;
        Object.entries(this.lateApplies).forEach(([name]) => {
            __RICH_JSON_LATE_APPLIES.splice(__RICH_JSON_LATE_APPLIES.indexOf(name), 1);
        });
        Object.entries(this.commands).forEach(([name]) => {
            delete __RICH_JSON_COMMANDS.available[name];
            delete __RICH_JSON_COMMANDS.enabled[name];
        });
    }
}

/**
 * Registers a RichJson module.
 * @param module
 * @returns {*}
 */
export function registerModule(module) {
    console.log(`RichJson registering module '${module.name}'`);
    __RICH_JSON_MODULES[module.name] = module;
    return module;
}

/**
 * Unregister a RichJson module.
 * @param name
 */
export function unregisterModule(name) {
    if (isModuleRegistered(name)) {
        if (__RICH_JSON_MODULES[name].isIncluded)
            throw (`RichJson can not unregister module '${name}' due to it is currently included`);
        console.log(`RichJson unregistering module '${name}'`);
        delete __RICH_JSON_MODULES[name];
    }
}

/**
 * Checks if a RichJson module is registered.
 * @param name
 * @returns {boolean}
 */
export function isModuleRegistered(name) {
    return Object.hasOwn(__RICH_JSON_MODULES, name);
}

/**
 * Includes a RichJson module.
 * @param name
 */
export function includeModule(name) {
    if (isModuleRegistered(name)) {
        if (!__RICH_JSON_MODULES[name].isIncluded) {
            console.log(`RichJson including module '${name}'`);
            __RICH_JSON_MODULES[name].__include();
        }
    }
}

/**
 * Excludes a RichJson module.
 * @param name
 */
export function excludeModule(name) {
    if (isModuleRegistered(name)) {
        if (__RICH_JSON_MODULES[name].isIncluded) {
            console.log(`RichJson excluding module '${name}'`);
            __RICH_JSON_MODULES[name].__exclude();
        }
    }
}