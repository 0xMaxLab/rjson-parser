using System;
using main.core;
using main.helper;

namespace main.commands
{
    public class RichJson_copy
    {
        public object Execute(RichJsonParser parser, RichJsonContext context)
        {
            object referencedValue = RichJsonCommandHolder.ExecuteCommand("ref", parser, context);
            return RichJsonHelper.CloneObject(referencedValue);
        }
    }
}