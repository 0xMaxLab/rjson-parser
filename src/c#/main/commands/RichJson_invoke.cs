using System;
using main.core;

namespace main.commands
{
    public class RichJson_invoke
    {
        public object Execute(RichJsonParser parser, RichJsonContext context)
        {
            if (context.CurrentMember is Func<object> supplier)
            {
                return supplier();
            }
            throw new Exception($"RichJson the given function in '{context.CurrentName}' is not a supplier");
        }
    }
}