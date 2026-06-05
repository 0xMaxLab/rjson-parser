using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Newtonsoft.Json;
using main.core;
using main.other;

namespace main.helper
{
    public class RichJsonFileHelper
    {
        private static readonly Dictionary<string, object> FILE_CACHE = new Dictionary<string, object>();

        /// <summary>
        /// Reads a directory like a JSON file and resolves RichJson.
        /// </summary>
        public static Dictionary<string, object> ReadDirectory(string pathStr, bool executeLateApplies)
        {
            var rv = new Dictionary<string, object>();

            if (!Directory.Exists(pathStr)) return rv;

            string[] entries = Directory.GetFileSystemEntries(pathStr);

            if (!executeLateApplies)
            {
                RichJsonCommandHolder.LateApplies.ForEach(cmd => RichJsonCommandHolder.SetCommandEnabled(cmd, false));
            }

            foreach (string entry in entries)
            {
                string name = Path.GetFileName(entry);
                if (File.Exists(entry))
                {
                    string nameWithoutExtension = Path.GetFileNameWithoutExtension(entry);
                    rv[nameWithoutExtension] = ReadFile(entry, true);
                }
                else if (Directory.Exists(entry))
                {
                    rv[name] = ReadDirectory(entry, true);
                }
            }

            if (!executeLateApplies)
            {
                RichJsonCommandHolder.LateApplies.ForEach(cmd => RichJsonCommandHolder.SetCommandEnabled(cmd, true));
            }

            return rv;
        }

        /// <summary>
        /// Reads a JSON file and executes the RichJsonParser on it.
        /// </summary>
        public static object ReadFile(string pathStr, bool executeLateApplies)
        {
            // 1. Cache Check
            if (RichJsonConfig.FileCacheEnabled && FILE_CACHE.ContainsKey(pathStr))
            {
                return FILE_CACHE[pathStr];
            }

            if (RichJsonConfig.FileCacheEnabled)
            {
                FILE_CACHE[pathStr] = new Dictionary<string, object>();
            }

            // 2. Late Applies Management
            if (!executeLateApplies)
            {
                RichJsonCommandHolder.LateApplies.ForEach(cmd => RichJsonCommandHolder.SetCommandEnabled(cmd, false));
            }

            object rv;
            try
            {
                string content = File.ReadAllText(pathStr, Encoding.UTF8);

                // Using Newtonsoft.Json to perfectly unpack the types deep down
                rv = JsonConvert.DeserializeObject<object>(content);

                RichJsonParser parser = new RichJsonParser();
                rv = parser.Parse(rv, true);
            }
            catch (Exception e)
            {
                throw new Exception("Error reading RichJson file: " + pathStr, e);
            }

            // 3. Reactivation
            if (!executeLateApplies)
            {
                RichJsonCommandHolder.LateApplies.ForEach(cmd => RichJsonCommandHolder.SetCommandEnabled(cmd, true));
            }

            // 4. Cache Update
            if (RichJsonConfig.FileCacheEnabled)
            {
                object cached = FILE_CACHE[pathStr];
                if (cached is IDictionary<string, object> cachedMap && rv is IDictionary<string, object> rvMap)
                {
                    RichJsonHelper.MergeIntoTarget(cachedMap, rvMap);
                }
                else
                {
                    FILE_CACHE[pathStr] = rv;
                }
            }

            return rv;
        }
    }
}