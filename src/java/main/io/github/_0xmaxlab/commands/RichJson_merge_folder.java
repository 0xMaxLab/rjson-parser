package io.github._0xmaxlab.commands;

import io.github._0xmaxlab.core.RichJsonCommand;
import io.github._0xmaxlab.core.RichJsonCommandHolder;
import io.github._0xmaxlab.core.RichJsonContext;
import io.github._0xmaxlab.helper.RichJsonHelper;
import io.github._0xmaxlab.core.RichJsonParser;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RichJson_merge_folder implements RichJsonCommand {
    @Override
    @SuppressWarnings("unchecked")
    public Object execute(RichJsonParser parser, RichJsonContext context) throws Exception {
        Map<String, Object> folderContent = (Map<String, Object>) RichJsonCommandHolder.executeCommand("folder", parser, context);
        List<String> sortedKeys = RichJsonHelper.getKeysSorted(folderContent);
        Map<String, Object> result = new HashMap<>();

        if (!sortedKeys.isEmpty()) {
            for (String key : sortedKeys) {
                Object content = folderContent.get(key);
                if (content instanceof Map) {
                    RichJsonHelper.mergeIntoTarget(result, (Map<String, Object>) content);
                }
            }
        }

        return result;
    }
}