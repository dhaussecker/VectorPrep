import "dotenv/config";
import { storage } from "../server/storage";

const COURSE_NAME = "Python Game Programming";
const TOOL_NAME = "Data & Data Types";

// The full Python init code that runs inside the browser via Pyodide.
// It sets up the dungeon map, player state, and all game commands.
// render() prints a GAME:... JSON line that GameRunner parses.
const GAME_INIT_CODE = `
import json

# ─── Data types used in this game — these ARE the lesson ─────────────────────
hero_name  = "Link"    # str   — text, always in quotes
hero_hp    = 100       # int   — whole number
hero_speed = 1.5       # float — decimal number
hero_alive = True      # bool  — True or False

# ─── Map ─────────────────────────────────────────────────────────────────────
# # = wall   . = floor   I = int chest   F = float chest
# S = str chest   B = bool chest   X = exit (locked until all 4 found)
_MAP = [
    list("###########"),
    list("#.........#"),
    list("#.I.....B.#"),
    list("#.........#"),
    list("#.........#"),
    list("#....@....#"),
    list("#.........#"),
    list("#.........#"),
    list("#.F.....S.#"),
    list("#....X....#"),
    list("###########"),
]

_px, _py   = 5, 5   # player column, row
_inventory = []
_collected = set()
_last_msg  = "Welcome to the Data Types Dungeon!\\nFind all 4 chests to unlock the exit. Type help() to see commands."

_CHESTS = {
    (2,  2): ("Integer Gem",    "int",   'hero_hp = 100      # int: whole numbers — score, lives, position'),
    (8,  2): ("Boolean Shield", "bool",  'hero_alive = True  # bool: True or False — flags, conditions'),
    (2,  8): ("Float Potion",   "float", 'hero_speed = 1.5   # float: decimals — speed, angle, gravity'),
    (8,  8): ("String Scroll",  "str",   'hero_name = "Link" # str: text in quotes — names, messages'),
}

def _render():
    grid = []
    for y, row in enumerate(_MAP):
        grid_row = []
        for x, cell in enumerate(row):
            if x == _px and y == _py:
                grid_row.append("HERO")
            elif cell == "#":
                grid_row.append("WALL")
            elif (x, y) in _collected:
                grid_row.append("OPEN_CHEST")
            elif cell in ("I", "F", "S", "B"):
                grid_row.append("CHEST")
            elif cell == "X":
                grid_row.append("EXIT_OPEN" if len(_collected) >= 4 else "EXIT_LOCKED")
            else:
                grid_row.append("FLOOR")
        grid.append(grid_row)
    print("GAME:" + json.dumps({
        "grid":      grid,
        "message":   _last_msg,
        "inventory": _inventory,
        "stats": {
            "name":  hero_name,
            "hp":    hero_hp,
            "speed": hero_speed,
            "alive": hero_alive,
        },
        "collected": len(_collected),
        "total":     4,
        "won":       (len(_collected) >= 4 and _px == 5 and _py == 9),
    }))

def move(direction):
    global _px, _py, _last_msg
    dirs = {
        "north":(0,-1),"south":(0,1),"east":(1,0),"west":(-1,0),
        "n":(0,-1),"s":(0,1),"e":(1,0),"w":(-1,0),
        "up":(0,-1),"down":(0,1),"right":(1,0),"left":(-1,0),
    }
    if direction not in dirs:
        _last_msg = f"Unknown direction '{direction}'. Use: north, south, east, west"
        _render(); return
    dx, dy = dirs[direction]
    nx, ny = _px + dx, _py + dy
    cell = _MAP[ny][nx]
    if cell == "#":
        _last_msg = "Bonk! A stone wall blocks you."
        _render(); return
    if cell == "X" and len(_collected) < 4:
        need = 4 - len(_collected)
        _last_msg = f"The exit is sealed by magic. Collect {need} more chest(s) to break the seal."
        _render(); return
    _px, _py = nx, ny
    pos = (_px, _py)
    if pos in _CHESTS and pos not in _collected:
        label, dtype, lesson = _CHESTS[pos]
        _inventory.append(f"{label} ({dtype})")
        _collected.add(pos)
        _last_msg = f"✨ You found the {label}!\\n   {lesson}"
    elif cell == "X":
        _last_msg = "🏆 You escaped the dungeon! You mastered all 4 Python data types: int, float, str, bool."
    else:
        _last_msg = f"You step {direction}."
    _render()

def look():
    global _last_msg
    dirs = [("north",(0,-1)),("south",(0,1)),("east",(1,0)),("west",(-1,0))]
    desc = []
    for name, (dx, dy) in dirs:
        cell = _MAP[_py+dy][_px+dx]
        if cell == "#": desc.append(f"{name}: wall")
        elif (_px+dx, _py+dy) in _collected: desc.append(f"{name}: open chest")
        elif cell in ("I","F","S","B"): desc.append(f"{name}: a glowing chest ✨")
        elif cell == "X": desc.append(f"{name}: the exit {'(open)' if len(_collected)>=4 else '(locked)'}")
        else: desc.append(f"{name}: open floor")
    _last_msg = "You look around — " + "  |  ".join(desc)
    _render()

def status():
    global _last_msg
    _last_msg = (
        f"name={hero_name!r} (str)   hp={hero_hp} (int)   "
        f"speed={hero_speed} (float)   alive={hero_alive} (bool)   "
        f"chests={len(_collected)}/4"
    )
    _render()

def help():
    global _last_msg
    _last_msg = (
        "Commands:\\n"
        "  move('north')  move('south')  move('east')  move('west')\\n"
        "  look()   status()   help()"
    )
    _render()

_render()
`.trim();

async function main() {
  const courses = await storage.getCourses();
  const course = courses.find(c => c.name === COURSE_NAME);
  if (!course) {
    console.error(`Course "${COURSE_NAME}" not found. Run seed:game first.`);
    process.exit(1);
  }

  const tools = await storage.getToolsByCourse(course.id);
  const tool = tools.find(t => t.name === TOOL_NAME);
  if (!tool) {
    console.error(`Tool "${TOOL_NAME}" not found in course.`);
    process.exit(1);
  }

  console.log(`Updating tool: ${tool.name} (${tool.id})`);

  // Delete existing content
  const existingContent = await storage.getToolContent(tool.id);
  for (const item of existingContent) {
    await storage.deleteToolContent(item.id);
  }
  console.log(`  Deleted ${existingContent.length} old content card(s)`);

  // Create new content: game card (type="game") then reference card
  await storage.createToolContent({
    toolId: tool.id,
    type: "game",
    title: "Data Types Dungeon",
    orderIndex: 0,
    content: GAME_INIT_CODE,
  });

  await storage.createToolContent({
    toolId: tool.id,
    type: "text",
    title: "Data Types — Quick Reference",
    orderIndex: 1,
    content:
`## The Four Core Data Types

| Type | Example | Used for |
|------|---------|---------|
| \`int\` | \`hero_hp = 100\` | Whole numbers — score, lives, grid position |
| \`float\` | \`hero_speed = 1.5\` | Decimals — speed, angle, gravity |
| \`str\` | \`hero_name = "Link"\` | Text — names, messages, labels |
| \`bool\` | \`hero_alive = True\` | True/False — flags, conditions |

Use \`type()\` to check any value's type:

\`\`\`pyrun
print(type(100))     # <class 'int'>
print(type(1.5))     # <class 'float'>
print(type("Link"))  # <class 'str'>
print(type(True))    # <class 'bool'>
\`\`\`

> **Integer division tip:** \`10 // 3\` → \`3\` (floor divide, stays \`int\`).
> \`int(3.9)\` → \`3\` (truncates toward zero, never rounds up).
`,
  });

  console.log("  Created 2 new content cards (game + reference)");
  console.log("\n✅ Done! Topic 1 now has an interactive dungeon game.");
}

main().catch(e => { console.error(e); process.exit(1); });
