package core;

import java.util.ArrayList;
import java.util.Stack;

public class RichJsonContext {
    public Object root, current, currentMember;
    public String currentCommand, currentAddress, currentName;
    public Stack<String> currentPath = new Stack<>();
}