import type {SbPluginFactory, StoryblokClient, SbSDKOptions, ISbStoriesParams} from '@storyblok/js';
import type {ContentFetcher} from '@/utils/content';
import {resolveContent} from '@/utils/content';

/**
 * @internal
 */
export type ApiDecorator = {
    beforeRequest?: () => Promise<void> | void,
    resolveParams?: (params: ISbStoriesParams | undefined) => ISbStoriesParams | undefined,
    fetchContent: (id: string, params?: ISbStoriesParams) => ReturnType<ContentFetcher>,
};

/**
 * @internal
 */
export function createOptionDecorator(decorator: ApiDecorator): <O extends SbSDKOptions>(options: O) => O {
    return <O extends SbSDKOptions>(options: O): O => {
        const result = {...options};

        if (result.use !== undefined) {
            result.use = result.use.map(plugin => decoratePlugin(plugin, decorator));
        }

        return result;
    };
}

/**
 * @internal
 */
export function decoratePlugin(plugin: SbPluginFactory, decorator: ApiDecorator): SbPluginFactory {
    return options => {
        const result = plugin(options);

        if (result.storyblokApi === undefined) {
            return result;
        }

        const {storyblokApi}: {storyblokApi: StoryblokClient} = result;

        decorateApi(storyblokApi, decorator);

        return result;
    };
}

/**
 * @internal
 */
/* eslint-disable no-param-reassign -- mutating the API is the function's purpose */
export function decorateApi(api: StoryblokClient, decorator: ApiDecorator): void {
    const get = api.get.bind(api);

    api.get = async (path: string, params, ...args): Promise<any> => {
        await decorator.beforeRequest?.();

        const resolvedParams = decorator.resolveParams?.(params) ?? params;

        if (path.startsWith('cdn/stories/')) {
            return resolveContent(
                await get(path, resolvedParams, ...args),
                id => decorator.fetchContent(id, params),
            );
        }

        return get(path, resolvedParams, ...args);
    };

    const getAll = api.getAll.bind(api);

    api.getAll = async (path: string, params, ...args): Promise<any> => {
        await decorator.beforeRequest?.();

        const resolvedParams = decorator.resolveParams?.(params) ?? params;

        if (path.startsWith('cdn/stories/')) {
            return resolveContent(
                await getAll(path, resolvedParams, ...args),
                id => decorator.fetchContent(id, params),
            );
        }

        return getAll(path, resolvedParams, ...args);
    };

    const getStory = api.getStory.bind(api);

    api.getStory = async (slug: string, params, ...args): Promise<any> => {
        await decorator.beforeRequest?.();

        return resolveContent(
            await getStory(slug, decorator.resolveParams?.(params) ?? params, ...args),
            id => decorator.fetchContent(id, params),
        );
    };

    const getStories = api.getStories.bind(api);

    api.getStories = async (params, ...args): Promise<any> => {
        await decorator.beforeRequest?.();

        return resolveContent(
            await getStories(decorator.resolveParams?.(params) ?? params, ...args),
            id => decorator.fetchContent(id, params),
        );
    };
}
/* eslint-enable no-param-reassign -- end of decorateApi */
