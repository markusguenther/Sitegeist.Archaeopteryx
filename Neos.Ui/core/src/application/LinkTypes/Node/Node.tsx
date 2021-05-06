import * as React from 'react';
import {useAsync} from 'react-use';

import {q, INodePartialForTree, NodeTypeName, useSiteNodeContextPath, useDocumentNodeContextPath, useConfiguration} from '@sitegeist/archaeopteryx-neos-bridge';
import {NodeTree} from '@sitegeist/archaeopteryx-custom-node-tree';

import {Process, LinkType, ILink, Field} from '../../../domain';

interface Props {
    node: null | INodePartialForTree
}

const propsCache = new Map<string, Props>();

export const Node = new class extends LinkType<Props> {
    public readonly id = 'Sitegeist.Archaeopteryx:Node';

    public readonly isSuitableFor = (link: ILink) =>
        link.href.startsWith('node://');

    public readonly useResolvedProps = (link?: ILink) => {
        const siteNodeContextPath = useSiteNodeContextPath();
        const asyncState = useAsync(async () => {
            if (link === undefined) {
                return {node: null};
            }

            if (!siteNodeContextPath) {
                throw this.error('Could not find siteNodeContextPath.');
            }

            const match = /node:\/\/(.*)/.exec(link.href);

            if (!match) {
                throw this.error(`Cannot handle href "${link.href}".`);
            }

            const identifier = match[1];
            const cacheIdentifier = `${identifier}@${siteNodeContextPath.context}`;

            if (propsCache.has(cacheIdentifier)) {
                return propsCache.get(cacheIdentifier) as Props;
            }

            const result = await q(siteNodeContextPath).find(`#${identifier}`)
                .getForTree();

            for (const node of result) {
                const props = {node};
                propsCache.set(cacheIdentifier, props);
                return props;
            }

            throw this.error(`Could not find node for identifier "${identifier}".`);
        }, [link?.href, siteNodeContextPath]);

        return Process.fromAsyncState(asyncState);
    }

    public readonly convertPropsToLink = (props: Props) => {
        if (props.node === null) {
            return null;
        }

        return {
            href: `node://${props.node.identifier}`
        };
    };

    public readonly getStaticIcon = () => (
        <div>NODE TREE</div>
    );

    public readonly getIcon = () => (
        <div>NODE TREE</div>
    );

    public readonly getStaticTitle = () => 'Node Tree';

    public readonly getTitle = () => 'Node Tree';

    public readonly getLoadingPreview = () => (
        <div>NODE TREE PREVIEW</div>
    );

    public readonly getPreview = () => (
        <div>NODE TREE PREVIEW</div>
    );

    public readonly getLoadingEditor = () => (
        <div>NODE TREE EDITOR</div>
    );

    public readonly getEditor = (props: Props) => {
        const siteNodeContextPath = useSiteNodeContextPath();
        const documentNodeContextPath = useDocumentNodeContextPath();
        const baseNodeTypeName = useConfiguration(c => c.nodeTree?.presets?.default?.baseNodeType) ?? NodeTypeName('Neos.Neos:Document');
        const loadingDepth = useConfiguration(c => c.nodeTree?.loadingDepth) ?? 4;

        if (!siteNodeContextPath) {
            throw this.error('Could not load node tree, because siteNodeContextPath could not be determined.');
        } else if (!documentNodeContextPath) {
            throw this.error('Could not load node tree, because documentNodeContextPath could not be determined.');
        } else {
            return (
                <Field<null | INodePartialForTree>
                    name="node"
                    initialValue={props.node}
                >{({input}) => (
                    <NodeTree
                        configuration={{
                            baseNodeTypeName,
                            rootNodeContextPath: siteNodeContextPath,
                            documentNodeContextPath,
                            selectedNodeContextPath: input.value?.contextPath,
                            loadingDepth
                        }}
                        options={{
                            enableSearch: true,
                            enableNodeTypeFilter: true
                        }}
                        onSelect={node =>{
                            const cacheIdentifier = `${node.identifier}@${siteNodeContextPath.context}`;
                            propsCache.set(cacheIdentifier, {node});
                            input.onChange(node);
                        }}
                    />
                )}</Field>
            );
        }
    };
}
