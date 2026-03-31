package commands;

import other.RichJsonConfig;
import core.RichJsonContext;
import helper.RichJsonHelper;
import core.RichJsonParser;


public class RichJson_clone implements RichJsonCommand {
    @Override
    public Object execute(RichJsonParser parser, RichJsonContext context) {
        if (parser.cache.cloneAddress != null) {
            if (RichJsonConfig.crashOnNestedCloneEnabled) {
                throw new RuntimeException("RichJson nested clone detected in '" + context.currentAddress + "'.");
            }
            return context.currentMember;
        }

        parser.cache.cloneAddress = context.currentAddress;
        // Benutzt den Helper für Deep Copy
        context.currentMember = RichJsonHelper.cloneObject(context.currentMember);

        if (RichJsonConfig.debugEnabled) {
            System.out.println("RichJson resolved clone in '" + parser.cache.cloneAddress + "'.");
        }
        return context.currentMember;
    }
}
