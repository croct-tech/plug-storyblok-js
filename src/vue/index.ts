import type {Plugin} from 'vue';
import type {SbVueSDKOptions} from '@storyblok/vue';
import {createOptionDecorator} from '@/vue/decorator';
import {fetchClientContent} from '@/utils/fetch';

export const withCroct: (options: SbVueSDKOptions) => Plugin = createOptionDecorator({
    fetchContent: (id, params) => fetchClientContent(id, {preferredLocale: params?.language}),
});
