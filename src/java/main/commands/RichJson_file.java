package commands;

import core.RichJsonContext;
import core.RichJsonFileHelper;
import core.RichJsonHelper;
import core.RichJsonParser;

public class RichJson_file implements RichJsonCommand {
    @Override
    public Object execute(RichJsonParser parser, RichJsonContext context) {
        String fileName = RichJsonHelper.concatStrings((String) context.currentMember, ".json");
        return RichJsonFileHelper.readFile(fileName, true);
    }
}