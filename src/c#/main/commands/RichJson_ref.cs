using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using main.core;

namespace main.commands
{
    public class RichJson_ref
    {
        public object Execute(RichJsonParser parser, RichJsonContext context)
        {
            if (context.CurrentMember == null || string.IsNullOrEmpty(context.CurrentMember.ToString()))
            {
                return context.Root;
            }

            return ResolvePathFrom(context.Root, parser, context);
        }

        /// <summary>
        /// Core logic: Iterates over path segments and parses them successively.
        /// </summary>
        protected object ResolvePathFrom(object startNode, RichJsonParser parser, RichJsonContext context)
        {
            object prevMember = startNode;
            string originalAddress = context.CurrentAddress;

            string[] refs = context.CurrentMember.ToString().Split(new[] { RichJsonConstants.COMMAND_PATH_DELIMITER }, StringSplitOptions.None);

            foreach (string refSegment in refs)
            {
                if (prevMember is IDictionary<string, object> map)
                {
                    if (map.ContainsKey(refSegment))
                    {
                        context.CurrentMember = map[refSegment];
                    }
                    else
                    {
                        // Invert Stack sequence to match Java's top-to-bottom join order
                        string pathStr = string.Join(RichJsonConstants.COMMAND_PATH_DELIMITER, context.CurrentPath.Reverse());
                        throw new Exception("Member '" + refSegment + "' at '" + pathStr + "' does not exist");
                    }
                }
                else
                {
                    throw new Exception("Cannot resolve member '" + refSegment + "' because parent is not an object.");
                }

                context.CurrentAddress = (context.CurrentMember is IDictionary<string, object> || context.CurrentMember is IList)
                    ? parser.Cache.ResolveAddress(context.CurrentMember)
                    : parser.Cache.ResolveAddress(prevMember) + "_" + refSegment;

                context.CurrentMember = parser.ParseRichJsonInMember();
                context.CurrentPath.Push(refSegment);
                prevMember = context.CurrentMember;
            }

            context.CurrentAddress = originalAddress;
            
            // Replaces Java's subList().clear() for Stack structure
            for (int i = 0; i < refs.Length; i++)
            {
                if (context.CurrentPath.Count > 0)
                {
                    context.CurrentPath.Pop();
                }
            }

            return context.CurrentMember;
        }
    }
}