package commands;

import core.RichJsonCommand;
import core.RichJsonCommandHolder;
import core.RichJsonContext;
import helper.RichJsonHelper;
import core.RichJsonParser;

public class RichJson_copy implements RichJsonCommand {
    @Override
    public Object execute(RichJsonParser parser, RichJsonContext context) throws Exception {
        Object referencedValue = RichJsonCommandHolder.executeCommand("ref", parser, context);
        return RichJsonHelper.cloneObject(referencedValue);
    }
}