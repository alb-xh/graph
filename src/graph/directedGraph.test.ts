import { DirectedGraph } from './directedGraph';
import { Edge } from './types';


describe('Directed graph', () => {;
  type Vertex = number;
  let graph: DirectedGraph<Vertex>;

  beforeEach(() => {
    graph = new DirectedGraph<Vertex>();
  });

  describe('Vertex', () => {
    it('Add vertex', () => {
      const vertices: Vertex[] = [ 1, 2 ];
      const existingVertex: Vertex = 1;
      const newVertex: Vertex = 5;
      const expectedVertices: Vertex[] = [ ...vertices, newVertex ];

      graph.vertices = vertices;

      expect(() => graph.addVertex(existingVertex)).toThrowError();

      const addToSet = jest.spyOn(graph.lwwSet, 'add');
      graph.addVertex(newVertex);

      expect(graph.vertices).toStrictEqual(expectedVertices);
      expect(addToSet).toHaveBeenCalledWith({ vertex: newVertex });
    });

    it('Remove vertex', () => {
      const vertices: Vertex[] = [ 1, 2, 3 ];
      const edges: Edge<Vertex>[] = [[ 1, 2 ], [ 3, 1] ];

      const nonExistantVertex: Vertex = 4;
      const vertexToRemove: Vertex = 2;
      const expectedVertices: Vertex[] = [ 1, 3 ];
      const expectedEdges: Edge<Vertex>[] = [[ 3, 1 ]];

      graph.vertices = vertices;
      graph.edges = edges;

      expect(() => graph.removeVertex(nonExistantVertex)).toThrowError();

      const removeFromSet = jest.spyOn(graph.lwwSet, 'remove');
      graph.removeVertex(vertexToRemove);

      expect(graph.vertices).toStrictEqual(expectedVertices);
      expect(graph.edges).toStrictEqual(expectedEdges);

      expect(removeFromSet).toHaveBeenCalledTimes(2);
      expect(removeFromSet).toHaveBeenNthCalledWith(1, { vertex: vertexToRemove });
      expect(removeFromSet).toHaveBeenNthCalledWith(2, { edge: [ 1, 2 ] });
    });

    it('Vertex exists', () => {
      const vertices: Vertex[] = [ 1, 6, 9 ];
      const existantVertex: Vertex = 6;
      const nonExistantVertex: Vertex = 10;

      graph.vertices = vertices;

      expect(graph.vertexExists(existantVertex)).toStrictEqual(true);
      expect(graph.vertexExists(nonExistantVertex)).toStrictEqual(false);
    });

    it('Get all directly connected vertices', () => {
      const vertices: Vertex[] = [ 1, 2, 3, 4 ];
      const edges: Edge<Vertex>[] = [ [1, 2], [2, 1], [2, 3], [3, 4] ];

      const connectorVertex: Vertex = 3;
      const expectedVertices: Vertex[] = [ 4, 2 ];

      graph.vertices = vertices;
      graph.edges = edges;

      expect(graph.getDirectlyConnectedVertices(connectorVertex)).toStrictEqual(expectedVertices);
    });

    it('Get all connected vertices', () => {
      const vertices: Vertex[] = [ 1, 2, 3, 4, 5 ];
      const edges: Edge<Vertex>[] = [ [1, 2], [2, 1], [2, 3], [3, 1], [5, 4] ];

      const connectorVertex: Vertex = 2;
      const expectedVertices: Vertex[] = [ 1, 3 ];

      graph.vertices = vertices;
      graph.edges = edges;

      expect(graph.getConnectedVertices(connectorVertex)).toStrictEqual(expectedVertices);
    });

    it('Get path between vertices', () => {
      const vertices: Vertex[] = [ 1, 2, 3, 4 ];
      const edges: Edge<Vertex>[] = [ [1, 2], [ 1, 4],  [2, 3], [2, 4], [3, 4] ];

      const fromVertex: Vertex = 1;
      const toVertex: Vertex = 4;
      const expectedVertices: Vertex[][] = [
        [1, 4],
        [1, 2, 4],
        [1, 2, 3, 4],
      ];

      graph.vertices = vertices;
      graph.edges = edges;

      const paths = graph.getPathsBetweenVertices(fromVertex, toVertex)
        .sort((a, b) => a.length - b.length);

      expect(paths).toStrictEqual(expectedVertices);
    });
  });

  describe('Edge', () => {
    it('Add edge', () => {
      const vertices: Vertex[] = [ 1, 2, 3 ];
      const edgesWithAtLeastOneNonExistentVertex: Edge<Vertex>[] = [
        [ 1, 4 ],
        [ 5, 2 ],
        [ 6, 7 ],
      ];

      graph.vertices = vertices;
      graph.edges = edgesWithAtLeastOneNonExistentVertex;

      edgesWithAtLeastOneNonExistentVertex.forEach(([ v1, v2 ]) => {
        expect(() => graph.addEdge(v1, v2)).toThrowError();
      });

      const edge: Edge<Vertex> = [ 1, 2 ];

      graph.vertices = vertices;
      graph.edges = [ edge ];

      expect(() => graph.addEdge(...edge)).toThrowError();

      const newEdge: Edge<Vertex> = [ 2, 1 ];
      const expectedEdges: Edge<Vertex>[] = [ newEdge ]

      graph.vertices = vertices;
      graph.edges = [];

      const addToSet = jest.spyOn(graph.lwwSet, 'add');
      graph.addEdge(...newEdge);

      expect(graph.edges).toStrictEqual(expectedEdges);
      expect(addToSet).toHaveBeenCalledWith({ edge: newEdge });
    });

    it('Remove edge', () => {
      const vertices: Vertex[] = [ 1, 2, 3 ];
      const edges: Edge<Vertex>[] = [[ 1, 2 ], [ 3, 1 ], [ 2, 3 ]];

      const nonExistantEdge: Edge<Vertex> = [ 4, 5];
      const existantEdge: Edge<Vertex> = [ 1, 2 ];
      const expectedEdges: Edge<Vertex>[] = [ [ 3, 1], [ 2, 3 ] ];

      graph.vertices = vertices;
      graph.edges = edges;

      expect(() => graph.removeEdge(...nonExistantEdge)).toThrowError();

      const removeFromSet = jest.spyOn(graph.lwwSet, 'remove');
      graph.removeEdge(...existantEdge);

      expect(graph.edges).toStrictEqual(expectedEdges);
      expect(removeFromSet).toHaveBeenCalledWith({ edge: existantEdge });
    });

    it('Edge exists', () => {
      const vertices: Vertex[] = [ 1, 6, 9 ];
      const edges: Edge<Vertex>[] = [[ 1, 6 ]];
      const existantEdge: Edge<Vertex> = [ 1, 6 ];
      const nonExistantEdge: Edge<Vertex> = [ 6, 9 ];

      graph.vertices = vertices;
      graph.edges = edges;

      expect(graph.edgeExists(...existantEdge)).toStrictEqual(true);
      expect(graph.edgeExists(...nonExistantEdge)).toStrictEqual(false);
    });
  });

  it('Merge', () => {
    graph.addVertex(1);
    graph.addVertex(2);
    graph.addVertex(3);
    graph.addEdge(1, 2);
    graph.removeVertex(3);

    const graph2 = new DirectedGraph<Vertex>();

    graph2.addVertex(1);
    graph2.addVertex(2);
    graph2.addVertex(3);
    graph2.addVertex(4);
    graph2.addVertex(5);
    graph2.addEdge(1, 2);
    graph2.addEdge(4, 5);
    graph2.removeVertex(3);
    graph2.removeEdge(1, 2);

    const expectedVertices: Vertex[] = [ 1, 2, 4, 5 ];
    const expectedEdges: Edge<Vertex>[] = [[4, 5]];

    const mergeSet = jest.spyOn(graph.lwwSet, 'merge');
    graph.merge(graph2);

    expect(graph.vertices).toStrictEqual(expectedVertices);
    expect(graph.edges).toStrictEqual(expectedEdges);
    expect(mergeSet).toHaveBeenCalledWith(graph2.lwwSet);
  });
});
