package core;

import java.util.ArrayList;

public class RichJsonContext {
    public Object root, current, currentMember;
    public String currentCommand, currentAddress, currentName;
    public ArrayList<String> currentPath = new ArrayList<>();
}