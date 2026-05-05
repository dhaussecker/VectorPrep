import "dotenv/config";
import { storage } from "../server/storage";

const COURSE_NAME = "Python Game Programming";

async function main() {
  // Idempotent — skip if already exists
  const existing = await storage.getCourses();
  if (existing.find(c => c.name === COURSE_NAME)) {
    console.log("Course already exists. Run again after deleting it from the admin if you want to re-seed.");
    process.exit(0);
  }

  const course = await storage.createCourse({
    name: COURSE_NAME,
    description: "Learn Python by programming a game character to move through a world — from basic data types to sorting algorithms",
    icon: "🎮",
    color: "#8B5CF6",
    orderIndex: 1,
    locked: false,
  });
  console.log(`Created course: ${course.name} (${course.id})`);

  // ─────────────────────────────────────────────────────────────────────────────
  // MODULE 1 — COMPUTING WITH PYTHON
  // ─────────────────────────────────────────────────────────────────────────────

  const t1 = await storage.createTool({ courseId: course.id, name: "Data & Data Types", description: "Integers, floats, strings and booleans — the building blocks of your game", icon: "🧱", status: "active", orderIndex: 0, xpReward: 100 });
  await storage.createToolContent({ toolId: t1.id, type: "text", title: "What Is Data?", orderIndex: 0, content: `## What Is Data?

Every game is built from **data** — numbers tracking health, text storing a player's name, true/false flags for whether a door is open. Python organises data into **types**.

| Type | Example | What it stores |
|------|---------|----------------|
| \`int\` | \`10\`, \`-3\`, \`0\` | Whole numbers |
| \`float\` | \`3.14\`, \`-0.5\` | Decimal numbers |
| \`str\` | \`"Hero"\`, \`"Game Over"\` | Text |
| \`bool\` | \`True\`, \`False\` | Yes/No values |

Use \`type()\` to inspect any value:

\`\`\`pyrun
health = 100
speed = 1.5
name = "Hero"
alive = True

print(type(health))   # <class 'int'>
print(type(speed))    # <class 'float'>
print(type(name))     # <class 'str'>
print(type(alive))    # <class 'bool'>
\`\`\`
` });

  await storage.createToolContent({ toolId: t1.id, type: "text", title: "Numbers in Games", orderIndex: 1, content: `## Numbers in Games

**Integers (\`int\`)** are perfect for things that count: lives, score, grid positions.
**Floats (\`float\`)** handle fractions: speed, angle, gravity.

\`\`\`pyrun
# Player stats
lives = 3
score = 0
grid_x = 5      # column on the map
grid_y = 2      # row on the map
speed = 1.5     # tiles per tick
gravity = 9.8   # metres per second²

# Arithmetic
new_x = grid_x + 2          # move right 2 tiles
damage_dealt = speed * 10   # damage scales with speed

print(f"Position: ({grid_x}, {grid_y})")
print(f"After moving right: ({new_x}, {grid_y})")
print(f"Damage: {damage_dealt}")
\`\`\`

> **Tip:** Use \`int()\` and \`float()\` to convert between types.
> \`int(3.9)\` → \`3\` (truncates, not rounds).
` });

  await storage.createToolContent({ toolId: t1.id, type: "text", title: "Boolean Game Flags", orderIndex: 2, content: `## Boolean Game Flags

Booleans (\`True\` / \`False\`) represent **on/off** states. Every game is full of them.

\`\`\`pyrun
is_alive = True
has_key = False
door_open = False
game_won = False

# Boolean operations
can_enter = has_key and door_open
print("Can enter:", can_enter)   # False — needs both

# Changing state
has_key = True
door_open = has_key   # door opens when player gets key
can_enter = has_key and door_open
print("Can enter now:", can_enter)  # True

# not inverts a boolean
print("Is dead:", not is_alive)
\`\`\`
` });

  await storage.createQuestionTemplate({ toolId: t1.id, templateText: "What Python data type would you use to store a player's **score** (whole number only)?", solutionTemplate: "Score is always a whole number, so we use `int`. Example: `score = 0`", answerType: "text", parameters: { _answer: "int" } });
  await storage.createQuestionTemplate({ toolId: t1.id, templateText: "A player has `health = {a}` and takes `{b}` damage. What is their remaining health?", solutionTemplate: "remaining = {a} - {b} = {answer}", answerType: "numeric", parameters: { a: { min: 50, max: 100 }, b: { min: 1, max: 30 } } });

  // ─── Tool 2 ───────────────────────────────────────────────────────────────
  const t2 = await storage.createTool({ courseId: course.id, name: "Variables & Expressions", description: "Store, name, and compute game values", icon: "📦", status: "active", orderIndex: 1, xpReward: 100 });

  await storage.createToolContent({ toolId: t2.id, type: "text", title: "Variables — Named Storage", orderIndex: 0, content: `## Variables — Named Storage

A **variable** is a label you attach to a value. Changing the label's value is how your game *moves*.

\`\`\`pyrun
# Declare and assign
player_x = 0
player_y = 0
player_name = "Aria"

print(f"{player_name} starts at ({player_x}, {player_y})")

# Reassign — player moves right
player_x = player_x + 1
print(f"After moving right: ({player_x}, {player_y})")

# Shorthand operators
player_x += 1   # same as player_x = player_x + 1
player_y -= 1   # move up (y decreases going up)
print(f"After move: ({player_x}, {player_y})")
\`\`\`
` });

  await storage.createToolContent({ toolId: t2.id, type: "text", title: "Expressions & Operators", orderIndex: 1, content: `## Expressions & Operators

An **expression** combines values and operators to produce a result.

| Operator | Symbol | Example | Result |
|----------|--------|---------|--------|
| Add | \`+\` | \`3 + 2\` | \`5\` |
| Subtract | \`-\` | \`10 - 4\` | \`6\` |
| Multiply | \`*\` | \`3 * 4\` | \`12\` |
| Divide | \`/\` | \`7 / 2\` | \`3.5\` |
| Integer divide | \`//\` | \`7 // 2\` | \`3\` |
| Remainder | \`%\` | \`7 % 2\` | \`1\` |
| Power | \`**\` | \`2 ** 3\` | \`8\` |

\`\`\`pyrun
# Calculate distance between two points
x1, y1 = 0, 0
x2, y2 = 3, 4

distance = ((x2 - x1)**2 + (y2 - y1)**2) ** 0.5
print(f"Distance: {distance}")   # 5.0 — classic 3-4-5 triangle!

# Tile position from pixel position
pixel_x = 153
tile_size = 32
tile_x = pixel_x // tile_size   # which tile column?
offset = pixel_x % tile_size    # pixel offset within tile
print(f"Tile: {tile_x}, offset: {offset}")
\`\`\`
` });

  await storage.createToolContent({ toolId: t2.id, type: "text", title: "Tracking Player Movement", orderIndex: 2, content: `## Tracking Player Movement

Put it all together: variables storing position, expressions calculating the next position.

\`\`\`pyrun
# A simple character that moves each "tick"
x, y = 5, 5
direction = "right"
speed = 2

if direction == "right":
    x += speed
elif direction == "left":
    x -= speed
elif direction == "up":
    y -= speed
elif direction == "down":
    y += speed

print(f"New position: ({x}, {y})")

# Try changing direction to "up" or "left" above!
\`\`\`
` });

  await storage.createQuestionTemplate({ toolId: t2.id, templateText: "A player starts at x = {a}. They move right by {b} tiles, then left by {c} tiles. What is their final x position?", solutionTemplate: "final_x = {a} + {b} - {c} = {answer}", answerType: "numeric", parameters: { a: { min: 0, max: 10 }, b: { min: 1, max: 8 }, c: { min: 1, max: 5 } } });

  // ─── Tool 3 ───────────────────────────────────────────────────────────────
  const t3 = await storage.createTool({ courseId: course.id, name: "Console Input & Output", description: "Show your game state and read player commands from the keyboard", icon: "⌨️", status: "active", orderIndex: 2, xpReward: 100 });

  await storage.createToolContent({ toolId: t3.id, type: "text", title: "print() — Showing the Game State", orderIndex: 0, content: `## print() — Showing the Game State

\`print()\` displays text in the console. For text-based games, it's your entire screen.

\`\`\`pyrun
player = "Aria"
hp = 80
max_hp = 100
gold = 45

# Plain print
print("=== GAME STATUS ===")

# f-strings (format strings) — embed variables directly
print(f"Player: {player}")
print(f"HP: {hp}/{max_hp}")
print(f"Gold: {gold} 💰")

# Math inside f-strings
hp_pct = hp / max_hp * 100
print(f"Health: {hp_pct:.1f}%")   # .1f = 1 decimal place

# Print multiple values separated by tab
print("X:", 3, "Y:", 7)
\`\`\`
` });

  await storage.createToolContent({ toolId: t3.id, type: "text", title: "input() — Getting Player Commands", orderIndex: 1, content: `## input() — Getting Player Commands

\`input()\` pauses the program and waits for the player to type something.

> **Note:** \`input()\` always returns a **string** — convert it with \`int()\` or \`float()\` for numbers.

\`\`\`python
# Text adventure command loop
name = input("Enter your character's name: ")
print(f"Welcome, {name}!")

command = input("What do you do? (move/attack/look): ")
print(f"You chose to: {command}")

# Getting a numeric input
steps = int(input("How many steps? "))
print(f"You move {steps} steps forward.")
\`\`\`

*Because this demo runs in the browser without a real terminal, run this locally in Python to see input() in action.*
` });

  await storage.createToolContent({ toolId: t3.id, type: "text", title: "Building a Text Adventure HUD", orderIndex: 2, content: `## Building a Text Adventure HUD

Combine print formatting to draw a clean game heads-up display:

\`\`\`pyrun
def draw_hud(name, hp, max_hp, x, y, gold):
    bar_len = 20
    filled = int(hp / max_hp * bar_len)
    bar = "█" * filled + "░" * (bar_len - filled)

    print("╔══════════════════════════╗")
    print(f"║  {name:<10}  Pos ({x},{y})   ║")
    print(f"║  HP [{bar}]  ║")
    print(f"║  {hp}/{max_hp} HP        Gold: {gold}  ║")
    print("╚══════════════════════════╝")

draw_hud("Aria", 65, 100, 3, 7, 120)
\`\`\`
` });

  await storage.createQuestionTemplate({ toolId: t3.id, templateText: "Which built-in Python function is used to **display** text to the console?", solutionTemplate: "The `print()` function outputs text. Example: `print('Game Over')`", answerType: "text", parameters: { _answer: "print" } });

  // ─── Tool 4 ───────────────────────────────────────────────────────────────
  const t4 = await storage.createTool({ courseId: course.id, name: "Strings, Tuples & Lists", description: "Store inventories, map grids, and player names with sequences", icon: "📋", status: "active", orderIndex: 3, xpReward: 100 });

  await storage.createToolContent({ toolId: t4.id, type: "text", title: "Strings — Text in Your Game", orderIndex: 0, content: `## Strings — Text in Your Game

Strings store text. They support indexing, slicing, and many useful methods.

\`\`\`pyrun
name = "Aria Stormblade"

print(name.upper())          # ARIA STORMBLADE
print(name.lower())          # aria stormblade
print(len(name))             # 15 characters
print(name[0])               # A (first character)
print(name[:4])              # Aria (first 4 chars)
print(name.replace("Aria", "Zara"))  # swap name

# Check if a word appears
item_description = "a rusty iron sword"
print("sword" in item_description)   # True

# Split into words
words = item_description.split()
print(words)    # ['a', 'rusty', 'iron', 'sword']
\`\`\`
` });

  await storage.createToolContent({ toolId: t4.id, type: "text", title: "Tuples — Fixed Positions & Colours", orderIndex: 1, content: `## Tuples — Fixed Positions & Colours

A **tuple** is an **immutable** (unchangeable) sequence. Perfect for coordinates and colour values that shouldn't change once set.

\`\`\`pyrun
# Player spawn point — should never change!
spawn = (5, 10)

# Access by index
print(f"Spawn X: {spawn[0]}, Spawn Y: {spawn[1]}")

# Unpack a tuple
x, y = spawn
print(f"Unpacked: x={x}, y={y}")

# Multiple positions
waypoints = [(0, 0), (5, 0), (5, 5), (0, 5)]
for i, point in enumerate(waypoints):
    print(f"Waypoint {i}: {point}")
\`\`\`
` });

  await storage.createToolContent({ toolId: t4.id, type: "text", title: "Lists — Inventory & Map Grids", orderIndex: 2, content: `## Lists — Inventory & Map Grids

**Lists** are mutable sequences — you can add, remove, and change items.

\`\`\`pyrun
# Inventory
inventory = ["sword", "shield", "health_potion"]
print("Inventory:", inventory)

# Add item
inventory.append("magic_scroll")
print("After pickup:", inventory)

# Remove item
inventory.remove("health_potion")
print("After using potion:", inventory)

# Check contents
print("Has sword:", "sword" in inventory)
print("Item count:", len(inventory))

# A 5x5 map grid (0=empty, 1=wall, 2=player)
grid = [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 2, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
]
for row in grid:
    print(" ".join(["█" if c == 1 else "☺" if c == 2 else "·" for c in row]))
\`\`\`
` });

  await storage.createQuestionTemplate({ toolId: t4.id, templateText: "An inventory list has `{a}` items. After picking up `{b}` new items and dropping `{c}`, how many items are in the inventory?", solutionTemplate: "final = {a} + {b} - {c} = {answer}", answerType: "numeric", parameters: { a: { min: 2, max: 8 }, b: { min: 1, max: 4 }, c: { min: 1, max: 3 } } });

  // ─── Tool 5 ───────────────────────────────────────────────────────────────
  const t5 = await storage.createTool({ courseId: course.id, name: "Conditionals", description: "Make decisions — collision detection, win conditions, branching paths", icon: "🔀", status: "active", orderIndex: 4, xpReward: 100 });

  await storage.createToolContent({ toolId: t5.id, type: "text", title: "if / else — Making Decisions", orderIndex: 0, content: `## if / else — Making Decisions

Every game branches based on conditions. The \`if\` statement runs code only when a condition is \`True\`.

\`\`\`pyrun
player_hp = 15
enemy_hp = 50
has_weapon = True

# Simple branch
if player_hp <= 0:
    print("Game Over — you died!")
else:
    print("Still fighting!")

# Combat check
if has_weapon:
    damage = 25
    enemy_hp -= damage
    print(f"You attack for {damage} damage. Enemy HP: {enemy_hp}")
else:
    print("You have no weapon! You flee.")
\`\`\`
` });

  await storage.createToolContent({ toolId: t5.id, type: "text", title: "elif — Multiple Conditions", orderIndex: 1, content: `## elif — Multiple Conditions

\`elif\` ("else if") handles more than two cases — like directional movement.

\`\`\`pyrun
x, y = 5, 5

direction = "up"   # try: "up", "down", "left", "right"

if direction == "up":
    y -= 1
elif direction == "down":
    y += 1
elif direction == "left":
    x -= 1
elif direction == "right":
    x += 1
else:
    print("Unknown command!")

print(f"Moved {direction}. New position: ({x}, {y})")
\`\`\`
` });

  await storage.createToolContent({ toolId: t5.id, type: "text", title: "Logical Operators & Collision Detection", orderIndex: 2, content: `## Logical Operators & Collision Detection

Combine conditions with \`and\`, \`or\`, \`not\`.

\`\`\`pyrun
# Map boundaries
MAP_W, MAP_H = 10, 10

px, py = 9, 3   # player position (at right edge)
dx, dy = 1, 0   # trying to move right

next_x = px + dx
next_y = py + dy

# Boundary check
in_bounds = (0 <= next_x < MAP_W) and (0 <= next_y < MAP_H)

if in_bounds:
    px, py = next_x, next_y
    print(f"Moved to ({px}, {py})")
else:
    print("Blocked by wall! Can't move there.")

# Item pickup
hp = 70
has_potion = True
if has_potion and hp < 100:
    hp = min(100, hp + 30)
    has_potion = False
    print(f"Used potion! HP: {hp}")
\`\`\`
` });

  await storage.createQuestionTemplate({ toolId: t5.id, templateText: "A player is at x = {a} on a map of width {b} (valid x: 0 to {b}-1). They try to move right by 1. Do they succeed? (yes/no)", solutionTemplate: "next_x = {a} + 1 = {answer_x}. Map width is {b}, so valid range is 0 to {bm1}. Answer: {answer}", answerType: "text", parameters: { a: { min: 7, max: 9 }, b: { min: 9, max: 10 }, _answer: "no" } });

  // ─── Tool 6 ───────────────────────────────────────────────────────────────
  const t6 = await storage.createTool({ courseId: course.id, name: "Functions & Modules", description: "Organise your game into reusable functions and import external modules", icon: "🔧", status: "active", orderIndex: 5, xpReward: 100 });

  await storage.createToolContent({ toolId: t6.id, type: "text", title: "Defining Functions", orderIndex: 0, content: `## Defining Functions

A **function** groups code you want to reuse. Use \`def\` to define one.

\`\`\`pyrun
def move_player(x, y, direction):
    """Move a player one step in the given direction."""
    if direction == "up":
        y -= 1
    elif direction == "down":
        y += 1
    elif direction == "left":
        x -= 1
    elif direction == "right":
        x += 1
    return x, y   # return new position

# Call the function
px, py = 5, 5
px, py = move_player(px, py, "up")
print(f"After up: ({px}, {py})")
px, py = move_player(px, py, "right")
print(f"After right: ({px}, {py})")
\`\`\`
` });

  await storage.createToolContent({ toolId: t6.id, type: "text", title: "Return Values & Default Parameters", orderIndex: 1, content: `## Return Values & Default Parameters

Functions can **return** computed results. Parameters can have **defaults**.

\`\`\`pyrun
def calc_damage(attack, defense, critical=False):
    """Calculate damage dealt to an enemy."""
    base = max(0, attack - defense)
    if critical:
        base *= 2
    return base

def is_alive(hp):
    return hp > 0

# Normal hit
dmg = calc_damage(30, 10)
print(f"Normal damage: {dmg}")

# Critical hit
dmg = calc_damage(30, 10, critical=True)
print(f"Critical damage: {dmg}")

enemy_hp = 25 - dmg
print(f"Enemy HP: {enemy_hp}, Alive: {is_alive(enemy_hp)}")
\`\`\`
` });

  await storage.createToolContent({ toolId: t6.id, type: "text", title: "Importing Modules", orderIndex: 2, content: `## Importing Modules

Python's standard library has modules for common tasks. Games often use \`random\` and \`math\`.

\`\`\`pyrun
import random
import math

# Random enemy spawn
ENEMY_TYPES = ["Goblin", "Skeleton", "Troll", "Dragon"]
spawn = random.choice(ENEMY_TYPES)
hp = random.randint(20, 100)
print(f"A {spawn} appears with {hp} HP!")

# Calculate angle to target using math
px, py = 2, 2
tx, ty = 7, 5   # target position

dx, dy = tx - px, ty - py
angle = math.degrees(math.atan2(dy, dx))
distance = math.sqrt(dx**2 + dy**2)

print(f"Target is {distance:.2f} tiles away at {angle:.1f}°")
\`\`\`
` });

  await storage.createQuestionTemplate({ toolId: t6.id, templateText: "A function `calc_damage(attack, defense)` returns `attack - defense` (minimum 0). If attack = {a} and defense = {b}, what does it return?", solutionTemplate: "damage = max(0, {a} - {b}) = {answer}", answerType: "numeric", parameters: { a: { min: 15, max: 40 }, b: { min: 5, max: 20 } } });

  // ─── Tool 7 ───────────────────────────────────────────────────────────────
  const t7 = await storage.createTool({ courseId: course.id, name: "Repetition & Loops", description: "The game loop, animating movement, and iterating over maps", icon: "🔁", status: "active", orderIndex: 6, xpReward: 100 });

  await storage.createToolContent({ toolId: t7.id, type: "text", title: "while — The Game Loop", orderIndex: 0, content: `## while — The Game Loop

Every real-time game runs in a **game loop** — repeat forever until the game ends.

\`\`\`pyrun
import random

hp = 50
enemy_hp = 40
turn = 1

while hp > 0 and enemy_hp > 0:
    # Player attacks
    dmg = random.randint(8, 15)
    enemy_hp -= dmg

    # Enemy attacks back
    enemy_dmg = random.randint(5, 12)
    hp -= enemy_dmg

    print(f"Turn {turn}: You deal {dmg} dmg | Enemy deals {enemy_dmg} dmg | HP: {hp} | Enemy HP: {max(0,enemy_hp)}")
    turn += 1

    if turn > 10:   # safety limit for demo
        print("Battle too long — draw!")
        break

if hp <= 0:
    print("You were defeated!")
elif enemy_hp <= 0:
    print("Victory!")
\`\`\`
` });

  await storage.createToolContent({ toolId: t7.id, type: "text", title: "for — Iterating Over Maps", orderIndex: 1, content: `## for — Iterating Over Maps

\`for\` loops iterate over any sequence: lists, strings, \`range()\`.

\`\`\`pyrun
# Animate character walking across a row
WIDTH = 10

for step in range(WIDTH):
    row = ["·"] * WIDTH
    row[step] = "☺"
    print(" ".join(row))

print("---")

# Scan a grid for items
grid = [
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 1],
    [1, 0, 0, 1, 0],
]
ITEMS = {1: "💎"}

items_found = []
for r, row in enumerate(grid):
    for c, cell in enumerate(row):
        if cell == 1:
            items_found.append((r, c))
            print(f"Found item at ({r}, {c})")

print(f"Total items: {len(items_found)}")
\`\`\`
` });

  await storage.createToolContent({ toolId: t7.id, type: "text", title: "break and continue", orderIndex: 2, content: `## break and continue

- \`break\` — **exit** the loop immediately
- \`continue\` — **skip** the rest of this iteration

\`\`\`pyrun
import random

MAX_STEPS = 20
x, y = 0, 0
GOAL = (4, 4)

for step in range(MAX_STEPS):
    direction = random.choice(["up", "down", "left", "right"])

    if direction == "up":    y = max(0, y - 1)
    elif direction == "down":  y = min(6, y + 1)
    elif direction == "left":  x = max(0, x - 1)
    elif direction == "right": x = min(6, x + 1)

    if (x, y) == GOAL:
        print(f"Reached goal at step {step + 1}!")
        break   # exit loop — goal found

    if step % 5 == 0:
        continue   # skip printing most steps

    print(f"Step {step}: ({x}, {y})")
else:
    print("Didn't reach goal in time.")
\`\`\`
` });

  await storage.createQuestionTemplate({ toolId: t7.id, templateText: "A for loop runs `for i in range({a}, {b}):`. How many times does the loop body execute?", solutionTemplate: "range({a}, {b}) produces {b} - {a} = {answer} values.", answerType: "numeric", parameters: { a: { min: 0, max: 5 }, b: { min: 6, max: 15 } } });

  // ─────────────────────────────────────────────────────────────────────────────
  // MODULE 2 — THE PRACTICE OF COMPUTING
  // ─────────────────────────────────────────────────────────────────────────────

  const t8 = await storage.createTool({ courseId: course.id, name: "Software Design", description: "Plan your game before you code — top-down design and decomposition", icon: "📐", status: "active", orderIndex: 7, xpReward: 100 });

  await storage.createToolContent({ toolId: t8.id, type: "text", title: "Top-Down Design", orderIndex: 0, content: `## Top-Down Design

Good games come from good planning. **Top-down design** means:
1. Identify the main goal
2. Break it into sub-tasks
3. Break each sub-task further until each piece is simple to code

**Game goal:** *A hero navigates a dungeon, fights enemies, and finds the exit.*

\`\`\`
main_game()
├── setup()          → create map, spawn player, spawn enemies
├── game_loop()
│   ├── get_input()  → read player command
│   ├── update()     → move player, move enemies, check collisions
│   └── draw()       → render the current game state
└── game_over()      → show result, offer restart
\`\`\`

Write the top-level logic first, then fill in each function:

\`\`\`pyrun
def setup():
    return {"x": 5, "y": 5, "hp": 100, "alive": True}

def get_input():
    # In a real game this reads the keyboard
    return "right"

def update(player, direction):
    if direction == "right":
        player["x"] += 1
    return player

def draw(player):
    print(f"Player at ({player['x']}, {player['y']}) HP:{player['hp']}")

# Main game loop (3 ticks for demo)
player = setup()
for _ in range(3):
    cmd = get_input()
    player = update(player, cmd)
    draw(player)
\`\`\`
` });

  await storage.createToolContent({ toolId: t8.id, type: "text", title: "Pseudocode", orderIndex: 1, content: `## Pseudocode

**Pseudocode** is plain-English planning before real code. It lets you think about logic without worrying about syntax.

**Example — collision detection:**

\`\`\`
FUNCTION check_collision(player, walls):
    FOR each wall in walls:
        IF player position == wall position:
            RETURN True   # collision!
    RETURN False
\`\`\`

Converting pseudocode to Python is straightforward:

\`\`\`pyrun
def check_collision(px, py, walls):
    for (wx, wy) in walls:
        if px == wx and py == wy:
            return True
    return False

walls = [(3, 3), (3, 4), (3, 5)]
print(check_collision(3, 3, walls))   # True — hit wall
print(check_collision(2, 3, walls))   # False — clear
\`\`\`
` });

  await storage.createQuestionTemplate({ toolId: t8.id, templateText: "In top-down design, you break a problem into smaller ___.", solutionTemplate: "Functions (or sub-tasks). Top-down design decomposes a problem into smaller, manageable functions.", answerType: "text", parameters: { _answer: "functions" } });

  // ─── Tool 9 ───────────────────────────────────────────────────────────────
  const t9 = await storage.createTool({ courseId: course.id, name: "Testing & Debugging", description: "Find and fix bugs before your players do", icon: "🐛", status: "active", orderIndex: 8, xpReward: 100 });

  await storage.createToolContent({ toolId: t9.id, type: "text", title: "Types of Errors", orderIndex: 0, content: `## Types of Errors

| Error Type | When it happens | Example |
|-----------|----------------|---------|
| **Syntax Error** | Before code runs | \`if x = 5:\` (should be \`==\`) |
| **Runtime Error** | While code runs | \`int("hello")\` |
| **Logic Error** | Code runs but gives wrong answer | \`x - 1\` instead of \`x + 1\` |

Logic errors are the sneakiest — Python can't detect them!

\`\`\`pyrun
def move_right(x):
    return x - 1   # BUG: should be x + 1

pos = 5
pos = move_right(pos)
print(f"After moving right: {pos}")   # 4 — wrong!

# Fix: return x + 1
def move_right_fixed(x):
    return x + 1

pos = 5
pos = move_right_fixed(pos)
print(f"Fixed: {pos}")   # 6 — correct
\`\`\`
` });

  await storage.createToolContent({ toolId: t9.id, type: "text", title: "Debugging with print()", orderIndex: 1, content: `## Debugging with print()

The simplest debugging tool is \`print()\`. Add prints to trace what your code is actually doing.

\`\`\`pyrun
def find_item(inventory, item):
    print(f"[DEBUG] Searching for '{item}' in {inventory}")
    for i, it in enumerate(inventory):
        print(f"[DEBUG]   Checking index {i}: '{it}'")
        if it == item:
            print(f"[DEBUG]   Found at index {i}")
            return i
    print("[DEBUG]   Not found")
    return -1

inv = ["sword", "Shield", "potion"]   # Note: "Shield" has capital S
result = find_item(inv, "shield")     # Searching for lowercase

# Bug found: case mismatch!
# Fix: compare lowercased strings
def find_item_fixed(inventory, item):
    for i, it in enumerate(inventory):
        if it.lower() == item.lower():
            return i
    return -1

print("Fixed result:", find_item_fixed(inv, "shield"))
\`\`\`
` });

  await storage.createQuestionTemplate({ toolId: t9.id, templateText: "Code that runs without crashing but produces the wrong answer contains a ___ error.", solutionTemplate: "A **logic error** — the code is syntactically correct but the algorithm is wrong.", answerType: "text", parameters: { _answer: "logic" } });

  // ─── Tool 10 ───────────────────────────────────────────────────────────────
  const t10 = await storage.createTool({ courseId: course.id, name: "Documenting Your Software", description: "Comments, docstrings, and README files", icon: "📝", status: "active", orderIndex: 9, xpReward: 100 });

  await storage.createToolContent({ toolId: t10.id, type: "text", title: "Comments & Docstrings", orderIndex: 0, content: `## Comments & Docstrings

**Comments** (\`#\`) explain *why* — not just what. Future-you will thank you.
**Docstrings** (\`""" """\`) document functions so others know how to use them.

\`\`\`pyrun
# BAD comment — restates the code
x = x + 1  # add 1 to x

# GOOD comment — explains WHY
x = x + 1  # offset by 1 because grid is 1-indexed

def move(x, y, direction, speed=1):
    """
    Move a character in the given direction.

    Args:
        x (int): Current column position.
        y (int): Current row position.
        direction (str): 'up', 'down', 'left', or 'right'.
        speed (int): Number of tiles to move. Default 1.

    Returns:
        tuple: New (x, y) position.
    """
    if direction == "right": x += speed
    elif direction == "left": x -= speed
    elif direction == "down": y += speed
    elif direction == "up":   y -= speed
    return x, y

# help() reads docstrings!
help(move)
\`\`\`
` });

  await storage.createQuestionTemplate({ toolId: t10.id, templateText: "In Python, what character starts a single-line comment?", solutionTemplate: "The `#` (hash/pound) character. Everything after # on a line is ignored by Python.", answerType: "text", parameters: { _answer: "#" } });

  // ─── Tool 11 ───────────────────────────────────────────────────────────────
  const t11 = await storage.createTool({ courseId: course.id, name: "File Input & Output", description: "Load game levels from files and save player progress", icon: "💾", status: "active", orderIndex: 10, xpReward: 100 });

  await storage.createToolContent({ toolId: t11.id, type: "text", title: "Reading & Writing Files", orderIndex: 0, content: `## Reading & Writing Files

Files let your game **persist** — save progress, load levels, record high scores.

\`\`\`pyrun
import json

# Simulate saving game state to a file
game_state = {
    "player": {"name": "Aria", "x": 7, "y": 3, "hp": 85},
    "level": 2,
    "score": 1450,
    "inventory": ["sword", "map", "potion"],
}

# Serialise to JSON string (in real code: write to file)
saved = json.dumps(game_state, indent=2)
print("=== SAVE DATA ===")
print(saved)

# Load it back
loaded = json.loads(saved)
print("\\nLoaded player:", loaded["player"]["name"])
print("Score:", loaded["score"])
\`\`\`

In a real game you'd write/read files:
\`\`\`python
# Save
with open("save.json", "w") as f:
    json.dump(game_state, f)

# Load
with open("save.json", "r") as f:
    game_state = json.load(f)
\`\`\`
` });

  await storage.createToolContent({ toolId: t11.id, type: "text", title: "Loading Levels from Text Files", orderIndex: 1, content: `## Loading Levels from Text Files

Game maps are often stored as text files — easy to edit without touching code.

\`\`\`pyrun
# Simulate a level file
level_text = """##########
#........#
#.P......#
#........#
#.....E..#
##########"""

# Parse it
def parse_level(text):
    grid = []
    player_pos = None
    enemies = []

    for r, line in enumerate(text.strip().splitlines()):
        row = []
        for c, ch in enumerate(line):
            if ch == "P":
                player_pos = (r, c)
                row.append(".")
            elif ch == "E":
                enemies.append((r, c))
                row.append(".")
            else:
                row.append(ch)
        grid.append(row)

    return grid, player_pos, enemies

grid, player, enemies = parse_level(level_text)
print(f"Player starts at: {player}")
print(f"Enemies at: {enemies}")
print(f"Grid size: {len(grid)} rows x {len(grid[0])} cols")
\`\`\`
` });

  await storage.createQuestionTemplate({ toolId: t11.id, templateText: "Which Python module is used to read and write structured game data in JSON format?", solutionTemplate: "The `json` module. Use `json.load()` to read and `json.dump()` to write.", answerType: "text", parameters: { _answer: "json" } });

  // ─── Tool 12 ───────────────────────────────────────────────────────────────
  const t12 = await storage.createTool({ courseId: course.id, name: "Dictionaries", description: "Key-value stores for player stats, game worlds, and item databases", icon: "🗂️", status: "active", orderIndex: 11, xpReward: 100 });

  await storage.createToolContent({ toolId: t12.id, type: "text", title: "Dictionary Basics", orderIndex: 0, content: `## Dictionary Basics

A **dictionary** maps **keys** to **values** — perfect for player stats and item data.

\`\`\`pyrun
# Player as a dictionary
player = {
    "name": "Aria",
    "hp": 100,
    "max_hp": 100,
    "attack": 25,
    "defense": 10,
    "gold": 50,
}

print("Name:", player["name"])
print("HP:", player["hp"])

# Update values
player["hp"] -= 20     # take damage
player["gold"] += 100  # collect gold

print(f"After battle: HP={player['hp']}, Gold={player['gold']}")

# Safe access with .get()
xp = player.get("xp", 0)   # returns 0 if "xp" not in dict
print("XP:", xp)
\`\`\`
` });

  await storage.createToolContent({ toolId: t12.id, type: "text", title: "Nested Dictionaries — Game World", orderIndex: 1, content: `## Nested Dictionaries — Game World

Dictionaries can contain other dictionaries — great for complex game data.

\`\`\`pyrun
# Item database
items = {
    "sword": {"name": "Iron Sword", "damage": 15, "weight": 5, "value": 50},
    "bow":   {"name": "Long Bow",   "damage": 10, "weight": 2, "value": 40},
    "potion":{"name": "Health Potion","heal": 30, "weight": 1, "value": 20},
}

# Look up an item
item_id = "sword"
item = items[item_id]
print(f"Item: {item['name']}")
print(f"Damage: {item['damage']}")

# Player inventory using a dict (item_id → quantity)
inventory = {"sword": 1, "potion": 3, "gold": 120}

# Use a potion
if inventory.get("potion", 0) > 0:
    inventory["potion"] -= 1
    player_hp = min(100, 70 + items["potion"]["heal"])
    print(f"Drank potion! HP restored to {player_hp}")
    print(f"Potions remaining: {inventory['potion']}")
\`\`\`
` });

  await storage.createQuestionTemplate({ toolId: t12.id, templateText: "A dictionary `stats = {'hp': {a}, 'attack': {b}}`. What does `stats['hp'] + stats['attack']` return?", solutionTemplate: "{a} + {b} = {answer}", answerType: "numeric", parameters: { a: { min: 50, max: 100 }, b: { min: 10, max: 40 } } });

  // ─── Tool 13 ───────────────────────────────────────────────────────────────
  const t13 = await storage.createTool({ courseId: course.id, name: "Repetition & Recursion", description: "Advanced loops and recursive algorithms for maze solving and tree traversal", icon: "🌀", status: "active", orderIndex: 12, xpReward: 100 });

  await storage.createToolContent({ toolId: t13.id, type: "text", title: "Recursive Functions", orderIndex: 0, content: `## Recursive Functions

A **recursive** function calls itself. It needs:
1. A **base case** — when to stop
2. A **recursive case** — the self-call with a simpler input

\`\`\`pyrun
def countdown(n):
    """Count down from n to 0 — recursive."""
    if n <= 0:          # base case
        print("Launch! 🚀")
        return
    print(n)
    countdown(n - 1)   # recursive call with smaller n

countdown(5)
\`\`\`
` });

  await storage.createToolContent({ toolId: t13.id, type: "text", title: "Recursive Maze Solving", orderIndex: 1, content: `## Recursive Maze Solving

Recursion naturally fits problems where you explore branching paths — like a maze.

\`\`\`pyrun
# Simple maze: 0=open, 1=wall, S=start, E=end
maze = [
    [0, 1, 0, 0, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 0, 1, 0],
    [1, 1, 0, 0, 0],
    [0, 0, 0, 1, 0],
]
ROWS, COLS = len(maze), len(maze[0])
END = (4, 4)

def solve(r, c, visited, path):
    if r < 0 or r >= ROWS or c < 0 or c >= COLS: return False
    if (r, c) in visited or maze[r][c] == 1: return False

    path.append((r, c))
    if (r, c) == END:
        return True

    visited.add((r, c))
    for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
        if solve(r+dr, c+dc, visited, path):
            return True

    path.pop()
    return False

path = []
if solve(0, 0, set(), path):
    print(f"Path found! {len(path)} steps:")
    print(" → ".join(str(p) for p in path))
else:
    print("No path found")
\`\`\`
` });

  await storage.createQuestionTemplate({ toolId: t13.id, templateText: "A recursive function calls `factorial(n)` which returns `n * factorial(n-1)`. What is `factorial({a})`?", solutionTemplate: "{a}! = {answer}", answerType: "numeric", parameters: { a: { min: 3, max: 7 } } });

  // ─── Tool 14 ───────────────────────────────────────────────────────────────
  const t14 = await storage.createTool({ courseId: course.id, name: "Binary Numbers", description: "Understand how computers count, and use bit flags for game states", icon: "💻", status: "active", orderIndex: 13, xpReward: 100 });

  await storage.createToolContent({ toolId: t14.id, type: "text", title: "Counting in Binary", orderIndex: 0, content: `## Counting in Binary

Computers store everything in **binary** (base 2 — only 0s and 1s).

| Decimal | Binary | Powers of 2 |
|---------|--------|-------------|
| 0 | 0000 | — |
| 1 | 0001 | $2^0 = 1$ |
| 2 | 0010 | $2^1 = 2$ |
| 5 | 0101 | $2^2 + 2^0 = 4+1$ |
| 10 | 1010 | $2^3 + 2^1 = 8+2$ |

\`\`\`pyrun
# Python binary conversions
n = 42
print(f"Decimal: {n}")
print(f"Binary:  {bin(n)}")       # 0b101010
print(f"Hex:     {hex(n)}")       # 0x2a

# Convert back
print(int("101010", 2))   # binary string → decimal = 42
print(int("2a", 16))      # hex string → decimal = 42
\`\`\`
` });

  await storage.createToolContent({ toolId: t14.id, type: "text", title: "Bit Flags for Game States", orderIndex: 1, content: `## Bit Flags for Game States

Pack multiple boolean flags into a single integer using **bitwise operators**.

| Operator | Symbol | Meaning |
|----------|--------|---------|
| AND | \`&\` | Both bits 1 |
| OR | \`|\` | Either bit 1 |
| XOR | \`^\` | Exactly one bit 1 |
| NOT | \`~\` | Flip all bits |
| Left shift | \`<<\` | Multiply by 2 |
| Right shift | \`>>\` | Divide by 2 |

\`\`\`pyrun
# Game state flags (each is a power of 2)
HAS_SWORD  = 0b0001   # 1
HAS_SHIELD = 0b0010   # 2
HAS_KEY    = 0b0100   # 4
POISONED   = 0b1000   # 8

# Player starts with sword and key
player_flags = HAS_SWORD | HAS_KEY
print(f"Flags: {bin(player_flags)}")   # 0b0101

# Check flags
has_sword  = bool(player_flags & HAS_SWORD)
has_shield = bool(player_flags & HAS_SHIELD)
print(f"Has sword: {has_sword}, Has shield: {has_shield}")

# Add shield
player_flags |= HAS_SHIELD
print(f"After pickup: {bin(player_flags)}")   # 0b0111

# Remove key (used it)
player_flags &= ~HAS_KEY
print(f"After using key: {bin(player_flags)}")  # 0b0011
\`\`\`
` });

  await storage.createQuestionTemplate({ toolId: t14.id, templateText: "What is the decimal value of the binary number `{a}`?", solutionTemplate: "Convert each bit: {answer}", answerType: "numeric", parameters: { _answer: 10, a: "1010" } });

  // ─────────────────────────────────────────────────────────────────────────────
  // MODULE 3 — SEARCHING AND SORTING
  // ─────────────────────────────────────────────────────────────────────────────

  const t15 = await storage.createTool({ courseId: course.id, name: "Linear & Binary Search", description: "Find items in inventories and sorted leaderboards efficiently", icon: "🔍", status: "active", orderIndex: 14, xpReward: 100 });

  await storage.createToolContent({ toolId: t15.id, type: "text", title: "Linear Search — Check Every Item", orderIndex: 0, content: `## Linear Search — Check Every Item

**Linear search** checks each element one by one until it finds the target.

- Best case: $O(1)$ — found at the first position
- Worst case: $O(n)$ — checked every element
- Works on **unsorted** data

\`\`\`pyrun
def linear_search(lst, target):
    """Return index of target or -1 if not found."""
    for i, item in enumerate(lst):
        if item == target:
            return i
    return -1

inventory = ["sword", "potion", "map", "key", "torch"]

idx = linear_search(inventory, "key")
print(f"'key' found at index: {idx}")

idx = linear_search(inventory, "shield")
print(f"'shield' found at index: {idx}")   # -1 = not found

# Count steps taken
def linear_search_counted(lst, target):
    for i, item in enumerate(lst):
        if item == target:
            return i, i + 1   # index, steps taken
    return -1, len(lst)

_, steps = linear_search_counted(inventory, "torch")
print(f"Found 'torch' after {steps} comparison(s)")
\`\`\`
` });

  await storage.createToolContent({ toolId: t15.id, type: "text", title: "Binary Search — Divide and Conquer", orderIndex: 1, content: `## Binary Search — Divide and Conquer

**Binary search** works on **sorted** data. Each step eliminates **half** the remaining elements.

Worst case: $O(\\log_2 n)$ — with 1024 items, you need at most **10** comparisons!

\`\`\`pyrun
def binary_search(lst, target):
    low, high = 0, len(lst) - 1
    steps = 0

    while low <= high:
        steps += 1
        mid = (low + high) // 2

        if lst[mid] == target:
            return mid, steps
        elif lst[mid] < target:
            low = mid + 1    # target is in right half
        else:
            high = mid - 1   # target is in left half

    return -1, steps

# Sorted leaderboard scores
scores = [120, 240, 380, 450, 520, 610, 780, 900, 1050, 1200]

idx, steps = binary_search(scores, 610)
print(f"Score 610 found at index {idx} in {steps} step(s)")

idx, steps = binary_search(scores, 500)
print(f"Score 500: index={idx}, steps={steps}")

# Compare with linear
n = len(scores)
import math
print(f"\\nFor {n} items: linear worst={n} steps, binary worst={math.ceil(math.log2(n))} steps")
\`\`\`
` });

  await storage.createQuestionTemplate({ toolId: t15.id, templateText: "Linear search on a list of {a} items checks at most ___ items in the worst case.", solutionTemplate: "Linear search checks every item, so worst case = {a} comparisons.", answerType: "numeric", parameters: { a: { min: 10, max: 100 } } });

  // ─── Tool 16 ───────────────────────────────────────────────────────────────
  const t16 = await storage.createTool({ courseId: course.id, name: "Merge Sort & Quick Sort", description: "Sort leaderboards and inventories with efficient divide-and-conquer algorithms", icon: "📊", status: "active", orderIndex: 15, xpReward: 100 });

  await storage.createToolContent({ toolId: t16.id, type: "text", title: "Merge Sort", orderIndex: 0, content: `## Merge Sort

**Merge sort** splits a list in half, sorts each half recursively, then **merges** them back in order.

Time complexity: $O(n \\log n)$ — guaranteed, every time.

\`\`\`pyrun
def merge_sort(lst):
    if len(lst) <= 1:
        return lst

    mid = len(lst) // 2
    left = merge_sort(lst[:mid])
    right = merge_sort(lst[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result

# Sort game leaderboard scores
scores = [450, 120, 780, 240, 900, 380, 1200, 50]
print("Unsorted:", scores)

sorted_scores = merge_sort(scores)
print("Sorted:  ", sorted_scores)

# Show top 3
print("Top 3:", sorted_scores[-3:][::-1])
\`\`\`
` });

  await storage.createToolContent({ toolId: t16.id, type: "text", title: "Quick Sort", orderIndex: 1, content: `## Quick Sort

**Quick sort** picks a **pivot**, partitions elements around it (smaller left, larger right), then sorts each partition recursively.

Average: $O(n \\log n)$ — often faster than merge sort in practice.

\`\`\`pyrun
def quick_sort(lst):
    if len(lst) <= 1:
        return lst

    pivot = lst[len(lst) // 2]
    left   = [x for x in lst if x < pivot]
    middle = [x for x in lst if x == pivot]
    right  = [x for x in lst if x > pivot]

    return quick_sort(left) + middle + quick_sort(right)

# Sort player damage values for a combat log
damage_log = [15, 42, 8, 27, 42, 3, 99, 15, 7]
print("Raw damage log:", damage_log)

sorted_dmg = quick_sort(damage_log)
print("Sorted:        ", sorted_dmg)
print(f"Min damage: {sorted_dmg[0]}, Max: {sorted_dmg[-1]}, Median: {sorted_dmg[len(sorted_dmg)//2]}")
\`\`\`
` });

  await storage.createToolContent({ toolId: t16.id, type: "text", title: "Comparing Sorting Algorithms", orderIndex: 2, content: `## Comparing Sorting Algorithms

| Algorithm | Best | Average | Worst | Space | Stable? |
|-----------|------|---------|-------|-------|---------|
| **Merge Sort** | $O(n \\log n)$ | $O(n \\log n)$ | $O(n \\log n)$ | $O(n)$ | ✅ Yes |
| **Quick Sort** | $O(n \\log n)$ | $O(n \\log n)$ | $O(n^2)$ | $O(\\log n)$ | ❌ No |

\`\`\`pyrun
import time, random

def merge_sort(lst):
    if len(lst) <= 1: return lst
    mid = len(lst) // 2
    l, r = merge_sort(lst[:mid]), merge_sort(lst[mid:])
    out, i, j = [], 0, 0
    while i < len(l) and j < len(r):
        if l[i] <= r[j]: out.append(l[i]); i+=1
        else: out.append(r[j]); j+=1
    return out + l[i:] + r[j:]

def quick_sort(lst):
    if len(lst) <= 1: return lst
    p = lst[len(lst)//2]
    return quick_sort([x for x in lst if x<p]) + [x for x in lst if x==p] + quick_sort([x for x in lst if x>p])

data = [random.randint(1, 10000) for _ in range(2000)]

t0 = time.time(); merge_sort(data[:]);  t1 = time.time()
t2 = time.time(); quick_sort(data[:]);  t3 = time.time()

print(f"Merge sort: {(t1-t0)*1000:.2f} ms")
print(f"Quick sort: {(t3-t2)*1000:.2f} ms")
print("Both produce correct results:", merge_sort(data[:5]) == quick_sort(data[:5]))
\`\`\`
` });

  await storage.createQuestionTemplate({ toolId: t16.id, templateText: "Merge sort's time complexity in the worst case is $O(n \\log n)$. For a leaderboard of {a} players, approximately how many operations does it take? (use log base 2)", solutionTemplate: "n × log₂(n) ≈ {a} × {logn} ≈ {answer}", answerType: "numeric", parameters: { a: { min: 8, max: 32 } } });

  console.log(`\n✅ Python Game Programming course created!`);
  console.log(`   ${16} topics, content cards, and practice questions added.`);
  console.log(`   Course ID: ${course.id}`);
  process.exit(0);
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});

// Helper: add createQuestionTemplate to storage (it's already there via routes)
// Extend storage interface usage:
declare module "../server/storage" {
  interface IStorage {
    createQuestionTemplate(template: any): Promise<any>;
  }
}
