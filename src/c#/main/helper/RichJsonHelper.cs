using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using main.core;

namespace main.helper
{
    public class RichJsonHelper
    {
        private static readonly RichJsonLogger LOGGER = RichJsonLogger.Logger;

        private IDictionary<string, object> ParseJson(string json)
        {
            try
            {
                // Liest das JSON als generisches JObject ein
                var rawToken = JsonConvert.DeserializeObject<Newtonsoft.Json.Linq.JToken>(json);
        
                // Wandelt das gesamte Konstrukt tiefenrein in Dictionary und List um
                return RichJsonHelper.CleanJToken(rawToken) as IDictionary<string, object>;
            }
            catch (Exception e)
            {
                throw new Exception("Fehler beim Parsen der Test-JSON", e);
            }
        }

        /// <summary>
        /// Ensures that key commands within a JSON object are treated as constants by cloning them.
        /// This prevents modifications during the parsing process (like removing processed commands)
        /// from affecting the original data source.
        /// </summary>
        public static IDictionary<string, object> KeepKeyCommands(IDictionary<string, object> jsonObject)
        {
            if (jsonObject == null)
            {
                return null;
            }

            if (jsonObject.ContainsKey(RichJsonConstants.KEY_COMMAND_MEMBER))
            {
                object commands = jsonObject[RichJsonConstants.KEY_COMMAND_MEMBER];

                // Create a deep copy of the command list to isolate it.
                object clonedCommands = RichJsonHelper.CloneObject(commands);

                jsonObject[RichJsonConstants.KEY_COMMAND_MEMBER] = clonedCommands;
            }

            return jsonObject;
        }

        /// <summary>
        /// Checks if the given object still contains unresolved RichJson expressions.
        /// </summary>
        public static bool IsResolved(object @object)
        {
            RichJsonParser parser = new RichJsonParser();
            return IsResolvedRecursive(parser, @object, parser.Cache.ResolveAddress(@object));
        }

        private static bool IsResolvedRecursive(RichJsonParser parser, object @object, string address)
        {
            if (@object == null)
            {
                return true;
            }

            if (parser.Cache.Stack.ContainsKey(address))
            {
                return true;
            }
            parser.Cache.Stack[address] = @object;

            bool isJsonObj = @object is IDictionary<string, object>;

            if (isJsonObj)
            {
                var map = (IDictionary<string, object>)@object;
                if (map.ContainsKey(RichJsonConstants.KEY_COMMAND_MEMBER) ||
                    map.ContainsKey(RichJsonConstants.LATE_CONSTRUCTOR_MEMBER))
                {
                    return false;
                }
            }

            if (isJsonObj)
            {
                var map = (IDictionary<string, object>)@object;
                foreach (var entry in map)
                {
                    if (!CheckMember(parser, entry.Value, entry.Key, address))
                    {
                        return false;
                    }
                }
            }
            else if (@object is IList list)
            {
                for (int i = 0; i < list.Count; i++)
                {
                    if (!CheckMember(parser, list[i], i.ToString(), address))
                    {
                        return false;
                    }
                }
            }

            return true;
        }

        /// <summary>
        /// Helper method to validate a single member.
        /// </summary>
        private static bool CheckMember(RichJsonParser parser, object member, string keyOrIndex, string parentAddress)
        {
            if (!parser.IsMemberRichJsonAble(member))
            {
                return true;
            }

            if (member is string str)
            {
                if (RichJsonConstants.COMMAND_WILDCARD.IsMatch(str) ||
                    RichJsonConstants.INTERPOLATION_WILDCARD.IsMatch(str))
                {
                    return false;
                }
            }
            else
            {
                string memberAddress = parser.Cache.ResolveAddress(member);
                if (!IsResolvedRecursive(parser, member, memberAddress))
                {
                    return false;
                }
            }
            return true;
        }

        /// <summary>
        /// Creates a new object by merging multiple sources.
        /// Uses Dictionaries internally for processing.
        /// </summary>
        public static object MergeObjects(params object[] objects)
        {
            return MergeIntoTarget(new Dictionary<string, object>(), objects);
        }

        /// <summary>
        /// Merges various objects (Dictionaries or POJOs) into a target.
        /// </summary>
        public static object MergeIntoTarget(object target, params object[] others)
        {
            var targetMap = (target is IDictionary<string, object> dict)
                    ? dict
                    : ConvertValueToDictionary(target);

            foreach (var other in others)
            {
                if (other == null) continue;

                var otherMap = (other is IDictionary<string, object> oDict)
                        ? oDict
                        : ConvertValueToDictionary(other);

                var cache = new RichJsonCache();
                MergeIntoTargetInternal(cache, targetMap, otherMap, false);

                if (cache.Level != 0)
                {
                    Console.Error.WriteLine("RichJson mergeIntoTarget failed!");
                }
            }

            return targetMap;
        }

        private static IDictionary<string, object> MergeIntoTargetInternal(RichJsonCache cache, IDictionary<string, object> target, IDictionary<string, object> other, bool force)
        {
            cache.Stack[cache.ResolveAddress(other)] = other;
            cache.Level++;

            var names = new List<string>(other.Keys);
            foreach (var name in names)
            {
                var member = other[name];

                if (member != null && IsJsonObject(member))
                {
                    target.TryGetValue(name, out var targetMember);

                    if (IsJsonObject(targetMember))
                    {
                        if (!cache.Stack.ContainsKey(cache.ResolveAddress(member)))
                        {
                            var subTargetMap = (targetMember is IDictionary<string, object> sDict)
                                    ? sDict
                                    : ConvertValueToDictionary(targetMember);

                            MergeIntoTargetInternal(cache, subTargetMap, (IDictionary<string, object>)member, force);
                            target[name] = subTargetMap;
                        }
                    }
                    else if (force || targetMember == null)
                    {
                        target[name] = member;
                    }
                }
                else if (force || !target.ContainsKey(name))
                {
                    target[name] = member;
                }
            }

            cache.Level--;
            return target;
        }

        /// <summary>
        /// Clones any arbitrary object or list.
        /// </summary>
        public static object CloneObject(object @object)
        {
            if (@object == null) return null;

            var cache = new RichJsonCache();
            object rootClone;

            if (@object is IList)
            {
                rootClone = new List<object>();
            }
            else if (IsJsonObject(@object))
            {
                rootClone = new Dictionary<string, object>();
            }
            else
            {
                return @object;
            }

            cache.Stack[cache.ResolveAddress(@object)] = rootClone;
            var result = CloneObjectInternal(cache, @object, rootClone);

            if (cache.Level != 0)
            {
                Console.Error.WriteLine("RichJson cloneObject failed!");
            }
            return result;
        }

        private static object CloneObjectInternal(RichJsonCache cache, object @object, object target)
        {
            cache.Level++;

            if (@object is IDictionary<string, object> || (IsJsonObject(@object) && !(@object is IList)))
            {
                var sourceMap = (@object is IDictionary<string, object> dict)
                        ? dict
                        : ConvertValueToDictionary(@object);
                var targetMap = (IDictionary<string, object>)target;

                foreach (var entry in sourceMap)
                {
                    var name = entry.Key;
                    var member = entry.Value;
                    ProcessCloneMember(cache, targetMap, name, member);
                }
            }
            else if (@object is IList sourceList)
            {
                var targetList = (IList<object>)target;

                foreach (var member in sourceList)
                {
                    if (IsJsonObject(member) || member is IList)
                    {
                        var addr = cache.ResolveAddress(member);
                        if (!cache.Stack.ContainsKey(addr))
                        {
                            var newObj = (member is IList) ? (object)new List<object>() : new Dictionary<string, object>();
                            cache.Stack[addr] = newObj;
                            targetList.Add(CloneObjectInternal(cache, member, newObj));
                        }
                        else
                        {
                            targetList.Add(cache.Stack[addr]);
                        }
                    }
                    else
                    {
                        targetList.Add(member);
                    }
                }
            }

            cache.Level--;
            return target;
        }

        private static void ProcessCloneMember(RichJsonCache cache, IDictionary<string, object> targetMap, string name, object member)
        {
            if (IsJsonObject(member) || member is IList)
            {
                var addr = cache.ResolveAddress(member);
                if (!cache.Stack.ContainsKey(addr))
                {
                    var newObj = (member is IList) ? (object)new List<object>() : new Dictionary<string, object>();
                    cache.Stack[addr] = newObj;
                    targetMap[name] = CloneObjectInternal(cache, member, newObj);
                }
                else
                {
                    targetMap[name] = cache.Stack[addr];
                }
            }
            else
            {
                targetMap[name] = member;
            }
        }

        public static bool IsJsonObject(object @object)
        {
            if (@object == null) return false;
            if (@object is IDictionary<string, object>) return true;
            if (@object is IList || @object is string || @object is ValueType || @object is bool)
                return false;

            return true;
        }

        /// <summary>
        /// Retrieves a field of an object by its key string.
        /// Supports dictionaries, lists (if key is an integer) and POJOs.
        /// </summary>
        public static object GetFieldByKey(object @object, string key)
        {
            if (@object == null || key == null)
            {
                return null;
            }

            if (@object is IDictionary<string, object> map)
            {
                map.TryGetValue(key, out var val);
                return val;
            }

            if (@object is IList list)
            {
                if (int.TryParse(key, out int index))
                {
                    if (index >= 0 && index < list.Count)
                    {
                        return list[index];
                    }
                }
                return null;
            }

            if (IsJsonObject(@object))
            {
                try
                {
                    var mapConverted = ConvertValueToDictionary(@object);
                    mapConverted.TryGetValue(key, out var val);
                    return val;
                }
                catch (Exception)
                {
                    return null;
                }
            }

            return null;
        }

        public static List<string> GetKeysSorted(object @object)
        {
            if (@object is IDictionary<string, object> map)
            {
                var keys = new List<string>(map.Keys);
                keys.Sort(StringComparer.OrdinalIgnoreCase);
                return keys;
            }
            return new List<string>();
        }

        // Deep-conversion via Newtonsoft to avoid any JObject/JArray primitives leaks
        public static IDictionary<string, object> ConvertValueToDictionary(object obj)
        {
            // Wenn es bereits ein Newtonsoft JToken ist, direkt konvertieren, sonst via FromObject verpacken
            var token = obj is Newtonsoft.Json.Linq.JToken jToken ? jToken : Newtonsoft.Json.Linq.JToken.FromObject(obj);
            return CleanJToken(token) as IDictionary<string, object>;
        }

        // Rekursive Hilfsmethode, die JObject zu Dictionary und JArray zu List konvertiert
        public static object CleanJToken(object obj)
        {
            if (obj is Newtonsoft.Json.Linq.JObject jObj)
            {
                var dict = new Dictionary<string, object>();
                foreach (var prop in jObj)
                {
                    dict[prop.Key] = CleanJToken(prop.Value);
                }
                return dict;
            }
            if (obj is Newtonsoft.Json.Linq.JArray jArr)
            {
                var list = new List<object>();
                foreach (var item in jArr)
                {
                    list.Add(CleanJToken(item));
                }
                return list;
            }
            if (obj is Newtonsoft.Json.Linq.JValue jVal)
            {
                return jVal.Value;
            }
            return obj;
        }
    }
}