package io.github._0xmaxlab.commands;

import io.github._0xmaxlab.core.RichJsonCommand;
import io.github._0xmaxlab.core.RichJsonContext;
import io.github._0xmaxlab.core.RichJsonParser;

import java.util.function.Supplier;

public class RichJson_invoke implements RichJsonCommand {
    @Override
    public Object execute(RichJsonParser parser, RichJsonContext context) throws Exception {
        if (context.currentMember instanceof Supplier) {
            return ((Supplier<?>) context.currentMember).get();
        }
        throw new Exception(String.format("RichJson the given function in '%s' is not a supplier", context.currentName));
    }
}