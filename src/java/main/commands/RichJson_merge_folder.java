package commands;

import core.RichJsonCommandHolder;
import core.RichJsonContext;
import helper.RichJsonHelper;
import core.RichJsonParser;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RichJson_merge_folder implements RichJsonCommand {
    @Override
    @SuppressWarnings("unchecked")
    public Object execute(RichJsonParser parser, RichJsonContext context) throws Exception {
        // Nutzt das Folder-Kommando intern
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