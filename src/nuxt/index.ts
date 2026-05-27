import type {StoryblokClient} from '@storyblok/js';
import {decorateApi} from '@/utils/decorator';
import {fetchClientContent} from '@/utils/fetch';
import {isPreviewUrl} from '@/utils/preview';
import {isSsr} from '@/utils/ssr';

declare const $fetch: (url: string, options: Record<string, unknown>) => Promise<any>;

type NuxtApp = {
    ssrContext?: {
        url?: string,
    },
};

export function withCroct(nuxtApp: NuxtApp, api: StoryblokClient): void {
    decorateApi(api, {
        fetchContent: isSsr()
            ? async (id, params) => {
                const url = nuxtApp.ssrContext?.url;

                if (url !== undefined && isPreviewUrl(url)) {
                    return undefined;
                }

                const response = await $fetch('/api/_croct/content', {
                    method: 'POST',
                    body: {
                        slotId: id,
                        includeSchema: true,
                        ...(params?.language !== undefined
                            ? {preferredLocale: params.language}
                            : {}),
                    },
                });

                if (response?.metadata?.contentSource === 'slot') {
                    return undefined;
                }

                return response;
            }
            : (id, params) => fetchClientContent(id, {preferredLocale: params?.language}),
    });
}
