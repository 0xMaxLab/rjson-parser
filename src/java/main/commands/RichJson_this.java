package commands;

import core.RichJsonContext;
import core.RichJsonParser;

public class RichJson_this extends RichJson_ref {

    @Override
    public Object execute(RichJsonParser parser, RichJsonContext context) throws Exception {
        if (context.currentMember == null || context.currentMember.toString().isEmpty() || context.currentMember.equals("this")) {
            return context.current;
        }

        return resolvePathFrom(context.current, parser, context);
    }
}