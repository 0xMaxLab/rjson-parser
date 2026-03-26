export const __RICH_JSON_CLASS_MAPPING = {}

/**
 * Adds the given class mappings.
 * @param classMappings
 */
export function addClassMappings(classMappings) {
    r
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
        throw (`RichJson has the class '${name}' already defined`);
    }
    __RICH_JSON_CLASS_MAPPING[name] = classType;
}

export function __mapClassByName(name) {
    if (!Object.hasOwn(__RICH_JSON_CLASS_MAPPING, name)) {
        throw (`RichJson could not find the class called '${name}'.\nMake sure its defined in RichJsonClassMapping.`);
    }
    return __RICH_JSON_CLASS_MAPPING[name];
}