/*
    reads the given json file
*/


import {concatStrings} from "../RichJsonHelper";
import {readRichJsonFile} from "../RichJsonFileHelper";

export function __executeFileCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    return readRichJsonFile(concatStrings(currentMember, ".json"));
}