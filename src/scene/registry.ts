// Node type registry → lets a serialized tree (save file / prefab / snapshot)
// be rebuilt into live nodes. Built-in types register here; games can register
// custom node types the same way.

import { Node, type SerializedNode } from './node';
import { Sprite, Text, Camera2D, Timer } from './nodes';
import { AnimationPlayer } from './tween';

export type NodeFactory = () => Node;

const registry = new Map<string, NodeFactory>();

export function registerNode(type: string, factory: NodeFactory): void {
  registry.set(type, factory);
}

// Built-ins. Sprite/Text/Timer need required config, so provide safe defaults
// that applyProps() immediately overwrites during deserialization.
registerNode('Node', () => new Node());
registerNode('Sprite', () => new Sprite({ shape: { kind: 'rect', w: 1, h: 1 } }));
registerNode('Text', () => new Text({ text: '' }));
registerNode('Camera2D', () => new Camera2D());
registerNode('Timer', () => new Timer({ duration: 1 }));
registerNode('AnimationPlayer', () => new AnimationPlayer());

/** Rebuild a live node tree from serialized data. */
export function deserializeNode(data: SerializedNode): Node {
  const factory = registry.get(data.type);
  if (!factory) throw new Error(`hayao: unknown node type "${data.type}" (register it first)`);
  const node = factory();
  node.name = data.name;
  node.pos = { ...data.pos };
  node.rotation = data.rotation;
  node.scale = { ...data.scale };
  node.z = data.z;
  node.visible = data.visible;
  if (data.pivot) node.pivot = { ...data.pivot };
  // Base flags travel in props (only when non-default) — restore before subclass props.
  if (data.props.pauseMode === 'always' || data.props.pauseMode === 'stopped') node.pauseMode = data.props.pauseMode;
  if (data.props.screenSpace === true) node.screenSpace = true;
  node.applyProps(data.props);
  for (const child of data.children) node.addChild(deserializeNode(child));
  return node;
}
