from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import itertools
import copy

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///circuits.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class SavedCircuit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    gates = db.Column(db.JSON, nullable=False)
    wires = db.Column(db.JSON, nullable=False)

with app.app_context():
    db.create_all()

GATE_DELAYS = {'AND': 1.0, 'OR': 1.0, 'NAND': 1.0, 'NOR': 1.0, 'NOT': 0.5, 'XOR': 1.5, 'INPUT': 0, 'OUTPUT': 0}

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "CircuitForge API running"})

def evaluate_gate(gate_type, input_values):
    if gate_type == "AND": return all(input_values)
    elif gate_type == "OR": return any(input_values)
    elif gate_type == "NOT": return not input_values[0] if input_values else False
    elif gate_type == "NAND": return not all(input_values)
    elif gate_type == "NOR": return not any(input_values)
    elif gate_type == "XOR": return (sum(input_values) % 2) == 1
    return False

def _node_label(node_id):
    parts = node_id.split('_')
    if len(parts) >= 2 and parts[0] in ('INPUT', 'OUTPUT'):
        return '_'.join(parts[1:])
    return node_id

def get_expression(node_id, gates_by_id):
    gate = gates_by_id.get(node_id)
    if not gate: return _node_label(node_id)
    gt = gate.get("type", "").upper()
    inputs = gate.get("inputs", [])
    if gt == "OUTPUT" or gt == "AND" and node_id.startswith("OUTPUT"):
        return get_expression(inputs[0], gates_by_id) if inputs else "0"
    if not inputs: return "?"
    if gt == "NOT": return f"NOT({get_expression(inputs[0], gates_by_id)})"
    if len(inputs) == 1: return get_expression(inputs[0], gates_by_id)
    left = get_expression(inputs[0], gates_by_id)
    right = get_expression(inputs[1], gates_by_id)
    return f"({left} {gt} {right})"

def get_delay_and_depth(node_id, gates_by_id):
    gate = gates_by_id.get(node_id)
    if not gate: return {"delay": 0.0, "depth": 0}
    gt = gate.get("type", "").upper()
    inputs = gate.get("inputs", [])
    if gt == "INPUT": return {"delay": 0.0, "depth": 0}
    if gt == "OUTPUT" or gt == "AND" and node_id.startswith("OUTPUT"):
        return get_delay_and_depth(inputs[0], gates_by_id) if inputs else {"delay": 0.0, "depth": 0}
    if not inputs: return {"delay": 0.0, "depth": 0}
    paths = [get_delay_and_depth(inp, gates_by_id) for inp in inputs]
    max_delay = max([p["delay"] for p in paths] + [0.0])
    max_depth = max([p["depth"] for p in paths] + [0])
    return {"delay": max_delay + GATE_DELAYS.get(gt, 1.0), "depth": max_depth + 1}

def get_levels_for_node(node_id, gates_by_id, levels_cache):
    gate = gates_by_id.get(node_id)
    if not gate: return 0
    gt = gate.get("type", "").upper()
    if gt == "INPUT": return 0
    inputs = gate.get("inputs", [])
    if gt == "OUTPUT" or gt == "AND" and node_id.startswith("OUTPUT"):
        return get_levels_for_node(inputs[0], gates_by_id, levels_cache) if inputs else 0
    depths = [get_levels_for_node(inp, gates_by_id, levels_cache) for inp in inputs]
    my_depth = max(depths + [0]) + 1
    my_expr = get_expression(node_id, gates_by_id)
    if my_depth not in levels_cache: levels_cache[my_depth] = []
    if my_expr not in levels_cache[my_depth]:
        levels_cache[my_depth].append(my_expr)
    return my_depth

### AST Simplification ###
def build_ast(node_id, gates_by_id):
    gate = gates_by_id.get(node_id)
    if not gate: return ("VAR", _node_label(node_id))
    gt = gate.get("type", "").upper()
    inputs = gate.get("inputs", [])
    if gt == "OUTPUT" or gt == "AND" and node_id.startswith("OUTPUT"):
        return build_ast(inputs[0], gates_by_id) if inputs else ("CONST", False)
    if not inputs: return ("CONST", False)
    if gt == "NOT": return ("NOT", build_ast(inputs[0], gates_by_id))
    if len(inputs) == 1: return build_ast(inputs[0], gates_by_id)
    return (gt, build_ast(inputs[0], gates_by_id), build_ast(inputs[1], gates_by_id))

def format_ast(ast):
    if ast[0] == "VAR": return ast[1]
    if ast[0] == "CONST": return "1" if ast[1] else "0"
    if ast[0] == "NOT": return f"NOT({format_ast(ast[1])})"
    return f"({format_ast(ast[1])} {ast[0]} {format_ast(ast[2])})"

def apply_rules_global(ast, rule_log):
    if ast[0] in ("VAR", "CONST"): return ast, False
    if ast[0] == "NOT":
        new_inner, changed = apply_rules_global(ast[1], rule_log)
        if changed: return ("NOT", new_inner), True
    else:
        op, L, R = ast
        new_L, changed = apply_rules_global(L, rule_log)
        if changed: return (op, new_L, R), True
        new_R, changed = apply_rules_global(R, rule_log)
        if changed: return (op, L, new_R), True

    if ast[0] == "NOT" and ast[1][0] == "NOT":
        rule_log.append("NOT(NOT(A)) = A")
        return ast[1][1], True
    if ast[0] == "AND":
        L, R = ast[1], ast[2]
        if L == R:
            rule_log.append("A AND A = A")
            return L, True
        if L == ("CONST", False) or R == ("CONST", False):
            rule_log.append("A AND 0 = 0")
            return ("CONST", False), True
        if L == ("CONST", True):
            rule_log.append("1 AND A = A")
            return R, True
        if R == ("CONST", True):
            rule_log.append("A AND 1 = A")
            return L, True
        if (L[0] == "NOT" and L[1] == R) or (R[0] == "NOT" and R[1] == L):
            rule_log.append("A AND NOT(A) = 0")
            return ("CONST", False), True
    if ast[0] == "OR":
        L, R = ast[1], ast[2]
        if L == R:
            rule_log.append("A OR A = A")
            return L, True
        if L == ("CONST", True) or R == ("CONST", True):
            rule_log.append("A OR 1 = 1")
            return ("CONST", True), True
        if L == ("CONST", False):
            rule_log.append("0 OR A = A")
            return R, True
        if R == ("CONST", False):
            rule_log.append("A OR 0 = A")
            return L, True
        if (L[0] == "NOT" and L[1] == R) or (R[0] == "NOT" and R[1] == L):
            rule_log.append("A OR NOT(A) = 1")
            return ("CONST", True), True
    if ast[0] == "NOT":
        inner = ast[1]
        if inner[0] == "AND":
            rule_log.append("De Morgan's: NOT(A AND B) = NOT(A) OR NOT(B)")
            return ("OR", ("NOT", inner[1]), ("NOT", inner[2])), True
        if inner[0] == "OR":
            rule_log.append("De Morgan's: NOT(A OR B) = NOT(A) AND NOT(B)")
            return ("AND", ("NOT", inner[1]), ("NOT", inner[2])), True
    return ast, False

def analyze_simplification(node_id, gates_by_id):
    ast = build_ast(node_id, gates_by_id)
    original = format_ast(ast)
    steps = []
    curr = ast
    while True:
        rule_log = []
        new_ast, changed = apply_rules_global(curr, rule_log)
        if not changed: break
        curr = new_ast
        steps.append({"rule": rule_log[0], "expression": format_ast(curr)})
    return {"original": original, "steps": steps, "final": format_ast(curr), "is_minimal": len(steps) == 0}

def eval_system(gates, inputs_dict):
    values = {k: v for k, v in inputs_dict.items()}
    changed = True
    iterations = 0
    while changed and iterations < len(gates) + 1:
        changed = False
        iterations += 1
        for gate in gates:
            g_id = gate.get("id")
            g_type = gate.get("type", "").upper()
            g_inputs = gate.get("inputs", [])
            if all(inp in values for inp in g_inputs):
                res = evaluate_gate(g_type, [values[i] for i in g_inputs])
                if g_id not in values or values[g_id] != res:
                    values[g_id] = res
                    changed = True
    return values

@app.route("/api/evaluate", methods=["POST"])
def evaluate_circuit():
    return jsonify({"values": eval_system(request.json.get("gates", []), request.json.get("inputs", {}))})

@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.json
    input_nodes = data.get("inputs", [])
    gates = data.get("gates", [])
    output_nodes = data.get("outputs", [])
    gates_by_id = {g["id"]: g for g in gates}

    # 1. Metrics
    gate_breakdown = {}
    total_logic_gates = 0
    total_connections = 0
    for g in gates:
        gt = g.get("type", "").upper()
        if gt not in ("INPUT", "OUTPUT"):
            total_logic_gates += 1
            gate_breakdown[gt] = gate_breakdown.get(gt, 0) + 1
        total_connections += len(g.get("inputs", []))

    metrics = {
        "gateCount": total_logic_gates,
        "inputCount": len(input_nodes),
        "outputCount": len(output_nodes),
        "totalConnections": total_connections,
        "gateBreakdown": gate_breakdown,
        "maxDepth": 0,
        "propagationDelay": 0.0
    }

    if output_nodes:
        metrics["maxDepth"] = max(get_delay_and_depth(out, gates_by_id)["depth"] for out in output_nodes)
        metrics["propagationDelay"] = max(get_delay_and_depth(out, gates_by_id)["delay"] for out in output_nodes)

    # 2. Expressions and Levels and Simplification
    expressions = {}
    levels_data = {}
    simplifications = {}
    
    for out in output_nodes:
        expr = get_expression(out, gates_by_id)
        expressions[out] = expr
        
        l_cache = {}
        depth = get_levels_for_node(out, gates_by_id, l_cache)
        # Format levels output
        fmt_levels = [{"level": lvl, "formulas": l_cache[lvl]} for lvl in sorted(l_cache.keys())]
        fmt_levels.append({"level": "Output", "formulas": [expr]})
        levels_data[out] = fmt_levels
        
        simplifications[out] = analyze_simplification(out, gates_by_id)

    # 3. Truth Table
    headers = input_nodes + [g["id"] for g in gates if g["type"].upper() not in ("INPUT", "OUTPUT")] + output_nodes
    rows = []
    if input_nodes:
        for combo in itertools.product([False, True], repeat=len(input_nodes)):
            values = eval_system(gates, {node: val for node, val in zip(input_nodes, combo)})
            rows.append([values.get(n, False) for n in headers])

    return jsonify({
        "metrics": metrics,
        "expressions": expressions,
        "levels": levels_data,
        "simplifications": simplifications,
        "truth_table": {"headers": headers, "rows": rows}
    })

@app.route("/api/simulate_timing", methods=["POST"])
def simulate_timing():
    data = request.json
    clock_input = data.get("clock_input")
    num_cycles = data.get("num_cycles", 4)
    inputs_dict = data.get("current_inputs", {})
    gates = data.get("gates", [])
    
    num_steps = num_cycles * 2
    timeline = []
    
    for step in range(num_steps):
        # alternate clock
        inputs_dict[clock_input] = (step % 2 == 1)
        values = eval_system(gates, inputs_dict)
        timeline.append(values)
        
    return jsonify({"timeline": timeline})

@app.route("/api/circuits/save", methods=["POST"])
def save_circuit():
    data = request.json
    name = data.get("name")
    gates = data.get("gates", [])
    wires = data.get("wires", [])
    
    if not name:
        return jsonify({"error": "Circuit name is required"}), 400
        
    circuit = SavedCircuit(name=name, gates=gates, wires=wires)
    db.session.add(circuit)
    db.session.commit()
    
    return jsonify({"status": "success", "id": circuit.id, "name": circuit.name})

@app.route("/api/circuits", methods=["GET"])
def list_circuits():
    circuits = SavedCircuit.query.all()
    results = [{"id": c.id, "name": c.name} for c in circuits]
    return jsonify({"circuits": results})

@app.route("/api/circuits/<int:circuit_id>", methods=["GET"])
def get_circuit(circuit_id):
    circuit = SavedCircuit.query.get(circuit_id)
    if not circuit:
        return jsonify({"error": "Circuit not found"}), 404
        
    return jsonify({
        "id": circuit.id,
        "name": circuit.name,
        "gates": circuit.gates,
        "wires": circuit.wires
    })

if __name__ == "__main__":
    app.run(port=5000, debug=True)
