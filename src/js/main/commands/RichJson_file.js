/*
    reads the given json file
*/


import {concatStrings} from "../RichJsonHelper.js";
import {readFile} from "../RichJsonFileHelper.js";

export function __executeFileCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    return readFile(concatStrings(currentMember, ".json"));
}