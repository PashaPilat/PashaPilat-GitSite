import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const THREE = require('three');

test('ring connectors support the first frame before passive effects run', () => {
  const source = readFileSync(new URL('../src/components/Other/OtherProjectsBackground.jsx', import.meta.url), 'utf8');
  const { code } = require('@babel/core').transformSync(source + '\nexport { RingConnectors };', {
    babelrc: false, configFile: false,
    presets: ['@babel/preset-react', ['@babel/preset-env', { targets: { node: 'current' } }]],
  });
  let frame;
  const react = {
    useMemo: factory => factory(),
    useEffect: () => {},
    createElement: (type, props) => ({ type, props }),
  };
  const context = { exports: {}, require: name => {
    if (name === 'react') return react;
    if (name === 'three') return THREE;
    if (name === '@react-three/fiber') return { useFrame: callback => { frame = callback; } };
    if (name.endsWith('.scss')) return {};
    throw new Error(name);
  } };
  vm.runInNewContext(code, context);
  const { props } = context.exports.RingConnectors();
  const position = props.geometry.getAttribute('position');
  assert.ok(position.count > 0);
  assert.equal(position.usage, THREE.DynamicDrawUsage);
  const camera = new THREE.PerspectiveCamera();
  assert.doesNotThrow(() => frame({ camera }));
  assert.ok(Array.from(position.array).every(Number.isFinite));
  assert.ok(Array.from(position.array).some(value => value !== 0));
  props.geometry.dispose();
  props.material.dispose();
});
