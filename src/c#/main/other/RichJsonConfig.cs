using System;

namespace main.other
{
    public static class RichJsonConfig
    {
        public static bool InfoEnabled { get; set; } = true;
        public static bool DebugEnabled { get; set; } = false;
        public static bool LateConstructorEnabled { get; set; } = true;
        public static bool StringInterpolationsEnabled { get; set; } = true;
        public static bool CrashOnNestedCloneEnabled { get; set; } = true;
        public static bool FileCacheEnabled { get; set; } = true;
    }
}