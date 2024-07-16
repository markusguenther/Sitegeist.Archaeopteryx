import * as React from 'react';
import {INode} from '../ContentRepository/Node';
import {useNeos} from './NeosContext';

export interface IState {
    cr?: {
        nodes?: {
            siteNode?: string
            documentNode?: string
            byContextPath?: {
                [key: string]: INode
            }
        }
    }
    ui?: {
        pageTree?: {
            query?: string
            filterNodeType?: string
        }
    }
    system?: {
        authenticationTimeout?: boolean
    }
}

export interface IStore {
    getState(): IState
    subscribe(listener: () => void): () => void
}

export function useSelector<R>(selector: (state: IState) => R): R {
    const neos = useNeos();
    const [result, setResult] = React.useState<R>(selector(neos.store.getState()));

    React.useEffect(() => neos.store.subscribe(() => {
        const state = neos.store.getState();
        const result = selector(state);

        setResult(result);
    }), []);

    return result;
}