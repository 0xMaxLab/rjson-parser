/**
 * Parses RichJSON expressions in JSON object.
 * @param obj
 * @returns {obj}
 */
export function parse(obj: object): any;

/**
 * Checks if the given object has unresolved RichJSON expressions in it.
 * @param obj
 * @returns {boolean}
 */
export function isResolved(obj: any): boolean;

/**
 * Adds the given class to the mapping table.
 * @param name
 * @param classType
 */
export function addClassMapping(name: string, classType: any): void;

/**
 * Adds the given class mappings.
 * @param mappings
 */
export function addClassMappings(mappings: object): void;


/**
 * Adds a constant to the environment.
 * @param name
 * @param value
 */
export function addEnvironmentVariable(name: string, value: any): void;

/**
 * Adds constants to the environment.
 * @param envs
 */
export function addEnvironmentVariables(envs: object): void;

/**
 * Updates the global configuration for the library.
 * * @param {Object} config - The configuration object.
 * @param {boolean} [config.debugEnabled=false] - When true, enables rich JSON logging for debugging purposes.
 * @param {boolean} [config.fileCacheEnabled=true] - Toggles the internal file system caching mechanism.
 * @param {boolean} [config.lateConstructorEnabled=true] - Enables delayed object construction to improve initial load performance.
 * @param {boolean} [config.crashOnNestedCloneEnabled=false] - If true, the library will throw an error when attempting to clone inside a clone structure.
 * * @example
 * updateConfiguration({
 *  debugEnabled: true,
 *  fileCacheEnabled: false
 * });
 */
export function updateConfiguration(config: object): void;

export class RichJsonModule {
    constructor(name: string);

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
    addLateApply(name: string, func: Function, ignores: string[] | undefined);

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
    addCommand(name:string, func: Function, ignores: string[] | undefined);
}

/**
 * Registers a RichJson module.
 * @param module
 * @returns {*}
 */
export function registerModule(module: RichJsonModule): void;

/**
 * Includes a RichJson module.
 * @param name
 */
export function includeModule(name: string): void;

/**
 * Checks if a RichJson module is registered.
 * @param name
 * @returns {boolean}
 */
export function isModuleRegistered(name: string): boolean;

/**
 * Excludes a RichJson module.
 * @param name
 */
export function excludeModule(name: string): void;

/**
 * Unregister a RichJson module.
 * @param name
 */
export function unregisterModule(name: string): void;

/**
 * Reads a JSON file and resolves RichJson if contained.
 * @param path
 * @param executeLateApplies = false
 * @returns {*|string}
 */
export function readFile(path: string, executeLateApplies: boolean): object;

/**
 * Reads a directory like a JSON file and resolves RichJson.
 * @param path
 * @param executeLateApplies = false
 * @returns {{}}
 */
export function readDirectory(path: string, executeLateApplies: boolean): object;

/**
 * Merges two or more objects together into a new object.
 * @param {object} sources Going to be merged
 * @returns {object} The merged object
 */
export function mergeObjects(...sources: object[]): object;

/**
 * Merges objects into target object.
 * @param {object} target
 * @param {object} others Going to be merged
 * @returns {object} The merged target
 */
export function mergeIntoTarget(target: object, ...others: object[]): object;

/**
 * Merges two or more objects together into a new object, without rebinding functions.
 * @param {object} objects Going to be merged
 * @returns {object} The merged object
 */
export function mergeObjectsWithoutRebind(...objects: object[]): object;

/**
 * Merges objects into target object, without rebinding functions.
 * @param {object} target
 * @param {object} others Going to be merged
 * @returns {object} The merged target
 */
export function mergeIntoWithoutRebind(target: object, ...others: object[]): object;


/**
 * Clones an object or array. Circular dependencies are correctly resolved and functions are rebound.
 * @param obj
 * @returns {T} The clone
 */
export function cloneObject<T>(obj: T): T;

/**
 * Checks if given object is a JSON object.
 * @param {object} obj
 * @returns {boolean}
 */
export function isJsonObject(obj: any): boolean;

/**
 * Gets keys sorted of given object.
 * @param {object} obj
 * @returns {String[]} The keys
 */
export function getKeysSorted(obj: any): string[];

/**
 * Make key commands constant for given JSON object.
 * @param {object} obj
 * @returns {{}}
 */
export function keepKeyCommands(obj: any): any;

/**
 * Toggles a RichJson command's enabled state.
 * @param {string} cmd - Name of the command to toggle.
 * @param {boolean} enabled - Whether to enable or disable the command.
 * @throws {Error} If the command is not in the available registry.
 */
export  function setCommandEnabled(cmd: string, enabled: boolean): void;