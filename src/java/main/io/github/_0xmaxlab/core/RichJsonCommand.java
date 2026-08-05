package io.github._0xmaxlab.core;

@FunctionalInterface
public interface RichJsonCommand {
    Object execute(RichJsonParser parser, RichJsonContext context) throws Exception;
}
