using System;
using System.Collections.Generic;
using main.core;
using main.helper;

namespace main.commands
{
    public class RichJson_merge_folder
    {
        public object Execute(RichJsonParser parser, RichJsonContext context)
        {
            var folderContent = (IDictionary<string, object>)RichJsonCommandHolder.ExecuteCommand("folder", parser, context);
            List<string> sortedKeys = RichJsonHelper.GetKeysSorted(folderContent);
            var result = new Dictionary<string, object>();

            if (sortedKeys.Count > 0)
            {
                foreach (string key in sortedKeys)
                {
                    object content = folderContent[key];
                    if (content is IDictionary<string, object> contentMap)
                    {
                        RichJsonHelper.MergeIntoTarget(result, contentMap);
                    }
                }
            }

            return result;
        }
    }
}