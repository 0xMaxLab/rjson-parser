package commands;

import core.RichJsonCommand;
import core.RichJsonConstants;
import other.RichJsonConfig;
import core.RichJsonContext;
import helper.RichJsonHelper;
import core.RichJsonParser;


public class RichJson_clone implements RichJsonCommand {
    @Override
    public Object execute(RichJsonParser parser, RichJsonContext context) {
        if (parser.cache.cloneAddress != null) {
            if (RichJsonConfig.crashOnNestedCloneEnabled) {
                throw new RuntimeException("RichJSON nested clone detected at '" + String.join(RichJsonConstants.COMMAND_PATH_DELIMITER, context.currentPath) + "'.");
            }
            return context.currentMember;
        }

        parser.cache.cloneAddress = context.currentAddress;
        context.currentMember = RichJsonHelper.cloneObject(context.currentMember);

        parser.logger.debug("resolved clone at '" + String.join(RichJsonConstants.COMMAND_PATH_DELIMITER, context.currentPath) + "'.");
        return context.currentMember;
    }
}
