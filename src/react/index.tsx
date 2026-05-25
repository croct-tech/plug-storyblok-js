import {createOptionDecorator} from '@/react/decorator';
import {fetchClientContent} from '@/utils/fetch';

export const withCroct = createOptionDecorator({
    fetchContent: (id, params) => fetchClientContent(id, {preferredLocale: params?.language}),
});
