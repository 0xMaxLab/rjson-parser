package commands;

import core.RichJsonContext;
import core.RichJsonParser;

@FunctionalInterface
public interface RichJsonCommand {
    Object execute(RichJsonParser parser, RichJsonContext context) throws Exception;
}
