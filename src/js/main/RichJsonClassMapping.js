import {RichJsonTestClass} from "../test/RichJsonTestClass";

export const CLASS_MAPPING = {
    RichJsonTestClass: RichJsonTestClass
}

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
    if (Object.hasOwn(CLASS_MAPPING, name))
        throw (`RichJson has the class '${name}' already defined`);
    CLASS_MAPPING[name] = classType;
}

export function __mapClassByName(name) {
    if (!Object.hasOwn(CLASS_MAPPING, name)) {
        throw (`RichJson could not find the class called '${name}'.\nMake sure its defined in RichJsonClassMapping.`);
    }
    return CLASS_MAPPING[name];
}