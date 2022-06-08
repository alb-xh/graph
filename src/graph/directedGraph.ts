import _ from 'lodash';

import { LWWSet } from '../lwwSet';
import { Edge } from './types';


export class DirectedGraph<Vertex> {
  public vertices: Vertex[];
  public edges: Edge<Vertex>[];
  public lwwSet: LWWSet;

  constructor () {
    this.lwwSet = new LWWSet();
    this.vertices = [];
    this.edges = [];
  }

  private isSameVertex (vertex1: Vertex, vertex2: Vertex): Boolean {
    return  _.isEqual(vertex1, vertex2)
  }

  private isSameEdge (edge1: Edge<Vertex>, edge2: Edge<Vertex>): Boolean {
    const [ e1V1, e1V2 ] = edge1;
    const [ e2V1, e2V2 ] = edge2;

    return this.isSameVertex(e1V1, e2V1) && this.isSameVertex(e1V2, e2V2);
  }

  private edgeIncludesVertex (edge: Edge<Vertex>, vertex: Vertex): Boolean {
    const [ v1, v2 ] = edge;
    return this.isSameVertex(v1, vertex) || this.isSameVertex(v2, vertex);
  }

  private addNewVertex (vertex: Vertex): void {
    this.vertices.push(vertex);
    this.lwwSet.add({ vertex });
  }

  private addNewEdge (edge: Edge<Vertex>): void {
    this.edges.push(edge);
    this.lwwSet.add({ edge });
  }

  private removeTheVertex (vertex: Vertex): void {
    this.vertices = this.vertices.filter((v) => !this.isSameVertex(v, vertex));
    this.lwwSet.remove({ vertex });
  }

  private removeTheEdge (edge: Edge<Vertex>): void {
    this.edges = this.edges.filter((e) => !this.isSameEdge(e, edge));
    this.lwwSet.remove({ edge });
  }

  vertexExists (vertex: Vertex): Boolean {
    return this.vertices.some((v) => this.isSameVertex(v, vertex));
  }

  edgeExists (vertex1: Vertex, vertex2: Vertex): Boolean {
    return this.edges.some((edge) => this.isSameEdge(edge, [ vertex1, vertex2 ]));
  }

  addVertex (vertex: Vertex): void {
    if (this.vertexExists(vertex)) throw new Error(`Vertex ${vertex} already exists!`);
    this.addNewVertex(vertex);
  }

  addEdge (vertex1: Vertex, vertex2: Vertex): void {
    const vertex1Missing = !this.vertexExists(vertex1);
    const vertex2Missing = !this.vertexExists(vertex2);

    if (vertex1Missing || vertex2Missing) {
      if (vertex1Missing && vertex2Missing) throw new Error(`Vertex ${vertex1Missing}, ${vertex2Missing} don't exist!`);
      throw new Error(`Vertex ${vertex1Missing || vertex2Missing} doesn't exist!`);
    }

    if (this.edgeExists(vertex1, vertex2)) throw new Error(`Edge ${vertex1},${vertex2} already exists!`);
    this.addNewEdge([ vertex1, vertex2 ]);
  }

  removeEdge (vertex1: Vertex, vertex2: Vertex): void {
    const edgeMissing = !this.edgeExists(vertex1, vertex2);
    if (edgeMissing) throw new Error(`Edge ${vertex1},${vertex2} doesn't exist!`);;

    this.removeTheEdge([ vertex1, vertex2 ]);
  }

  removeVertex (vertex: Vertex): void {
    if (!this.vertexExists(vertex)) throw new Error(`Vertex ${vertex} doesn't exist!`);
    this.removeTheVertex(vertex);

    const edgesToRemove = this.edges.filter((edge) => this.edgeIncludesVertex(edge, vertex));
    edgesToRemove.forEach((edge) => {
      this.removeTheEdge(edge);
    });
  }

  private getOutgoingVertexEdges (vertex: Vertex) : Edge<Vertex>[] {
    const outgoingEdges = this.edges.filter(([ v1 ]) => this.isSameVertex(v1, vertex));
    return outgoingEdges;
  }

  private getIncomingVertexEdges (vertex: Vertex) : Edge<Vertex>[] {
    const incomingEdges = this.edges.filter(([ v1, v2 ]) => this.isSameVertex(v2, vertex));
    return incomingEdges;
  }

  private getVertexEdges (vertex: Vertex) : Edge<Vertex>[] {
    const edges = _.uniq([ ...this.getOutgoingVertexEdges(vertex), ...this.getIncomingVertexEdges(vertex) ]);
    return edges;
  }

  private getDireclyConnectedOutgoingVertices (vertex: Vertex): Vertex[] {
    const outgoingEdges = this.getOutgoingVertexEdges(vertex);
    const vertices = outgoingEdges.map(([ incomingVertex, outgoingVertex ]) => outgoingVertex);

    return vertices;
  }

  private getDireclyConnectedIncomingVertices (vertex: Vertex): Vertex[] {
    const incomingEdges = this.getIncomingVertexEdges(vertex);
    const vertices = incomingEdges.map(([ incomingVertex ]) => incomingVertex);

    return vertices;
  }

  getDirectlyConnectedVertices (vertex: Vertex): Vertex[] {
    const connectedVertices = _.uniq([
      ...this.getDireclyConnectedOutgoingVertices(vertex),
      ...this.getDireclyConnectedIncomingVertices(vertex),
    ]);

    return connectedVertices;
  }

  private getConnectedVerticesByMethod (
    method: 'getDirectlyConnectedVertices' | 'getDireclyConnectedOutgoingVertices' | 'getDireclyConnectedIncomingVertices',
    vertex: Vertex,
  ): Vertex[] {
    const getDireclyConnectedVertices = this[method].bind(this);
    const connectedVertices = getDireclyConnectedVertices(vertex);

    for (let newVertex of connectedVertices) {
      const newConnectedVertices = _.differenceWith(
        getDireclyConnectedVertices(newVertex),
        [ vertex, ...connectedVertices ],
        _.isEqual,
      );

      connectedVertices.push(...newConnectedVertices);
    }

    return connectedVertices;
  }

  private getOutgoingConnectedVertices (vertex: Vertex): Vertex[] {
    return this.getConnectedVerticesByMethod('getDireclyConnectedOutgoingVertices', vertex);
  }

  private getIncomingConnectedVertices (vertex: Vertex): Vertex[] {
    return this.getConnectedVerticesByMethod('getDireclyConnectedIncomingVertices', vertex);
  }

  getConnectedVertices (vertex: Vertex): Vertex[] {
    const connectedVertices = this.getConnectedVerticesByMethod('getDirectlyConnectedVertices', vertex);
    return connectedVertices;
  }

  getPathsBetweenVertices (vertex1: Vertex, vertex2: Vertex) {
    const connectedVertices = this.getOutgoingConnectedVertices(vertex1);

    const paths: Vertex[][] = [];
    const findPaths = (vertex: Vertex, path: Vertex[] = []) => {
      if (this.isSameVertex(vertex, vertex2)) {
        paths.push([ ...path, vertex ]);
        return;
      }

      const newConnectedVertices = this.getDireclyConnectedOutgoingVertices(vertex)
        .filter((v) => (
          connectedVertices.some((v2) => this.isSameVertex(v, v2))
          && path.every((v2) => !this.isSameVertex(v, v2))
        ));

      newConnectedVertices.forEach((v) => {
        findPaths(v, [ ...path, vertex ]);
      });
    };

    findPaths(vertex1);
    return paths;
  }

  merge (otherGraph: DirectedGraph<Vertex>) {
    this.lwwSet.merge(otherGraph.lwwSet);
    const values = this.lwwSet.get() as { vertex: Vertex, edge: Edge<Vertex> }[];

    const vertices = values.map(({ vertex }) => vertex).filter(Boolean);
    const edges = values.map(({ edge }) => edge).filter(Boolean);

    this.vertices = vertices;
    this.edges = edges;
  }
}
