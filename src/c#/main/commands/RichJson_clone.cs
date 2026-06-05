using System;
using System.Linq;
using main.core;
using main.helper;
using main.other;

namespace main.commands
{
    public class RichJson_clone
    {
        public object Execute(RichJsonParser parser, RichJsonContext context)
        {
            if (parser.Cache.CloneAddress != null)
            {
                if (RichJsonConfig.CrashOnNestedCloneEnabled)
                {
                    // Invert Stack sequence to match Java's top-to-bottom join order
                    string pathStr = string.Join(RichJsonConstants.COMMAND_PATH_DELIMITER, context.CurrentPath.Reverse());
                    throw new Exception("RichJSON nested clone detected at '" + pathStr + "'.");
                }
                return context.CurrentMember;
            }

            parser.Cache.CloneAddress = context.CurrentAddress;
            context.CurrentMember = RichJsonHelper.CloneObject(context.CurrentMember);

            string debugPathStr = string.Join(RichJsonConstants.COMMAND_PATH_DELIMITER, context.CurrentPath.Reverse());
            parser.Logger.Debug("resolved clone at '" + debugPathStr + "'.");
            
            return context.CurrentMember;
        }
    }
}