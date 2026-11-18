const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, 'test_files');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// 1. Plain text invalid
fs.writeFileSync(path.join(testDir, 'test_invalid_text.json'), 'Halo dunia, ini bukan format JSON!', 'utf8');

// 2. Wrong format identifier
fs.writeFileSync(path.join(testDir, 'test_invalid_format.json'), JSON.stringify({
  format: 'random-app-format',
  version: 1,
  data: { components: [] }
}, null, 2), 'utf8');

// 3. Cable pointing to non-existent component
fs.writeFileSync(path.join(testDir, 'test_invalid_missing_comp.json'), JSON.stringify({
  format: 'electropneusim-project',
  version: 1,
  savedAt: '2026-11-18T12:00:00Z',
  appName: 'Pneulab',
  data: {
    components: [
      {
        id: 'comp_real_1',
        defId: 'cylinder-single',
        name: 'Silinder Kerja Tunggal',
        x: 200,
        y: 150,
        label: 'A1',
        ports: [{ name: '1', portNumber: 1, type: 'pneumatic', side: 'bottom', offset: 0.5 }]
      }
    ],
    connections: [
      {
        id: 'conn_bad_1',
        type: 'pneumatic',
        sourceType: 'port',
        sourceCompId: 'comp_ghost_999', // NON EXISTENT
        sourcePortNum: 1,
        targetType: 'port',
        targetCompId: 'comp_real_1',
        targetPortNum: 1
      }
    ],
    junctions: []
  }
}, null, 2), 'utf8');

// 4. Legacy format (raw v1.0 without 'format' wrapper, like old localStorage saves)
fs.writeFileSync(path.join(testDir, 'test_legacy_format.json'), JSON.stringify({
  version: '1.0',
  timestamp: '2026-11-17T08:30:00Z',
  components: [
    {
      id: 'comp_leg_1',
      defId: 'dc-source',
      name: 'Sumber Tegangan +24V',
      x: 100,
      y: 100,
      width: 50,
      height: 40,
      label: '24V',
      rotation: 0,
      ports: [{ name: '+24V', portNumber: 1, type: 'electrical', side: 'top', offset: 0.5 }]
    },
    {
      id: 'comp_leg_2',
      defId: 'relay-coil',
      name: 'Relay Coil',
      x: 100,
      y: 250,
      width: 50,
      height: 60,
      label: 'K1',
      rotation: 0,
      ports: [
        { name: 'A1', portNumber: 1, type: 'electrical', side: 'top', offset: 0.5 },
        { name: 'A2', portNumber: 2, type: 'electrical', side: 'bottom', offset: 0.5 }
      ]
    }
  ],
  connections: [
    {
      id: 'conn_leg_1',
      type: 'electrical',
      sourceType: 'port',
      sourceCompId: 'comp_leg_1',
      sourcePortNum: 1,
      targetType: 'port',
      targetCompId: 'comp_leg_2',
      targetPortNum: 1
    }
  ],
  junctions: []
}, null, 2), 'utf8');

console.log('Sample test files created successfully in test_files/');
