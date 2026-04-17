/*
    reads the given json file
*/


import {readFile} from "../helper/RichJsonFileHelper.js";

export function __executeFileCommand(parser, context) {
    return readFile(context.currentMember + ".json", true);
}