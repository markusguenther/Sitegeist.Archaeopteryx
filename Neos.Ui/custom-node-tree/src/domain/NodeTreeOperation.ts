import {ActionType} from 'typesafe-actions';
import {VError} from 'verror';

import {q, INode, INodePartialForTree, INodeTypesRegistry, NodeTypeName, ContextPath, INeosContextProperties} from '@sitegeist/archaeopteryx-neos-bridge';

import * as actions from './NodeTreeAction';
import {INodeTreeState} from './NodeTreeState';
import {isNodeFullyLoaded} from './NodeTreeQuery';

interface Store {
    state: INodeTreeState
    dispatch(action: ActionType<typeof actions>): void
}

export async function loadNodeTreeFromUiState(
    {dispatch}: Store,
    nodeTypesRegistry: INodeTypesRegistry,
    neos: INeosContextProperties,
    nodeTreeConfiguration: {
        rootNodeContextPath: ContextPath,
        baseNodeTypeName: NodeTypeName,
        loadingDepth: number,
        documentNodeContextPath: ContextPath,
        selectedNodeContextPath?: ContextPath
    }
) {
    const leafNodeContextPath = nodeTreeConfiguration.selectedNodeContextPath
        ?? nodeTreeConfiguration.documentNodeContextPath;
    const toggledNodeContextPaths = nodeTreeConfiguration.rootNodeContextPath
        .getIntermediateContextPaths(leafNodeContextPath);
    const nodes = Object.values(neos.store.getState().cr?.nodes?.byContextPath ?? {})
        .map(node => ({
            ...node,
            contextPath: ContextPath.fromString(node.contextPath as any),
            children: node.children.filter(({nodeType: nodeTypeName}) => {
                return Boolean(nodeTypesRegistry?.isOfType(
                    nodeTypeName,
                    nodeTreeConfiguration.baseNodeTypeName
                ));
            })
        })).filter(node => {
            return node.contextPath && Boolean(nodeTypesRegistry?.isOfType(
                node.nodeType,
                nodeTreeConfiguration.baseNodeTypeName,
            ));
        }) as INode[];

    const rootNode = nodes.find(
        n => n.contextPath.equals(nodeTreeConfiguration.rootNodeContextPath)
    );
    if (!rootNode) {
        throw new Error(`Could not find root node: ${nodeTreeConfiguration.rootNodeContextPath}`);
    }

    dispatch(actions.NodesWereLoaded(
        rootNode,
        nodeTreeConfiguration.baseNodeTypeName,
        nodes,
        nodes.filter(node => false
            || toggledNodeContextPaths.some(cp => node.contextPath.equals(cp))
            || node.depth - rootNode.depth < nodeTreeConfiguration.loadingDepth
        )
    ));
}

export async function loadNodeTree(
    {dispatch}: Store,
    nodeTypesRegistry: INodeTypesRegistry,
    nodeTreeConfiguration: {
        rootNodeContextPath: ContextPath,
        baseNodeTypeName: NodeTypeName,
        loadingDepth: number,
        documentNodeContextPath: ContextPath,
        selectedNodeContextPath?: ContextPath
    }
) {
    const leafNodeContextPath = nodeTreeConfiguration.selectedNodeContextPath
        ?? nodeTreeConfiguration.documentNodeContextPath;
    const toggledNodeContextPaths = nodeTreeConfiguration.rootNodeContextPath
        .getIntermediateContextPaths(leafNodeContextPath);

    dispatch(actions.NodesWereRequested());

    const nodes = (await q([
        nodeTreeConfiguration.rootNodeContextPath,
        leafNodeContextPath
    ]).neosUiDefaultNodes(
        nodeTreeConfiguration.baseNodeTypeName,
        nodeTreeConfiguration.loadingDepth,
        toggledNodeContextPaths,
        []
    ).getForTree()).map(node => ({
        ...node,
        children: node.children.filter(({nodeType: nodeTypeName}) => {
            return Boolean(nodeTypesRegistry?.isOfType(
                nodeTypeName,
                nodeTreeConfiguration.baseNodeTypeName
            ));
        })
    }));

    const rootNode = nodes.find(
        n => n.contextPath.equals(nodeTreeConfiguration.rootNodeContextPath)
    );
    if (!rootNode) {
        throw new VError(`Could not find root node: ${nodeTreeConfiguration.rootNodeContextPath}`);
    }

    dispatch(actions.NodesWereLoaded(
        rootNode,
        nodeTreeConfiguration.baseNodeTypeName,
        nodes,
        nodes.filter(node => false
            || toggledNodeContextPaths.some(cp => node.contextPath.equals(cp))
            || node.depth - rootNode.depth < nodeTreeConfiguration.loadingDepth
        )
    ));
}

export async function toggleNodeInNodeTree(
    {state, dispatch}: Store,
    nodeTypesRegistry: INodeTypesRegistry,
    node: INodePartialForTree
) {
    if (state.nodesByState.uncollapsed.includes(node)) {
        dispatch(actions.NodeWasToggled(node, false));
    } else if (isNodeFullyLoaded(state, node)) {
        dispatch(actions.NodeWasToggled(node, true));
    } else {
        const childNodeContextPaths = node.children
            .filter(c => !state.nodesByContextPath.all[c.contextPath.toString()])
            .map(c => c.contextPath);

        dispatch(actions.ChildNodesWereRequested(node));

        const childNodes = (await q(childNodeContextPaths).getForTree()).map(node => ({
            ...node,
            children: node.children.filter(({nodeType: nodeTypeName}) => {
                return Boolean(nodeTypesRegistry?.isOfType(
                    nodeTypeName,
                    state.baseNodeTypeName
                ));
            })
        }));

        dispatch(actions.ChildNodesWereLoaded(node, childNodes));
        dispatch(actions.NodeWasToggled(node, true));
    }
}

export async function filterNodesInNodeTree(
    {state, dispatch}: Store,
    nodeTypesRegistry: INodeTypesRegistry,
    nodeTreeFilterParams: {
        searchTerm: null | string
        nodeTypeFilter: null | NodeTypeName
    }
) {
    if (state.rootNode && (nodeTreeFilterParams.searchTerm || nodeTreeFilterParams.nodeTypeFilter)) {
        dispatch(actions.FilteredNodesWereRequested(
            nodeTreeFilterParams.searchTerm,
            nodeTreeFilterParams.nodeTypeFilter
        ));

        const filteredNodes = (await q(state.rootNode.contextPath)
            .search(
                nodeTreeFilterParams.searchTerm ?? undefined,
                nodeTreeFilterParams.nodeTypeFilter ?? undefined
            )
            .getForTreeWithParents()).map(node => ({
            ...node,
            children: node.children.filter(({nodeType: nodeTypeName}) => {
                return Boolean(nodeTypesRegistry?.isOfType(
                    nodeTypeName,
                    state.baseNodeTypeName
                ));
            })
        }));;

        dispatch(actions.FilteredNodesWereLoaded(filteredNodes));
    } else {
        dispatch(actions.FilteredNodesWereReset());
    }
}

export async function searchForNodesInNodeTree(
    {state, dispatch}: Store,
    nodeTypesRegistry: INodeTypesRegistry,
    searchTerm: null | string
) {
    await filterNodesInNodeTree(
        {state, dispatch},
        nodeTypesRegistry,
        {...state.filterParams, searchTerm}
    );
}

export async function filterNodesByNodeTypeInNodeTree(
    {state, dispatch}: Store,
    nodeTypesRegistry: INodeTypesRegistry,
    nodeTypeFilter: null | NodeTypeName
) {
    await filterNodesInNodeTree(
        {state, dispatch},
        nodeTypesRegistry,
        {...state.filterParams, nodeTypeFilter}
    );
}
