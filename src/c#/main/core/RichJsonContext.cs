using System;
using System.Collections.Generic;

namespace main.core
{
    public class RichJsonContext
    {
        public object Root { get; set; }
        public object Current { get; set; }
        public object CurrentMember { get; set; }
        public string CurrentCommand { get; set; }
        public string CurrentAddress { get; set; }
        public string CurrentName { get; set; }
        public Stack<string> CurrentPath { get; set; } = new Stack<string>();
    }
}