# CircuitForge Educational Workspace

CircuitForge is a professional-grade educational web application designed for simulating, building, and analyzing digital logic circuits. It provides an intuitive, interactive frontend for circuit design and a powerful Python backend to evaluate and analyze circuit behavior, performance metrics, and boolean logic expressions.

## Features

* **Interactive Circuit Builder:** A drag-and-drop visual workspace to build logic circuits using standard digital gates (AND, OR, NOT, NAND, NOR, XOR).
* **Circuit Analytics & Truth Tables:** Automatically generates complete truth tables for your custom circuit and calculates gate depth and propagation delay.
* **Boolean Expression Simplification:** Applies Boolean algebra rule simplification to minimize circuit expressions.
* **Timing & Waveform Simulation:** Visualize the timing of your circuits over multiple clock cycles.
* **Component Library:** Built-in standard components with pre-designed sub-circuits (e.g., Half Adders, Multiplexers, etc.).

## Tech Stack

**Frontend:**
* React + Vite
* `react-konva` for high-performance canvas-based interactions
* `lucide-react` for beautiful iconography
* Modern CSS tailored for a premium, dark-themed UI aesthetic

**Backend:**
* Python Flask
* Custom AST (Abstract Syntax Tree) engine for boolean simplification
* Graph-based metric calculations for delay, depth, and logic levels

## Getting Started

### Prerequisites
* Node.js (v18+)
* Python 3.8+

### Setup Local Environment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Mehul-37/cp_project.git
   cd cp_project
   ```

2. **Start the backend server:**
   ```bash
   cd backend
   python -m venv venv
   source venv/Scripts/activate # On macOS/Linux use `source venv/bin/activate`
   pip install -r requirements.txt
   python app.py
   ```
   *The backend API will run on `http://127.0.0.1:5000/`*

3. **Start the frontend development server:**
   Open a new terminal window or tab and run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *The frontend application will be available at `http://localhost:5173/`*

## How it works
The React frontend handles the visual aspect, where users add logic gates into a layout and connect them. When the user initiates a simulation or analyzes the circuit, the structural representation (nodes, gates, and connections) is sent to the Python Flask backend. The backend reconstructs the circuit graph, generates abstract syntax trees, and performs metrics evaluation, eventually returning the simplifications, delays, and truth tables back to the user interface.

## License

This project is open-sourced and available under the [MIT License](LICENSE).
