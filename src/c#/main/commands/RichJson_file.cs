using System;
using main.core;
using main.helper;

namespace main.commands
{
    public class RichJson_file
    {
        public object Execute(RichJsonParser parser, RichJsonContext context)
        {
            string fileName = context.CurrentMember + ".json";
            return RichJsonFileHelper.ReadFile(fileName, true);
        }
    }
}