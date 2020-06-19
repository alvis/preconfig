/*
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   A template resolver
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2020 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

import { ast } from '#ast';
import { resolver } from '#resolvers';
import { parse } from '#io';

import type { AbstractSyntaxTree, Node } from '#ast';
import type { Context } from '#resolvers';

/** options for Template */
export interface TemplateOptions {
  /** current working directory for resolving file statements */
  cwd: string;
}

/** a template resolver */
export class Template {
  /** options for template resolution */
  private options: TemplateOptions;

  /** the ast of the template string to be resolved */
  private ast: AbstractSyntaxTree;

  /**
   * construct a resolver
   * @param template template string to be resolver
   * @param options options for template resolution
   * @param options.cwd current working directory for resolving file
   */
  constructor(template: string, options?: Partial<TemplateOptions>) {
    this.ast = ast(template);

    this.options = {
      cwd: process.cwd(),
      ...options,
    };
  }

  /**
   * resolve the supplied template with the given variables
   * @param parameter key/value pairs of variables to be substituted in the template
   * @returns resolved template
   */
  public async resolve(parameter: Record<string, string>): Promise<string> {
    let self = parse(this.ast.content);

    let leafCount = this.countLeaf(this.ast.nodes);

    let nodes = await this.reduceNodes(this.ast.nodes, {
      cwd: this.options.cwd,
      parameter,
      self,
    });

    // loop the resolution process until the tree cannot shrink further more
    while (nodes.length > 1 && leafCount !== this.countLeaf(nodes)) {
      self = parse(this.stringify(nodes, true));
      leafCount = this.countLeaf(nodes);
      nodes = await this.reduceNodes(nodes, {
        cwd: this.options.cwd,
        parameter,
        self,
      });
    }

    const resolved = this.stringify(nodes);

    if (resolved === null) {
      const list = nodes
        .filter((node) => node.type !== 'literal')
        .map((node) => `- ${node.segment}`)
        .join('\n');

      throw new ReferenceError(`unresolvable references:\n${list}`);
    } else {
      return resolved;
    }
  }

  /**
   * count the number of leafs in an abstract syntax tree
   * @param nodes the abstract syntax tree to be counted
   * @returns the total number of leafs in the tree
   */
  private countLeaf(nodes: Node[]): number {
    return (
      nodes.length + // direct leafs
      nodes.reduce(
        (accumulated, node) =>
          accumulated +
          (node.arguments // leafs in arguments
            ?.map((argument) => this.countLeaf(argument))
            .reduce((total, current) => total + current, 0) ?? 0) +
          (node.path ? this.countLeaf(node.path) : 0), // leafs in path
        0,
      )
    );
  }

  /**
   * try to resolve a node with the given context
   * @param node node to be parsed
   * @param context additional information aiding the node resolution
   * @returns resolved nodes
   */
  private async reduceNode(node: Node, context: Context): Promise<Node> {
    const args = node.arguments
      ? await Promise.all(
          node.arguments.map(async (argument) =>
            this.stringify(await this.reduceNodes(argument, context)),
          ),
        )
      : undefined;
    const resolvedArgs = args?.filter(
      (arg): arg is string => typeof arg === 'string',
    );

    const path = node.path
      ? this.stringify(await this.reduceNodes(node.path, context))
      : undefined;

    if (node.type === 'literal' || args?.includes(null) || path === null) {
      // pass on when things are unresolvable
      return node;
    }

    // try to call one of the resolve_ function
    const segment = await resolver[node.type]?.(
      { ...node, arguments: resolvedArgs, path },
      context,
    );

    return segment
      ? {
          type: 'literal',
          segment,
          arguments: undefined,
          path: undefined,
        }
      : node;
  }

  /**
   * try to resolve nodes given the context
   * @param nodes nodes to be resolved
   * @param context additional information aiding the node resolution
   * @returns resolved nodes and some metadata about the result
   */
  private async reduceNodes(nodes: Node[], context: Context): Promise<Node[]> {
    // NOTE some nodes may not be resolved as they have self referenced node
    const processed = await Promise.all(
      nodes.map(async (node) => this.reduceNode(node, context)),
    );

    return processed.reduce<Node[]>((nodes, current) => {
      const previous = nodes.length ? nodes[nodes.length - 1] : current;

      if (
        previous !== current &&
        previous.type === 'literal' &&
        current.type === 'literal'
      ) {
        // squash two literal nodes into one
        nodes[nodes.length - 1].segment = previous.segment + current.segment;
      } else {
        nodes.push(current);
      }

      return nodes;
    }, []);
  }

  /**
   * join node segments into one string
   * @param nodes nodes to be joined together
   * @param force forbid returning null even some nodes are unresolved
   * @returns joined segment or null
   */
  private stringify(nodes: Node[], force?: false): string | null;
  private stringify(nodes: Node[], force: true): string;
  private stringify(nodes: Node[], force = false): string | null {
    return force || nodes.every((node) => node.type === 'literal')
      ? nodes.map((node) => node.segment).join('')
      : null;
  }
}
