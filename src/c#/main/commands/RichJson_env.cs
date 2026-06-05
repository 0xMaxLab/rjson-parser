using System;
using System.Collections.Generic;
using System.Linq;
using main.core;
using main.other;

namespace main.commands
{
    public class RichJson_env
    {
        public object Execute(RichJsonParser parser, RichJsonContext context)
        {
            if (context.CurrentMember is IDictionary<string, object> memberMap)
            {
                RichJsonEnvironment.AddEnvironmentVariables(memberMap as Dictionary<string, object> ?? new Dictionary<string, object>(memberMap));
                return context.CurrentMember;
            }

            string memberStr = (string)context.CurrentMember;
            string[] @ref = memberStr.Split(new[] { RichJsonConstants.COMMAND_PATH_DELIMITER }, 2, StringSplitOptions.None);
            string firstRef = @ref[0];

            if (RichJsonEnvironment.Env.ContainsKey(firstRef))
            {
                object envVal = RichJsonEnvironment.Env[firstRef];
                context.CurrentMember = envVal;

                var prevRoot = context.Root;
                context.Root = (envVal is IDictionary<string, object>) ? envVal : new Dictionary<string, object>();
                context.CurrentAddress = parser.Cache.ResolveAddress(context.Root);

                context.CurrentMember = parser.ParseRichJsonInMember();
                RichJsonEnvironment.Env[firstRef] = context.CurrentMember;

                if (@ref.Length == 2)
                {
                    context.CurrentMember = @ref[1];
                    return RichJsonCommandHolder.ExecuteCommand("ref", parser, context);
                }
                context.Root = prevRoot;
                return context.CurrentMember;
            }
            else
            {
                throw new Exception("Environment variable or path '" + memberStr + "' does not exist.");
            }
        }
    }
}