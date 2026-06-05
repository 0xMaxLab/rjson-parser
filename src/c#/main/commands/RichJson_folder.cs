using System;
using main.core;
using main.helper;

namespace main.commands
{
    /// <summary>
    /// Reads the data tree of a given folder path.
    /// </summary>
    public class RichJson_folder
    {
        public object Execute(RichJsonParser parser, RichJsonContext context)
        {
            string folderPath = (string)context.CurrentMember;
            return RichJsonFileHelper.ReadDirectory(folderPath, true);
        }
    }
}