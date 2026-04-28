import {__RICH_JSON_CONFIG} from "./RichJsonConfiguration.js";

export const __RICH_JSON_CLASS_MAPPING = {}

/**
 * Adds the given class mappings.
 * @param classMappings
 */
export function addClassMappings(classMappings) {
    let names = Object.keys(classMappings);
    let name = undefined;
    for (let i = 0; i < names.length; ++i) {
        name = names[i];
        addClassMapping(name, classMappings[name])
    }
}

/**
 * Adds the given class to the mapping table.
 * @param name
 * @param classType
 */
export function addClassMapping(name, classType) {
    if (Object.hasOwn(__RICH_JSON_CLASS_MAPPING, name)) {
        if (__RICH_JSON_CONFIG.infoEnabled) {
            console.warn(`RichJSON has the class '${name}' already defined`);
        }
    } else {
        __RICH_JSON_CLASS_MAPPING[name] = classType;
    }
}

export function __mapClassByName(name) {
    if (!Object.hasOwn(__RICH_JSON_CLASS_MAPPING, name)) {
        throw (`RichJSON could not find the class called '${name}'.\nMake sure its defined in RichJsonClassMapping.`);
    }
    return __RICH_JSON_CLASS_MAPPING[name];
}