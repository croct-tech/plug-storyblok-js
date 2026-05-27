import {fetchContent, type FetchOptions} from '@croct/plug-next/server';
import {getRequestUri} from '@croct/plug-next/config/context';
import {headers} from 'next/headers';
import {isSsr} from '@/utils/ssr';
import {createOptionDecorator} from '@/utils/decorator';
import {isPreviewUrl} from '@/utils/preview';
import {fetchClientContent} from '@/utils/fetch';

export const withCroct = createOptionDecorator({
    /*
     * Calling `headers()` opts the route into dynamic rendering, ensuring
     * pages are never statically generated. This is necessary because content
     * may reference Croct slots at any time, and a static page wouldn't reflect
     * those changes.
     *
     * Ideally, `connection()` would be used as a more semantic
     * way to signal dynamic rendering, but it was introduced in Next.js 15,
     * and headers() provides broader backward compatibility.
     *
     * @see https://nextjs.org/docs/app/api-reference/functions/connection
     */
    beforeRequest: isSsr() ? async () => { await headers(); } : undefined,
    fetchContent: isSsr()
        ? async (id, params) => {
            const uri = await getRequestUri(params?.route).catch(() => null);

            if (uri !== null && isPreviewUrl(uri)) {
                // Do not overwrite content in preview mode
                return undefined;
            }

            const response = await fetchContent(id, {
                includeSchema: true,
                route: params?.route,
                ...(params?.language !== undefined && {preferredLocale: params.language}),
            });

            if (response.metadata?.contentSource === 'slot') {
                return undefined;
            }

            return response;
        }
        : (id, params) => fetchClientContent(id, {preferredLocale: params?.language}),
    resolveParams: params => {
        if (params === undefined) {
            return undefined;
        }

        const {route, ...rest} = params;

        return rest;
    },
});

declare module '@storyblok/js' {
    interface ISbStoriesParams {
        route?: FetchOptions['route'];
    }
}
