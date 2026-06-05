using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;

namespace main.core
{
    public class RichJsonCache
    {
        public int Level { get; set; } = 0;
        public string CloneAddress { get; set; } = null;
        public Dictionary<string, string> Inheritances { get; set; } = new Dictionary<string, string>();
        public Dictionary<string, object> Stack { get; set; } = new Dictionary<string, object>();

        public string ResolveAddress(object obj)
        {
            if (obj == null)
            {
                return "null";
            }
            return RuntimeHelpers.GetHashCode(obj).ToString();
        }
    }
}