using System;
using main.core;

namespace main.commands
{
    public class RichJson_this : RichJson_ref
    {
        public new object Execute(RichJsonParser parser, RichJsonContext context)
        {
            if (context.CurrentMember == null || string.IsNullOrEmpty(context.CurrentMember.ToString()) || context.CurrentMember.Equals("this"))
            {
                return context.Current;
            }

            return ResolvePathFrom(context.Current, parser, context);
        }
    }
}