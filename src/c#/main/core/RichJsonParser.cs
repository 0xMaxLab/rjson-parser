using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Newtonsoft.Json;
using main.helper;
using main.other;

namespace main.core
{
    public class RichJsonParser
    {
        private static int NEXT_ID = 0;
        private readonly int _id;
        private readonly string _label;
        public RichJsonLogger Logger { get; }

        public RichJsonCache Cache { get; set; } = new RichJsonCache();
        private RichJsonContext _con = new RichJsonContext();

        public RichJsonParser()
        {
            NEXT_ID++;
            this._id = NEXT_ID;
            this._label = "RichJSON (PID " + this._id + "):";
            this.Logger = new RichJsonLogger(this._label);
        }

        public object Parse(object current, bool isRoot)
        {
            if (isRoot)
            {
                this.Logger.Info("is going to be applied...");
                this.Logger.GroupStart();
                this.Logger.TimeStart();

                this._con.Root = current;
                this._con.Current = current;
                this._con.CurrentName = "root";
                this._con.CurrentMember = current;
                this._con.CurrentAddress = this.Cache.ResolveAddress(current);

                object result = this.ParseRichJsonInMember();

                this.Cache.Level--;
                this.Logger.GroupEndAll();

                if (this.Cache.Level == -1)
                {
                    this.Logger.Info("was applied successfully.");
                }
                else
                {
                    this.Logger.Error("was not applied successfully.");
                }
                this.Logger.TimeEnd();
                return result;
            }

            this._con.Current = current;
            string pathStr = string.Join(RichJsonConstants.COMMAND_PATH_DELIMITER, this._con.CurrentPath.Reverse());
            this.Logger.Debug("step into level " + this.Cache.Level + " at '" + pathStr + "'");
            this.Logger.GroupStart();
            this.Cache.Level++;

            var isJsonObj = current is IDictionary<string, object>;
            var currentName = this._con.CurrentName;
            var currentAddress = this._con.CurrentAddress;

            if (isJsonObj)
            {
                this.PreprocessKcommandsConstructorsInheritances();
                var map = (IDictionary<string, object>)current;
                var sortedKeys = RichJsonHelper.GetKeysSorted(map);

                foreach (var name in sortedKeys)
                {
                    var member = map[name];
                    this._con.CurrentMember = member;

                    bool isContainer = member is IDictionary<string, object> || member is System.Collections.IList;
                    this._con.CurrentAddress = isContainer
                        ? this.Cache.ResolveAddress(member)
                        : currentAddress + "_" + name;

                    this._con.CurrentName = name;
                    this._con.CurrentMember = this.ParseRichJsonInMember();
                    map[name] = this._con.CurrentMember;
                }
            }
            else if (current is System.Collections.IList list)
            {
                for (var i = 0; i < list.Count; i++)
                {
                    var member = list[i];
                    this._con.CurrentMember = member;

                    bool isContainer = member is IDictionary<string, object> || member is System.Collections.IList;
                    this._con.CurrentAddress = isContainer
                        ? this.Cache.ResolveAddress(member)
                        : currentAddress + "_" + i;

                    this._con.CurrentName = currentName + "[" + i + "]";
                    this._con.CurrentMember = this.ParseRichJsonInMember();
                    list[i] = this._con.CurrentMember;
                }
            }

            this.Cache.Level--;
            this.Logger.GroupEnd();
            this.Logger.Debug("step out of level " + this.Cache.Level + " at '" + pathStr + "'");
            return current;
        }

        private void PreprocessKcommandsConstructorsInheritances()
        {
            var currentMap = (IDictionary<string, object>)this._con.Current;
            var names = new List<string>(currentMap.Keys);

            foreach (var name in names)
            {
                var iscmd = RichJsonConstants.IsCommand(name);
                var isctr = RichJsonConstants.IsConstructor(name);
                var isite = RichJsonConstants.IsInheritance(name);

                if (iscmd || isctr || isite)
                {
                    var member = currentMap[name];
                    currentMap.Remove(name);
                    var processedName = name;

                    if (iscmd)
                    {
                        var parts = processedName.Split(new[] { RichJsonConstants.COMMAND_SUFFIX }, 2, StringSplitOptions.None);
                        var kcmdList = new List<string>(parts[0].Substring(1).Split(new[] { RichJsonConstants.COMMAND_PREFIX }, StringSplitOptions.None));
                        if (member is IDictionary<string, object> memberMap)
                        {
                            memberMap[RichJsonConstants.KEY_COMMAND_MEMBER] = kcmdList;
                        }
                        processedName = parts[1];
                    }

                    string ite = null;
                    if (isite)
                    {
                        var parts = processedName.Split(new[] { RichJsonConstants.INHERITANCE_SIGN }, 2, StringSplitOptions.None);
                        ite = parts[1].Trim();
                        processedName = parts[0];
                    }

                    if (isctr)
                    {
                        if (RichJsonConstants.IsLateConstructor(processedName))
                        {
                            var parts = processedName.Split(new[] { RichJsonConstants.LATE_CONSTRUCTOR_SIGN }, 2, StringSplitOptions.None);
                            var clazz = RichJsonClassMapping.MapClassByName(parts[1].Trim());
                            if (member is IDictionary<string, object> memberMap)
                            {
                                memberMap[RichJsonConstants.LATE_CONSTRUCTOR_MEMBER] = clazz;
                            }
                            processedName = parts[0];
                        }
                        else
                        {
                            var parts = processedName.Split(new[] { RichJsonConstants.CONSTRUCTOR_SIGN }, 2, StringSplitOptions.None);
                            var ctrClass = RichJsonClassMapping.MapClassByName(parts[1].Trim());
                            try
                            {
                                var instance = Activator.CreateInstance(ctrClass);
                                var instanceMap = RichJsonHelper.ConvertValueToDictionary(instance);
                                
                                member = RichJsonHelper.MergeIntoTarget(new RichJsonCache(), instanceMap, (IDictionary<string, object>)member, true);
                            }
                            catch (Exception e)
                            {
                                Console.WriteLine(e.ToString());
                            }
                            processedName = parts[0];
                        }
                    }

                    if (isite && member is IDictionary<string, object>)
                    {
                        this.Cache.Inheritances[this.Cache.ResolveAddress(member)] = ite;
                    }

                    currentMap[processedName.Trim()] = member;
                    if (!(member is IDictionary<string, object>))
                    {
                        throw new Exception("Inheritance on member '" + processedName + "' is not possible because it is not an object.");
                    }
                }
            }
        }

        public object ParseRichJsonInMember()
        {
            this._con.CurrentPath.Push(this._con.CurrentName);
            string pathStr = string.Join(RichJsonConstants.COMMAND_PATH_DELIMITER, this._con.CurrentPath.Reverse());

            if (this.Cache.Stack.ContainsKey(this._con.CurrentAddress))
            {
                this.Logger.Debug("cache hit at '" + pathStr + "' with address '" + this._con.CurrentAddress + "'");
                this._con.CurrentPath.Pop();
                return this.Cache.Stack[this._con.CurrentAddress];
            }
            else
            {
                this.Logger.Debug("cache add at '" + pathStr + "' with address '" + this._con.CurrentAddress + "'");
                this.Cache.Stack[this._con.CurrentAddress] = this._con.CurrentMember;
            }

            if (!this.IsMemberRichJsonAble(this._con.CurrentMember))
            {
                this._con.CurrentPath.Pop();
                return this._con.CurrentMember;
            }

            if (this._con.CurrentMember is string strMember)
            {
                if (RichJsonConfig.StringInterpolationsEnabled && RichJsonConstants.INTERPOLATION_WILDCARD.IsMatch(strMember))
                {
                    var res = this.ParseInterpolations();
                    this._con.CurrentMember = res.Result;
                    if (!res.IsParsed)
                    {
                        this._con.CurrentPath.Pop();
                        return this._con.CurrentMember;
                    }
                }
                object result = this.ExecuteRichJsonCommandIfContainedInMember();
                this._con.CurrentPath.Pop();
                return result;
            }
            else
            {
                var currentAddress = this._con.CurrentAddress;
                var isJsonObj = this._con.CurrentMember is IDictionary<string, object>;
                List<string> kcmd_ignored = new List<string>();

                if (isJsonObj)
                {
                    this.ExecuteClone();
                    this.CallConstructor();
                    this.Cache.Stack[currentAddress] = this._con.CurrentMember;
                    kcmd_ignored = this.GetIgnoresForKeyCommands();
                    foreach (var cmd in kcmd_ignored) RichJsonCommandHolder.SetCommandEnabled(cmd, false);
                    this.ResolveInheritances();
                }

                this._con.CurrentMember = this.Parse(this._con.CurrentMember, false);

                if (isJsonObj)
                {
                    this.ResetCloneIfPossible(currentAddress);
                    foreach (var cmd in kcmd_ignored) RichJsonCommandHolder.SetCommandEnabled(cmd, true);
                    this._con.CurrentMember = this.ExecuteKeyCommands();
                }

                this._con.CurrentPath.Pop();
                return this._con.CurrentMember;
            }
        }

        public bool IsMemberRichJsonAble(object member)
        {
            return member is string || member is System.Collections.IList || member is IDictionary<string, object>;
        }

        private InterpolationResult ParseInterpolations()
        {
            var rv = new StringBuilder();
            var inp = (string)this._con.CurrentMember;
            var ipnLevel = -1;
            var ipns = new List<InterpolationData>();

            for (var i = 0; i < inp.Length; ++i)
            {
                var c = inp[i];
                if (c == RichJsonConstants.INTERPOLATION_OPENING_SIGN)
                {
                    if (i + 1 < inp.Length)
                    {
                        var nextC = inp[i + 1];
                        if ((nextC == RichJsonConstants.INTERPOLATION_OPENING_SIGN || nextC == RichJsonConstants.INTERPOLATION_CLOSING_SIGN) &&
                                i + 2 < inp.Length && inp[i + 2] == RichJsonConstants.INTERPOLATION_CLOSING_SIGN)
                        {
                            rv.Append(nextC);
                            i += 2;
                            continue;
                        }
                    }
                    ipnLevel++;
                }
                else if (c == RichJsonConstants.INTERPOLATION_CLOSING_SIGN)
                {
                    if (ipnLevel >= 0)
                    {
                        var currentIpn = ipns[ipnLevel];
                        this._con.CurrentMember = currentIpn.Rv.ToString();
                        currentIpn.Rv.Clear();
                        ipnLevel--;

                        if (ipns.Count == ipnLevel + 3 && !ipns[ipnLevel + 2].IsParsed)
                        {
                            this._con.CurrentMember = RichJsonConstants.INTERPOLATION_OPENING_SIGN.ToString() + this._con.CurrentMember + RichJsonConstants.INTERPOLATION_CLOSING_SIGN;
                        }
                        else
                        {
                            this._con.CurrentMember = this.ExecuteRichJsonCommandIfContainedInMember();
                        }

                        var ipnParsed = !RichJsonConstants.COMMAND_WILDCARD.IsMatch((string)this._con.CurrentMember);
                        if (!ipnParsed) ipns[ipnLevel + 1].IsParsed = false;

                        this._con.CurrentMember = ipnParsed ? this._con.CurrentMember : RichJsonConstants.INTERPOLATION_OPENING_SIGN.ToString() + this._con.CurrentMember + RichJsonConstants.INTERPOLATION_CLOSING_SIGN;

                        if (ipnLevel == -1) rv.Append(this._con.CurrentMember);
                        else ipns[ipnLevel].Rv.Append(this._con.CurrentMember);
                    }
                    else
                    {
                        rv.Append(c);
                    }
                }
                else if (ipnLevel > -1)
                {
                    if (ipns.Count < ipnLevel + 1) ipns.Add(new InterpolationData());
                    ipns[ipnLevel].Rv.Append(c);
                }
                else
                {
                    rv.Append(c);
                }
            }
            var finalResult = rv.ToString();
            this.Cache.Stack[this._con.CurrentAddress] = finalResult;
            return new InterpolationResult(finalResult, ipns.Count == 0 || ipns[0].IsParsed);
        }

        private List<string> GetIgnoresForKeyCommands()
        {
            var rv = new List<string>();
            if (this._con.CurrentMember is IDictionary<string, object> map)
            {
                if (map.ContainsKey(RichJsonConstants.KEY_COMMAND_MEMBER))
                {
                    var kcmds = (List<string>)map[RichJsonConstants.KEY_COMMAND_MEMBER];
                    foreach (var kcmd in kcmds)
                    {
                        if (this.IsRichJsonCommandEnabled(kcmd))
                        {
                            RichJsonCommandHolder.INSTANCE.KcmdIgnored.TryGetValue(kcmd, out var ignoredForThisCmd);
                            if (ignoredForThisCmd != null)
                            {
                                rv.AddRange(ignoredForThisCmd);
                            }
                        }
                    }
                }
            }
            return rv;
        }

        private object ExecuteRichJsonCommandIfContainedInMember()
        {
            var strMember = (string)this._con.CurrentMember;
            if (RichJsonConstants.COMMAND_WILDCARD.IsMatch(strMember))
            {
                this.Cache.Stack[this._con.CurrentAddress] = new Dictionary<string, object>();
                var parts = strMember.Split(new[] { RichJsonConstants.COMMAND_SUFFIX }, 2, StringSplitOptions.None);
                this._con.CurrentCommand = parts[0];
                this._con.CurrentMember = parts[1].Trim();
                this._con.CurrentMember = this.TryRichJsonCommand();
                this.ResetCloneIfPossible(this._con.CurrentAddress);
                this.Cache.Stack[this._con.CurrentAddress] = this._con.CurrentMember;
            }
            return this._con.CurrentMember;
        }

        private object TryRichJsonCommand()
        {
            try
            {
                this._con.CurrentPath.Push(this._con.CurrentCommand);
                var unresolved_command = this._con.CurrentCommand;
                this._con.CurrentCommand = this._con.CurrentCommand.Substring(1);
                var strMember = (string)this._con.CurrentMember;
                this._con.CurrentMember = strMember.Replace(RichJsonConstants.ARRAY_REPLACE_SUBSTRING, RichJsonConstants.ARRAY_REPLACE_NEWSTRING);

                string[] pipe_commands = null;
                if (((string)this._con.CurrentMember).Contains(RichJsonConstants.COMMAND_PIPE_SIGN))
                {
                    var split = ((string)this._con.CurrentMember).Split(new[] { RichJsonConstants.COMMAND_PIPE_SIGN }, StringSplitOptions.None);
                    this._con.CurrentMember = split[0];
                    pipe_commands = split.Skip(1).ToArray();
                }

                var batch_commands = this._con.CurrentCommand.Split(new[] { RichJsonConstants.COMMAND_PREFIX }, StringSplitOptions.None);
                foreach (var cmd in batch_commands)
                {
                    this._con.CurrentCommand = cmd;
                    if (this.IsRichJsonCommandEnabled(this._con.CurrentCommand))
                    {
                        if (this._con.CurrentMember is string sMember && RichJsonConstants.ARRAY_WILDCARD.IsMatch(sMember))
                        {
                            var arrayParts = sMember.Split(new[] { '[', ']' }, 3);
                            this._con.CurrentMember = arrayParts[0];
                            var result = RichJsonCommandHolder.ExecuteCommand(this._con.CurrentCommand, this, this._con);
                            this._con.CurrentMember = RichJsonHelper.GetFieldByKey(result, arrayParts[1].Trim());
                        }
                        else
                        {
                            this._con.CurrentMember = RichJsonCommandHolder.ExecuteCommand(this._con.CurrentCommand, this, this._con);
                        }
                    }
                    else
                    {
                        return unresolved_command + this._con.CurrentMember;
                    }
                }

                if (pipe_commands != null)
                {
                    var originalRoot = this._con.Root;
                    foreach (var pipe_cmd in pipe_commands)
                    {
                        var parts = pipe_cmd.Split(new[] { RichJsonConstants.COMMAND_SUFFIX }, 2, StringSplitOptions.None);
                        var cmdName = (parts.Length == 1) ? RichJsonConstants.COMMAND_REF : parts[0].Trim();
                        var memberVal = (parts.Length == 1) ? parts[0].Trim() : parts[1].Trim();
                        this._con.Root = this._con.CurrentMember;
                        this._con.CurrentCommand = cmdName;
                        this._con.CurrentMember = memberVal;
                        this._con.CurrentMember = this.TryRichJsonCommand();
                    }
                    this._con.Root = originalRoot;
                }
                this._con.CurrentPath.Pop();
                return this._con.CurrentMember;
            }
            catch (Exception e)
            {
                this.Logger.GroupEndAll();
                this.Logger.Error(e.Message);
                throw new Exception(this._label + " Command " + this._con.CurrentCommand + " could not be resolved at " + string.Join(RichJsonConstants.COMMAND_PATH_DELIMITER, this._con.CurrentPath.Reverse()), e);
            }
        }

        private bool IsRichJsonCommandEnabled(string command)
        {
            try
            {
                return RichJsonCommandHolder.IsCommandEnabled(command);
            }
            catch (Exception e)
            {
                this.Logger.GroupEndAll();
                throw e;
            }
        }

        private void ExecuteClone()
        {
            if (this._con.CurrentMember is IDictionary<string, object> map)
            {
                if (map.ContainsKey(RichJsonConstants.KEY_COMMAND_MEMBER))
                {
                    var kcmds = new List<string>((List<string>)map[RichJsonConstants.KEY_COMMAND_MEMBER]);

                    if (kcmds.Contains(RichJsonConstants.COMMAND_CLONE) && this.IsRichJsonCommandEnabled(RichJsonConstants.COMMAND_CLONE))
                    {
                        this._con.CurrentCommand = RichJsonConstants.COMMAND_CLONE;
                        this._con.CurrentMember = this.TryRichJsonKeyCommand();

                        kcmds.Remove(RichJsonConstants.COMMAND_CLONE);

                        ((IDictionary<string, object>)this._con.CurrentMember)[RichJsonConstants.KEY_COMMAND_MEMBER] = kcmds;
                    }
                }
            }
        }

        private void CallConstructor()
        {
            if (RichJsonConfig.LateConstructorEnabled && this._con.CurrentMember is IDictionary<string, object> map)
            {
                if (map.ContainsKey(RichJsonConstants.LATE_CONSTRUCTOR_MEMBER))
                {
                    var clazz = (Type)map[RichJsonConstants.LATE_CONSTRUCTOR_MEMBER];
                    map.Remove(RichJsonConstants.LATE_CONSTRUCTOR_MEMBER);
                    
                    try
                    {
                        var instance = Activator.CreateInstance(clazz);
                        
                        // Emulating Jackson value bindings flawlessly using Newtonsoft deep maps conversion
                        var existingJson = JsonConvert.SerializeObject(map);
                        JsonConvert.PopulateObject(existingJson, instance);
                        
                        this._con.CurrentMember = RichJsonHelper.ConvertValueToDictionary(instance);
                        this.Logger.Debug("resolved construct for '" + clazz.Name + "'");
                    }
                    catch (Exception e)
                    {
                        this.Logger.Error("Constructor error: " + e.Message);
                    }
                }
            }
        }

        private void ResolveInheritances()
        {
            var iteStr = (string)RichJsonHelper.GetFieldByKey(this.Cache.Inheritances, this._con.CurrentAddress);
            if (iteStr == null) return;

            var chain = iteStr.Split(new[] { RichJsonConstants.COMMAND_DELIMITER }, StringSplitOptions.None);
            var member = (IDictionary<string, object>)this._con.CurrentMember;

            this._con.CurrentPath.Push(RichJsonConstants.INHERITANCE_SIGN);
            foreach (var entry in chain)
            {
                var currentEntry = entry.Trim();
                if (RichJsonConstants.COMMAND_WILDCARD.IsMatch(currentEntry))
                {
                    var parts = currentEntry.Split(new[] { RichJsonConstants.COMMAND_SUFFIX }, 2, StringSplitOptions.None);
                    this._con.CurrentCommand = parts[0].Trim();
                    this._con.CurrentMember = parts[1].Trim();
                }
                else
                {
                    this._con.CurrentCommand = RichJsonConstants.COMMAND_REF;
                    this._con.CurrentMember = currentEntry;
                }
                var result = RichJsonHelper.CloneObject(this.TryRichJsonCommand());
                this._con.CurrentMember = RichJsonHelper.MergeIntoTarget(member, result);
            }
            this._con.CurrentPath.Pop();
        }

        private void ResetCloneIfPossible(string address)
        {
            if (this.IsCloneApplying() && address.Equals(this.Cache.CloneAddress))
            {
                this.Cache.CloneAddress = null;
            }
        }

        private bool IsCloneApplying()
        {
            return this.Cache.CloneAddress != null;
        }

        private object ExecuteKeyCommands()
        {
            if (this._con.CurrentMember is IDictionary<string, object> map)
            {
                if (map.ContainsKey(RichJsonConstants.KEY_COMMAND_MEMBER))
                {
                    var kcmds = new List<string>((List<string>)map[RichJsonConstants.KEY_COMMAND_MEMBER]);
                    for (var i = 0; i < kcmds.Count; i++)
                    {
                        var command = kcmds[i];
                        if (this.IsRichJsonCommandEnabled(command))
                        {
                            this._con.CurrentCommand = command;
                            this._con.CurrentMember = this.TryRichJsonKeyCommand();
                            kcmds.RemoveAt(i);
                            i--;
                        }
                    }
                    if (this._con.CurrentMember is IDictionary<string, object> resMap)
                    {
                        if (kcmds.Count == 0) resMap.Remove(RichJsonConstants.KEY_COMMAND_MEMBER);
                        else resMap[RichJsonConstants.KEY_COMMAND_MEMBER] = kcmds;
                    }
                }
            }
            return this._con.CurrentMember;
        }

        private object TryRichJsonKeyCommand()
        {
            try
            {
                return RichJsonCommandHolder.ExecuteCommand(this._con.CurrentCommand, this, this._con);
            }
            catch (Exception e) {
                this.Logger.GroupEndAll();
                this.Logger.Error(e.Message);
                throw new Exception("RichJson key command error: " + this._con.CurrentName, e);
            }
        }

        private class InterpolationData
        {
            public StringBuilder Rv { get; set; } = new StringBuilder();
            public bool IsParsed { get; set; } = true;
        }

        private class InterpolationResult
        {
            public string Result { get; set; }
            public bool IsParsed { get; set; }
            public InterpolationResult(string result, bool isParsed) { this.Result = result; this.IsParsed = isParsed; }
        }
    }
}