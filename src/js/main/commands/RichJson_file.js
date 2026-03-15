/*
    reads the given json file
*/


import {concatStrings} from "../RichJsonHelper.js";
import {readRichJsonFile} from "../RichJsonFileHelper.js";

export function __executeFileCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    return readRichJsonFile(concatStrings(currentMember, ".json"));
}