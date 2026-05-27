import type {StoryblokClient} from '@storyblok/js';
import {decorateApi} from '@/utils/decorator';
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
        fetchContent: async (id, params) => {
            const requestUrl = isSsr()
                ? nuxtApp.ssrContext?.url
                : window.location.href;

            if (requestUrl !== undefined && isPreviewUrl(requestUrl)) {
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
        },
    });
}
