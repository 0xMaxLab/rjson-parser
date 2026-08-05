package io.github._0xmaxlab.commands;

import io.github._0xmaxlab.core.RichJsonContext;
import io.github._0xmaxlab.core.RichJsonParser;

public class RichJson_this extends RichJson_ref {

    @Override
    public Object execute(RichJsonParser parser, RichJsonContext context) throws Exception {
        if (context.currentMember == null || context.currentMember.toString().isEmpty() || context.currentMember.equals("this")) {
            return context.current;
        }

        return resolvePathFrom(context.current, parser, context);
    }
}