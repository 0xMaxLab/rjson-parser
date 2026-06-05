using System;
using System.Collections.Generic;
using main.core;
using main.helper;

namespace main.commands
{
    public class RichJson_merge
    {
        public object Execute(RichJsonParser parser, RichJsonContext context)
        {
            string[] refs = ((string)context.CurrentMember).Split(new[] { RichJsonConstants.COMMAND_DELIMITER }, StringSplitOptions.None);
            object structOrArray = parser.Cache.Stack[context.CurrentAddress];
            string originalAddress = context.CurrentAddress;

            context.CurrentMember = refs[0].Trim();
            context.CurrentMember = RichJsonCommandHolder.ExecuteCommand("ref", parser, context);
            context.CurrentAddress = originalAddress;

            if (context.CurrentMember is IDictionary<string, object>)
            {
                var targetMap = (IDictionary<string, object>)structOrArray;
                RichJsonHelper.MergeIntoTarget(targetMap, (IDictionary<string, object>)context.CurrentMember);

                for (int i = 1; i < refs.Length; i++)
                {
                    context.CurrentMember = refs[i].Trim();
                    object nextRef = RichJsonCommandHolder.ExecuteCommand("ref", parser, context);
                    context.CurrentAddress = originalAddress;
                    RichJsonHelper.MergeIntoTarget(targetMap, (IDictionary<string, object>)nextRef);
                }
                return targetMap;
            }
            else
            {
                var targetList = new List<object>();
                parser.Cache.Stack[originalAddress] = targetList;

                for (int i = 0; i < refs.Length; i++)
                {
                    context.CurrentMember = refs[i].Trim();
                    var nextRef = (System.Collections.IList)RichJsonCommandHolder.ExecuteCommand("ref", parser, context);
                    context.CurrentAddress = originalAddress;

                    foreach (var item in nextRef)
                    {
                        targetList.Add(item);
                    }
                }
                return targetList;
            }
        }
    }
}