import {mergeIntoTarget} from "../helper/RichJsonHelper.js";

export let __RICH_JSON_CONFIG = {
    infoEnabled: true,
    debugEnabled: false,
    stringInterpolationsEnabled: true,
    fileCacheEnabled: true,
    lateConstructorEnabled: true,
    crashOnNestedCloneEnabled: true,
}

/**
 * Updates the global configuration for the library.
 * * @param {Object} config - The configuration object.
 * @param {boolean} [config.infoEnabled=true] - When true, enables rich JSON logging.
 * @param {boolean} [config.debugEnabled=false] - When true, enables rich JSON logging for debugging purposes.
 * @param {boolean} [config.stringInterpolationsEnabled=true] - Toggles whether string interpolations are resolved.
 * @param {boolean} [config.fileCacheEnabled=true] - Toggles the internal file system caching mechanism.
 * @param {boolean} [config.lateConstructorEnabled=true] - Enables delayed object construction to improve initial load performance.
 * @param {boolean} [config.crashOnNestedCloneEnabled=false] - If true, the library will throw an error when attempting to clone inside a clone structure.
 * * @example
 * updateConfiguration({
 *  debugEnabled: true,
 *  fileCacheEnabled: false
 * });
 */
export function updateConfiguration(config) {
    if (!config || typeof config !== 'object') {
        return;
    }

    __RICH_JSON_CONFIG = mergeIntoTarget(config, {
        infoEnabled: true,
        debugEnabled: false,
        stringInterpolationsEnabled: true,
        fileCacheEnabled: true,
        lateConstructorEnabled: true,
        crashOnNestedCloneEnabled: true,
    });
}
