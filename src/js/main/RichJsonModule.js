/*
    A module is a command defintion that is stored in RichJson's module space.
	In order to includeRichJsonModule a module you have to do the following steps:
		1. registerRichJsonModule your module like this: registerRichJsonModule(new RichJsonModule("name"));
		2. includeRichJsonModule your module like this: includeRichJsonModule("name");

	Raptor offers generic modules, which are available always, if your RichJson_Configuration
	macro RICH_JSON_INCLUDED_MODULES contains it.
*/

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

    addLateApply(name, func, ignores = undefined) {
        this.lateApplies.push(name);
        if (Array.isArray(ignores)) {
            this.kcmdIgnores[name] = ignores;
        }
        return this.addCommand(name, func);
    }

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
export function registerRichJsonModule(module) {
    console.log(`RichJson registering module '${module.name}'`);
    __RICH_JSON_MODULES[module.name] = module;
    return module;
}

/**
 * Unregister a RichJson module.
 * @param _name
 */
export function unregisterRichJsonModule(_name) {
    if (isRichJsonModuleRegistered(_name)) {
        if (__RICH_JSON_MODULES[_name].isIncluded)
            throw (`RichJson can not unregister module '${_name}' due to it is currently included`);
        console.log(`RichJson unregistering module '${_name}'`);
        delete __RICH_JSON_MODULES[_name];
    }
}

/**
 * Checks if a RichJson module is registered.
 * @param _name
 * @returns {boolean}
 */
export function isRichJsonModuleRegistered(_name) {
    return Object.hasOwn(__RICH_JSON_MODULES, _name);
}

/**
 * Includes a RichJson module.
 * @param _name
 */
export function includeRichJsonModule(_name) {
    if (isRichJsonModuleRegistered(_name)) {
        if (!__RICH_JSON_MODULES[_name].isIncluded) {
            console.log(`RichJson including module '${_name}'`);
            __RICH_JSON_MODULES[_name].__include();
        }
    }
}

/**
 * Excludes a RichJson module.
 * @param _name
 */
export function excludeRichJsonModule(_name) {
    if (isRichJsonModuleRegistered(_name)) {
        if (__RICH_JSON_MODULES[_name].isIncluded) {
            console.log(`RichJson excluding module '${_name}'`);
            __RICH_JSON_MODULES[_name].__exclude();
        }
    }
}