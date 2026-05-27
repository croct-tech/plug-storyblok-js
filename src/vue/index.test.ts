import type {ApiDecorator} from '@/utils/decorator';

jest.mock(
    '@/utils/fetch',
    () => ({
        fetchClientContent: jest.fn(),
    }),
);

jest.mock(
    '@/vue/decorator',
    () => ({
        createOptionDecorator: jest.fn(() => jest.fn()),
    }),
);

describe('withCroct', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    const mocks = {
        get createOptionDecorator() {
            return jest.requireMock('@/vue/decorator').createOptionDecorator;
        },
        get fetchClientContent() {
            return jest.requireMock('@/utils/fetch').fetchClientContent;
        },
    };

    it('should forward language as preferredLocale to fetchClientContent', async () => {
        await import('@/vue/index');

        const decorator: ApiDecorator = mocks.createOptionDecorator.mock.calls[0][0];

        await decorator.fetchContent('slot-id', {language: 'de'});

        expect(mocks.fetchClientContent).toHaveBeenCalledWith('slot-id', {preferredLocale: 'de'});
    });

    it('should forward undefined locale when language is not provided', async () => {
        await import('@/vue/index');

        const decorator: ApiDecorator = mocks.createOptionDecorator.mock.calls[0][0];

        await decorator.fetchContent('slot-id');

        expect(mocks.fetchClientContent).toHaveBeenCalledWith('slot-id', {preferredLocale: undefined});
    });
});
