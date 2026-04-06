export const PREBUILT_CIRCUITS = {
  HALF_ADDER: {
    name: "Half Adder",
    gates: [
      { id: 'INPUT_A', type: 'INPUT', x: 50, y: 100, inputs: 0 },
      { id: 'INPUT_B', type: 'INPUT', x: 50, y: 200, inputs: 0 },
      { id: 'XOR_1', type: 'XOR', x: 250, y: 100, inputs: 2 },
      { id: 'AND_1', type: 'AND', x: 250, y: 250, inputs: 2 },
      { id: 'OUTPUT_SUM', type: 'OUTPUT', x: 500, y: 100, inputs: 1 },
      { id: 'OUTPUT_CARRY', type: 'OUTPUT', x: 500, y: 250, inputs: 1 }
    ],
    wires: [
      { id: 'w_1', from: 'INPUT_A', fromPort: 0, to: 'XOR_1', toPort: 0 },
      { id: 'w_2', from: 'INPUT_B', fromPort: 0, to: 'XOR_1', toPort: 1 },
      { id: 'w_3', from: 'XOR_1', fromPort: 0, to: 'OUTPUT_SUM', toPort: 0 },
      { id: 'w_4', from: 'INPUT_A', fromPort: 0, to: 'AND_1', toPort: 0 },
      { id: 'w_5', from: 'INPUT_B', fromPort: 0, to: 'AND_1', toPort: 1 },
      { id: 'w_6', from: 'AND_1', fromPort: 0, to: 'OUTPUT_CARRY', toPort: 0 }
    ]
  },
  FULL_ADDER: {
    name: "Full Adder",
    gates: [
      { id: 'INPUT_A', type: 'INPUT', x: 50, y: 50, inputs: 0 },
      { id: 'INPUT_B', type: 'INPUT', x: 50, y: 150, inputs: 0 },
      { id: 'INPUT_Cin', type: 'INPUT', x: 50, y: 300, inputs: 0 },
      { id: 'XOR_1', type: 'XOR', x: 250, y: 100, inputs: 2 },
      { id: 'AND_1', type: 'AND', x: 250, y: 200, inputs: 2 },
      { id: 'XOR_2', type: 'XOR', x: 450, y: 150, inputs: 2 },
      { id: 'AND_2', type: 'AND', x: 450, y: 250, inputs: 2 },
      { id: 'OR_1', type: 'OR', x: 650, y: 220, inputs: 2 },
      { id: 'OUTPUT_SUM', type: 'OUTPUT', x: 750, y: 150, inputs: 1 },
      { id: 'OUTPUT_CARRY', type: 'OUTPUT', x: 750, y: 220, inputs: 1 }
    ],
    wires: [
      { id: 'w_1', from: 'INPUT_A', fromPort: 0, to: 'XOR_1', toPort: 0 },
      { id: 'w_2', from: 'INPUT_B', fromPort: 0, to: 'XOR_1', toPort: 1 },
      { id: 'w_3', from: 'INPUT_A', fromPort: 0, to: 'AND_1', toPort: 0 },
      { id: 'w_4', from: 'INPUT_B', fromPort: 0, to: 'AND_1', toPort: 1 },
      { id: 'w_5', from: 'XOR_1', fromPort: 0, to: 'XOR_2', toPort: 0 },
      { id: 'w_6', from: 'INPUT_Cin', fromPort: 0, to: 'XOR_2', toPort: 1 },
      { id: 'w_7', from: 'XOR_1', fromPort: 0, to: 'AND_2', toPort: 0 },
      { id: 'w_8', from: 'INPUT_Cin', fromPort: 0, to: 'AND_2', toPort: 1 },
      { id: 'w_9', from: 'AND_1', fromPort: 0, to: 'OR_1', toPort: 0 },
      { id: 'w_10', from: 'AND_2', fromPort: 0, to: 'OR_1', toPort: 1 },
      { id: 'w_11', from: 'XOR_2', fromPort: 0, to: 'OUTPUT_SUM', toPort: 0 },
      { id: 'w_12', from: 'OR_1', fromPort: 0, to: 'OUTPUT_CARRY', toPort: 0 }
    ]
  },
  MUX_2TO1: {
    name: "2-to-1 Multiplexer",
    gates: [
      { id: 'INPUT_D0', type: 'INPUT', x: 50, y: 50, inputs: 0 },
      { id: 'INPUT_SEL', type: 'INPUT', x: 50, y: 150, inputs: 0 },
      { id: 'INPUT_D1', type: 'INPUT', x: 50, y: 250, inputs: 0 },
      { id: 'NOT_1', type: 'NOT', x: 200, y: 150, inputs: 1 },
      { id: 'AND_1', type: 'AND', x: 350, y: 65, inputs: 2 },
      { id: 'AND_2', type: 'AND', x: 350, y: 235, inputs: 2 },
      { id: 'OR_1', type: 'OR', x: 550, y: 150, inputs: 2 },
      { id: 'OUTPUT_Y', type: 'OUTPUT', x: 750, y: 150, inputs: 1 }
    ],
    wires: [
      { id: 'w_1', from: 'INPUT_D0', fromPort: 0, to: 'AND_1', toPort: 0 },
      { id: 'w_2', from: 'INPUT_SEL', fromPort: 0, to: 'NOT_1', toPort: 0 },
      { id: 'w_3', from: 'NOT_1', fromPort: 0, to: 'AND_1', toPort: 1 },
      { id: 'w_4', from: 'INPUT_SEL', fromPort: 0, to: 'AND_2', toPort: 0 },
      { id: 'w_5', from: 'INPUT_D1', fromPort: 0, to: 'AND_2', toPort: 1 },
      { id: 'w_6', from: 'AND_1', fromPort: 0, to: 'OR_1', toPort: 0 },
      { id: 'w_7', from: 'AND_2', fromPort: 0, to: 'OR_1', toPort: 1 },
      { id: 'w_8', from: 'OR_1', fromPort: 0, to: 'OUTPUT_Y', toPort: 0 }
    ]
  },
  SR_LATCH: {
    name: "SR Latch (NOR)",
    gates: [
      { id: 'INPUT_R', type: 'INPUT', x: 50, y: 100, inputs: 0 },
      { id: 'INPUT_S', type: 'INPUT', x: 50, y: 250, inputs: 0 },
      { id: 'NOR_1', type: 'NOR', x: 250, y: 100, inputs: 2 },
      { id: 'NOR_2', type: 'NOR', x: 250, y: 250, inputs: 2 },
      { id: 'OUTPUT_Q', type: 'OUTPUT', x: 450, y: 100, inputs: 1 },
      { id: 'OUTPUT_Q_BAR', type: 'OUTPUT', x: 450, y: 250, inputs: 1 }
    ],
    wires: [
      { id: 'w_1', from: 'INPUT_R', fromPort: 0, to: 'NOR_1', toPort: 0 },
      { id: 'w_2', from: 'INPUT_S', fromPort: 0, to: 'NOR_2', toPort: 1 },
      { id: 'w_3', from: 'NOR_2', fromPort: 0, to: 'NOR_1', toPort: 1 },
      { id: 'w_4', from: 'NOR_1', fromPort: 0, to: 'NOR_2', toPort: 0 },
      { id: 'w_5', from: 'NOR_1', fromPort: 0, to: 'OUTPUT_Q', toPort: 0 },
      { id: 'w_6', from: 'NOR_2', fromPort: 0, to: 'OUTPUT_Q_BAR', toPort: 0 }
    ]
  },
  AND_CHAIN: {
    name: "4-Input AND Chain",
    gates: [
      { id: 'INPUT_A', type: 'INPUT', x: 50, y: 50, inputs: 0 },
      { id: 'INPUT_B', type: 'INPUT', x: 50, y: 150, inputs: 0 },
      { id: 'INPUT_C', type: 'INPUT', x: 50, y: 250, inputs: 0 },
      { id: 'INPUT_D', type: 'INPUT', x: 50, y: 350, inputs: 0 },
      { id: 'AND_1', type: 'AND', x: 250, y: 100, inputs: 2 },
      { id: 'AND_2', type: 'AND', x: 450, y: 180, inputs: 2 },
      { id: 'AND_3', type: 'AND', x: 650, y: 260, inputs: 2 },
      { id: 'OUTPUT_Y', type: 'OUTPUT', x: 800, y: 260, inputs: 1 }
    ],
    wires: [
      { id: 'w_1', from: 'INPUT_A', fromPort: 0, to: 'AND_1', toPort: 0 },
      { id: 'w_2', from: 'INPUT_B', fromPort: 0, to: 'AND_1', toPort: 1 },
      { id: 'w_3', from: 'AND_1', fromPort: 0, to: 'AND_2', toPort: 0 },
      { id: 'w_4', from: 'INPUT_C', fromPort: 0, to: 'AND_2', toPort: 1 },
      { id: 'w_5', from: 'AND_2', fromPort: 0, to: 'AND_3', toPort: 0 },
      { id: 'w_6', from: 'INPUT_D', fromPort: 0, to: 'AND_3', toPort: 1 },
      { id: 'w_7', from: 'AND_3', fromPort: 0, to: 'OUTPUT_Y', toPort: 0 }
    ]
  },
  XNOR_BASIC: {
    name: "XNOR (from basic gates)",
    gates: [
      { id: 'INPUT_A', type: 'INPUT', x: 50, y: 100, inputs: 0 },
      { id: 'INPUT_B', type: 'INPUT', x: 50, y: 250, inputs: 0 },
      { id: 'NOT_1', type: 'NOT', x: 250, y: 50, inputs: 1 },
      { id: 'NOT_2', type: 'NOT', x: 250, y: 300, inputs: 1 },
      { id: 'AND_1', type: 'AND', x: 450, y: 100, inputs: 2 },
      { id: 'AND_2', type: 'AND', x: 450, y: 250, inputs: 2 },
      { id: 'OR_1', type: 'OR', x: 650, y: 175, inputs: 2 },
      { id: 'OUTPUT_Y', type: 'OUTPUT', x: 800, y: 175, inputs: 1 }
    ],
    wires: [
      { id: 'w_1', from: 'INPUT_A', fromPort: 0, to: 'NOT_1', toPort: 0 },
      { id: 'w_2', from: 'INPUT_B', fromPort: 0, to: 'NOT_2', toPort: 0 },
      { id: 'w_3', from: 'INPUT_A', fromPort: 0, to: 'AND_1', toPort: 0 },
      { id: 'w_4', from: 'INPUT_B', fromPort: 0, to: 'AND_1', toPort: 1 },
      { id: 'w_5', from: 'NOT_1', fromPort: 0, to: 'AND_2', toPort: 0 },
      { id: 'w_6', from: 'NOT_2', fromPort: 0, to: 'AND_2', toPort: 1 },
      { id: 'w_7', from: 'AND_1', fromPort: 0, to: 'OR_1', toPort: 0 },
      { id: 'w_8', from: 'AND_2', fromPort: 0, to: 'OR_1', toPort: 1 },
      { id: 'w_9', from: 'OR_1', fromPort: 0, to: 'OUTPUT_Y', toPort: 0 }
    ]
  }
};
