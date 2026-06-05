using System;
using System.Diagnostics;
using main.other;

namespace main.helper
{
    /// <summary>
    /// SLF4J implementation replacement of the RichJsonLogger using NLog/Serilog wrapper or standard Console/Diagnostics.
    /// Uses Stopwatch for precise performance tracking.
    /// </summary>
    public class RichJsonLogger
    {
        // Replace with your preferred .NET logging framework (e.g., ILogger, Serilog, NLog) if needed
        public static readonly RichJsonLogger Logger = new RichJsonLogger("RichJsonGlobal:");

        private readonly string _label;
        private static string _padding = "";
        private int _groupLevel = 0;
        private Stopwatch _stopwatch = new Stopwatch();

        public RichJsonLogger(string label)
        {
            this._label = label;
        }

        public void Info(string message)
        {
            if (RichJsonConfig.InfoEnabled)
            {
                Console.WriteLine($"{_padding}{_label} {message}");
            }
        }

        public void Debug(string message)
        {
            if (RichJsonConfig.DebugEnabled)
            {
                Console.WriteLine($"{_padding}{_label} {message}");
            }
        }

        public void Error(string message)
        {
            Console.Error.WriteLine($"{_padding}{_label} {message}");
        }

        /// <summary>
        /// Increases indentation for nested log groups.
        /// </summary>
        public void GroupStart()
        {
            if (RichJsonConfig.InfoEnabled || RichJsonConfig.DebugEnabled)
            {
                _groupLevel++;
                _padding += "  ";
            }
        }

        /// <summary>
        /// Decreases indentation for nested log groups.
        /// </summary>
        public void GroupEnd()
        {
            if ((RichJsonConfig.InfoEnabled || RichJsonConfig.DebugEnabled) && _padding.Length >= 2)
            {
                _groupLevel--;
                _padding = _padding.Substring(0, _padding.Length - 2);
            }
        }

        /// <summary>
        /// Resets indentation to zero.
        /// </summary>
        public void GroupEndAll()
        {
            for (int i = 0; i < _groupLevel; i++)
            {
                _padding = _padding.Substring(0, _padding.Length - 2);
            }
            _groupLevel = 0;
        }

        /// <summary>
        /// Captures the starting timestamp.
        /// </summary>
        public void TimeStart()
        {
            if (RichJsonConfig.DebugEnabled)
            {
                _stopwatch.Restart();
            }
        }

        /// <summary>
        /// Captures the end timestamp and logs the duration.
        /// </summary>
        public void TimeEnd()
        {
            if (RichJsonConfig.DebugEnabled)
            {
                _stopwatch.Stop();
                // Converts ticks to nanoseconds (1 tick = 100 ns)
                long nanoseconds = _stopwatch.ElapsedTicks * 100;
                this.Debug(nanoseconds + " ns");
            }
        }
    }
}