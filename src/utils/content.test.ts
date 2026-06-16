import type {ContentDefinitionBundle} from '@croct/content-model/definition';
import type {JsonObject} from '@croct/json';
import type {ContentFetcher} from '@/utils/content';
import {createStoryblokContent, resolveContent} from '@/utils/content';

const RANDOM_UUID = '00000000-0000-0000-0000-000000000000';

describe('createStoryblokContent', () => {
    type SupportedScenario = {
        description: string,
        content: JsonObject & {_component?: string},
        schemas: ContentDefinitionBundle,
        expected: JsonObject,
    };

    beforeEach(() => {
        jest.spyOn(crypto, 'randomUUID').mockReturnValue(RANDOM_UUID);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it.each<SupportedScenario>([
        {
            description: 'a structure with different attribute types',
            content: {
                _component: 'page',
                link_attribute: 'http://example.com',
                text_attribute: 'Lorem ipsum',
                number_attribute: 9,
                boolean_attribute: false,
                markdown_attribute: 'Lorem *ipsum*',
                date_time_attribute: '2026-01-01 01:02',
                text_area_attribute: 'Lorem ipsum',
                multi_assets_attribute: [
                    'https://example.com/asset-1.png',
                    'https://example.com/asset-2.png',
                ],
                asset_attribute: 'https://www.example.com/image.png',
                multi_option_attribute: ['a', 'b'],
                single_option_attribute: 'b',
            },
            schemas: {
                root: {
                    type: 'structure',
                    title: 'Block with all types',
                    attributes: {
                        link_attribute: {
                            type: {
                                type: 'text',
                                format: 'url',
                            },
                        },
                        text_attribute: {
                            type: {
                                type: 'text',
                            },
                        },
                        number_attribute: {
                            type: {
                                type: 'number',
                            },
                        },
                        boolean_attribute: {
                            type: {
                                type: 'boolean',
                            },
                        },
                        markdown_attribute: {
                            type: {
                                type: 'text',
                            },
                        },
                        date_time_attribute: {
                            type: {
                                type: 'text',
                            },
                        },
                        text_area_attribute: {
                            type: {
                                type: 'text',
                            },
                        },
                        multi_assets_attribute: {
                            type: {
                                type: 'list',
                                items: {
                                    type: 'reference',
                                    id: '@croct/file',
                                },
                            },
                        },
                        asset_attribute: {
                            type: {
                                type: 'reference',
                                id: '@croct/file',
                            },
                        },
                        multi_option_attribute: {
                            type: {
                                type: 'list',
                                items: {
                                    type: 'text',
                                    choices: {
                                        '1': {
                                            label: 'a',
                                            position: 0,
                                        },
                                        '2': {
                                            label: 'b',
                                            position: 1,
                                        },
                                        '3': {
                                            label: 'c',
                                            position: 2,
                                        },
                                    },
                                },
                            },
                        },
                        single_option_attribute: {
                            type: {
                                type: 'text',
                                choices: {
                                    '1': {
                                        label: 'a',
                                        position: 0,
                                    },
                                    '2': {
                                        label: 'b',
                                        position: 1,
                                    },
                                    '3': {
                                        label: 'c',
                                        position: 2,
                                    },
                                },
                            },
                        },
                    },
                },
                definitions: {},
            },
            expected: {
                _uid: RANDOM_UUID,
                component: 'page',
                link_attribute: {
                    id: '',
                    url: 'http://example.com',
                    linktype: 'url',
                    fieldtype: 'multilink',
                    cached_url: 'http://example.com',
                },
                text_attribute: 'Lorem ipsum',
                asset_attribute: {
                    id: null,
                    alt: null,
                    name: '',
                    focus: '',
                    title: null,
                    filename: 'https://www.example.com/image.png',
                    copyright: null,
                    fieldtype: 'asset',
                    meta_data: {},
                    is_external_url: true,
                },
                number_attribute: '9',
                boolean_attribute: false,
                markdown_attribute: 'Lorem *ipsum*',
                date_time_attribute: '2026-01-01 01:02',
                text_area_attribute: 'Lorem ipsum',
                multi_assets_attribute: [
                    {
                        id: null,
                        alt: null,
                        name: '',
                        focus: '',
                        title: null,
                        filename: 'https://example.com/asset-1.png',
                        copyright: null,
                        fieldtype: 'asset',
                        meta_data: {},
                        is_external_url: true,
                    },
                    {
                        id: null,
                        alt: null,
                        name: '',
                        focus: '',
                        title: null,
                        filename: 'https://example.com/asset-2.png',
                        copyright: null,
                        fieldtype: 'asset',
                        meta_data: {},
                        is_external_url: true,
                    },
                ],
                multi_option_attribute: [
                    'a',
                    'b',
                ],
                single_option_attribute: 'b',
            },
        },
        {
            description: 'a structure with list of text items',
            content: {
                _component: 'tags',
                items: ['javascript', 'typescript', 'react'],
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        items: {
                            type: {
                                type: 'list',
                                items: {
                                    type: 'text',
                                },
                            },
                        },
                    },
                },
                definitions: {},
            },
            expected: {
                _uid: RANDOM_UUID,
                component: 'tags',
                items: ['javascript', 'typescript', 'react'],
            },
        },
        {
            description: 'a structure with list of nested structures',
            content: {
                _component: 'cardList',
                cards: [
                    {
                        _component: 'card',
                        title: 'Card 1',
                    },
                    {
                        _component: 'card',
                        title: 'Card 2',
                    },
                ],
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        cards: {
                            type: {
                                type: 'list',
                                items: {
                                    type: 'structure',
                                    attributes: {
                                        title: {
                                            type: {
                                                type: 'text',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                definitions: {},
            },
            expected: {
                _uid: RANDOM_UUID,
                component: 'cardList',
                cards: [
                    {
                        _uid: RANDOM_UUID,
                        component: 'card',
                        title: 'Card 1',
                    },
                    {
                        _uid: RANDOM_UUID,
                        component: 'card',
                        title: 'Card 2',
                    },
                ],
            },
        },
        {
            description: 'a structure with nested structure attribute',
            content: {
                _component: 'article',
                header: {
                    _component: 'header',
                    title: 'Article Title',
                    columns: 2,
                },
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        header: {
                            type: {
                                type: 'structure',
                                attributes: {
                                    title: {
                                        type: {
                                            type: 'text',
                                        },
                                    },
                                    columns: {
                                        type: {
                                            type: 'number',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                definitions: {},
            },
            expected: {
                _uid: RANDOM_UUID,
                component: 'article',
                header: {
                    _uid: RANDOM_UUID,
                    component: 'header',
                    title: 'Article Title',
                    columns: '2',
                },
            },
        },
        {
            description: 'a structure with union attribute',
            content: {
                _component: 'section',
                media: {
                    _type: 'image',
                    src: 'https://example.com/photo.jpg',
                },
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        media: {
                            type: {
                                type: 'union',
                                types: {
                                    image: {
                                        type: 'structure',
                                        attributes: {
                                            src: {
                                                type: {
                                                    type: 'text',
                                                },
                                            },
                                        },
                                    },
                                    video: {
                                        type: 'structure',
                                        attributes: {
                                            url: {
                                                type: {
                                                    type: 'text',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                definitions: {},
            },
            expected: {
                _uid: RANDOM_UUID,
                component: 'section',
                media: {
                    _uid: RANDOM_UUID,
                    component: 'image',
                    src: 'https://example.com/photo.jpg',
                },
            },
        },
        {
            description: 'a structure with reference to definition',
            content: {
                _component: 'page',
                button: {
                    label: 'Submit',
                    url: 'https://example.com/submit',
                },
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        button: {
                            type: {
                                type: 'reference',
                                id: 'button-component',
                            },
                        },
                    },
                },
                definitions: {
                    'button-component': {
                        type: 'structure',
                        attributes: {
                            label: {
                                type: {
                                    type: 'text',
                                },
                            },
                            url: {
                                type: {
                                    type: 'text',
                                    format: 'url',
                                },
                            },
                        },
                    },
                },
            },
            expected: {
                _uid: RANDOM_UUID,
                component: 'page',
                button: {
                    _uid: RANDOM_UUID,
                    component: 'button-component',
                    label: 'Submit',
                    url: {
                        id: '',
                        linktype: 'url',
                        fieldtype: 'multilink',
                        url: 'https://example.com/submit',
                        cached_url: 'https://example.com/submit',
                    },
                },
            },
        },
    ])('should create a Storyblok content for $description', scenario => {
        const result = createStoryblokContent(scenario.content, scenario.schemas);

        expect(result).toEqual(scenario.expected);
    });

    type UnsupportedScenario = {
        description: string,
        content: JsonObject,
        schemas: ContentDefinitionBundle | undefined,
    };

    it.each<UnsupportedScenario>([
        {
            description: 'no schemas are provided',
            content: {
                _component: 'page',
                title: 'Hello',
            },
            schemas: undefined,
        },
        {
            description: '_component is not a string',
            content: {
                _component: 123,
                title: 'Hello',
            },
            schemas: {
                root: {
                    type: 'text',
                },
                definitions: {},
            },
        },
        {
            description: '_component is missing',
            content: {
                title: 'Hello',
            },
            schemas: {
                root: {
                    type: 'text',
                },
                definitions: {},
            },
        },
        {
            description: '_component is empty string',
            content: {
                _component: '',
                title: 'Hello',
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        title: {
                            type: {
                                type: 'text',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: '_component is whitespace only',
            content: {
                _component: '   ',
                title: 'Hello',
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        title: {
                            type: {
                                type: 'text',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: '_component results in empty name after stripping version',
            content: {
                _component: '@1.0.0',
                title: 'Hello',
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        title: {
                            type: {
                                type: 'text',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
    ])('should return undefined when $description', ({content, schemas}) => {
        const result = createStoryblokContent(content, schemas);

        expect(result).toBeUndefined();
    });

    it('should return undefined when content has attribute not in schema definition', () => {
        const content = {
            _component: 'page',
            title: 'Hello',
            unknownAttribute: 'value',
        };

        const schemas: ContentDefinitionBundle = {
            root: {
                type: 'structure',
                attributes: {
                    title: {
                        type: {
                            type: 'text',
                        },
                    },
                },
            },
            definitions: {},
        };

        const result = createStoryblokContent(content, schemas);

        expect(result).toBeUndefined();
    });

    it('should return undefined when union member type is not in definition', () => {
        const content = {
            _component: 'section',
            media: {
                _type: 'audio',
                src: 'https://example.com/sound.mp3',
            },
        };

        const schemas: ContentDefinitionBundle = {
            root: {
                type: 'structure',
                attributes: {
                    media: {
                        type: {
                            type: 'union',
                            types: {
                            },
                        },
                    },
                },
            },
            definitions: {},
        };

        const result = createStoryblokContent(content, schemas);

        expect(result).toBeUndefined();
    });

    it('should return undefined when list item cannot be resolved', () => {
        const content = {
            _component: 'cardList',
            cards: [
                {
                    title: 'Valid Card',
                },
                {
                    title: 'Invalid Card',
                },
            ],
        };

        const schemas: ContentDefinitionBundle = {
            root: {
                type: 'structure',
                attributes: {
                    cards: {
                        type: {
                            type: 'list',
                            items: {
                                type: 'reference',
                                id: 'missing-definition',
                            },
                        },
                    },
                },
            },
            definitions: {},
        };

        const result = createStoryblokContent(content, schemas);

        expect(result).toBeUndefined();
    });

    it('should return undefined when nested attribute content cannot be resolved', () => {
        const content = {
            _component: 'page',
            header: {
                title: 'Title',
            },
        };

        const schemas: ContentDefinitionBundle = {
            root: {
                type: 'structure',
                attributes: {
                    header: {
                        type: {
                            type: 'reference',
                            id: 'missing-definition',
                        },
                    },
                },
            },
            definitions: {},
        };

        const result = createStoryblokContent(content, schemas);

        expect(result).toBeUndefined();
    });

    type TypeMismatchScenario = {
        description: string,
        content: JsonObject,
        schemas: ContentDefinitionBundle,
    };

    it.each<TypeMismatchScenario>([
        {
            description: 'number content when definition expects text',
            content: {
                _component: 'page',
                title: 42,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        title: {
                            type: {
                                type: 'text',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'number content when definition expects boolean',
            content: {
                _component: 'page',
                flag: 1,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        flag: {
                            type: {
                                type: 'boolean',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'boolean content when definition expects text',
            content: {
                _component: 'page',
                title: true,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        title: {
                            type: {
                                type: 'text',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'boolean content when definition expects number',
            content: {
                _component: 'page',
                count: false,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        count: {
                            type: {
                                type: 'number',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'string content when definition expects number',
            content: {
                _component: 'page',
                count: 'not a number',
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        count: {
                            type: {
                                type: 'number',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'string content when definition expects boolean',
            content: {
                _component: 'page',
                flag: 'true',
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        flag: {
                            type: {
                                type: 'boolean',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'string content when definition expects list',
            content: {
                _component: 'page',
                items: 'not an array',
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        items: {
                            type: {
                                type: 'list',
                                items: {
                                    type: 'text',
                                },
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'string content when definition expects structure',
            content: {
                _component: 'page',
                header: 'not an object',
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        header: {
                            type: {
                                type: 'structure',
                                attributes: {},
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'array content when definition expects text',
            content: {
                _component: 'page',
                title: ['a', 'b'],
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        title: {
                            type: {
                                type: 'text',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'array content when definition expects number',
            content: {
                _component: 'page',
                count: [1, 2, 3],
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        count: {
                            type: {
                                type: 'number',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'array content when definition expects structure',
            content: {
                _component: 'page',
                header: ['a', 'b'],
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        header: {
                            type: {
                                type: 'structure',
                                attributes: {},
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'object content when definition expects text',
            content: {
                _component: 'page',
                title: {nested: 'value'},
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        title: {
                            type: {
                                type: 'text',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'object content when definition expects number',
            content: {
                _component: 'page',
                count: {nested: 'value'},
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        count: {
                            type: {
                                type: 'number',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'object content when definition expects boolean',
            content: {
                _component: 'page',
                flag: {nested: 'value'},
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        flag: {
                            type: {
                                type: 'boolean',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'object content when definition expects list',
            content: {
                _component: 'page',
                items: {nested: 'value'},
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        items: {
                            type: {
                                type: 'list',
                                items: {
                                    type: 'text',
                                },
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'null content when definition expects text',
            content: {
                _component: 'page',
                title: null,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        title: {
                            type: {
                                type: 'text',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'null content when definition expects number',
            content: {
                _component: 'page',
                count: null,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        count: {
                            type: {
                                type: 'number',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'null content when definition expects boolean',
            content: {
                _component: 'page',
                flag: null,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        flag: {
                            type: {
                                type: 'boolean',
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'null content when definition expects list',
            content: {
                _component: 'page',
                items: null,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        items: {
                            type: {
                                type: 'list',
                                items: {
                                    type: 'text',
                                },
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
        {
            description: 'null content when definition expects structure',
            content: {
                _component: 'page',
                header: null,
            },
            schemas: {
                root: {
                    type: 'structure',
                    attributes: {
                        header: {
                            type: {
                                type: 'structure',
                                attributes: {},
                            },
                        },
                    },
                },
                definitions: {},
            },
        },
    ])('should return undefined when $description', ({content, schemas}) => {
        const result = createStoryblokContent(content, schemas);

        expect(result).toBeUndefined();
    });
});

describe('resolveContent', () => {
    beforeEach(() => {
        jest.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(RANDOM_UUID);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        {
            description: 'a string',
            content: 'hello',
        },
        {
            description: 'a number',
            content: 42,
        },
        {
            description: 'a boolean',
            content: true,
        },
        {
            description: 'null',
            content: null,
        },
    ])('should return $description as-is', async ({content}) => {
        const fetcher: ContentFetcher = jest.fn();

        await expect(resolveContent(content, fetcher)).resolves.toBe(content);

        expect(fetcher).not.toHaveBeenCalled();
    });

    type InvalidCroctPropertyScenario = {
        description: string,
        content: JsonObject,
    };

    it.each<InvalidCroctPropertyScenario>([
        {
            description: 'croct property is empty string',
            content: {
                croct: '',
                other: 'value',
            },
        },
        {
            description: 'croct property is whitespace only',
            content: {
                croct: '   ',
                other: 'value',
            },
        },
        {
            description: 'croct property is not a string',
            content: {
                croct: 123,
                other: 'value',
            },
        },
    ])('should not fetch when $description', async ({content}) => {
        const fetcher: ContentFetcher = jest.fn();

        await expect(resolveContent(content, fetcher)).resolves.toEqual(content);

        expect(fetcher).not.toHaveBeenCalled();
    });

    it('should keep undefined property values without recursing or fetching', async () => {
        const fetcher: ContentFetcher = jest.fn();

        const content = {
            defined: 'value',
            missing: undefined,
        };

        const result = await resolveContent(content, fetcher);

        expect(result).toEqual({defined: 'value', missing: undefined});
        expect(Object.keys(result as Record<string, unknown>)).toEqual(['defined', 'missing']);

        expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch content when slot property is a non-empty string', async () => {
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue({
            content: {
                _component: 'hero',
                title: 'Fetched Title',
            },
            metadata: {
                schema: {
                    root: {
                        type: 'structure',
                        attributes: {
                            title: {
                                type: {
                                    type: 'text',
                                },
                            },
                        },
                    },
                    definitions: {},
                },
            },
        });

        const content = {croct: 'slot-id'};

        await expect(resolveContent(content, fetcher)).resolves.toEqual({
            _uid: RANDOM_UUID,
            component: 'hero',
            title: 'Fetched Title',
        });

        expect(fetcher).toHaveBeenCalledWith('slot-id');
    });

    it('should resolve slot references at any depth', async () => {
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue({
            content: {
                _component: 'widget',
                data: 'fetched',
            },
            metadata: {
                schema: {
                    root: {
                        type: 'structure',
                        attributes: {
                            data: {
                                type: {
                                    type: 'text',
                                },
                            },
                        },
                    },
                    definitions: {},
                },
            },
        });

        const content = {
            level1: {
                level2: {
                    level3: {
                        croct: 'deep-slot',
                    },
                },
            },
        };

        await expect(resolveContent(content, fetcher)).resolves.toEqual({
            level1: {
                level2: {
                    level3: {
                        _uid: RANDOM_UUID,
                        component: 'widget',
                        data: 'fetched',
                    },
                },
            },
        });

        expect(fetcher).toHaveBeenCalledWith('deep-slot');
    });

    it('should resolve nested slot references in arrays', async () => {
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue({
            content: {_component: 'card', title: 'Fetched'},
            metadata: {
                schema: {
                    root: {
                        type: 'structure',
                        attributes: {
                            title: {
                                type: {
                                    type: 'text',
                                },
                            },
                        },
                    },
                    definitions: {},
                },
            },
        });

        const content = [
            {croct: 'slot-1'},
            {croct: 'slot-2'},
        ];

        await expect(resolveContent(content, fetcher)).resolves.toEqual([
            {
                _uid: RANDOM_UUID,
                component: 'card',
                title: 'Fetched',
            },
            {
                _uid: RANDOM_UUID,
                component: 'card',
                title: 'Fetched',
            },
        ]);

        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(fetcher).toHaveBeenCalledWith('slot-1');
        expect(fetcher).toHaveBeenCalledWith('slot-2');
    });

    it('should convert the content to Storyblok format when fetching succeeds', async () => {
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue({
            content: {
                _component: 'banner',
                message: 'Welcome!',
                url: 'https://example.com/welcome',
            },
            metadata: {
                schema: {
                    root: {
                        type: 'structure',
                        attributes: {
                            message: {
                                type: {
                                    type: 'text',
                                },
                            },
                            url: {
                                type: {
                                    type: 'text',
                                    format: 'url',
                                },
                            },
                        },
                    },
                    definitions: {},
                },
            },
        });

        const content = {croct: 'slot-id'};

        await expect(resolveContent(content, fetcher)).resolves.toEqual({
            _uid: RANDOM_UUID,
            component: 'banner',
            message: 'Welcome!',
            url: {
                id: '',
                linktype: 'url',
                fieldtype: 'multilink',
                url: 'https://example.com/welcome',
                cached_url: 'https://example.com/welcome',
            },
        });

        expect(fetcher).toHaveBeenCalledWith('slot-id');
    });

    it('should only resolve the outermost slot reference', async () => {
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue({
            content: {
                _component: 'outer@1',
            },
            metadata: {
                schema: {
                    root: {
                        type: 'structure',
                        attributes: {},
                    },
                    definitions: {},
                },
            },
        });

        const content = {
            croct: 'outer-slot',
            nested: {
                croct: 'inner-slot',
            },
        };

        await expect(resolveContent(content, fetcher)).resolves.toEqual({
            _uid: RANDOM_UUID,
            component: 'outer',
        });

        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(fetcher).toHaveBeenCalledWith('outer-slot');
    });

    it('should remove croct property and return fallback properties when fetching fails', async () => {
        const fetcher: ContentFetcher = jest.fn().mockRejectedValue(new Error('Fetch failed'));

        const content = {
            croct: 'slot-id',
            fallbackTitle: 'Fallback',
            fallbackData: 123,
        };

        const {croct, ...expectedFallback} = content;

        await expect(resolveContent(content, fetcher)).resolves.toEqual(expectedFallback);

        expect(fetcher).toHaveBeenCalledWith('slot-id');
    });

    it('should remove croct property and return fallback properties when content creation fails', async () => {
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue({
            content: {
                _component: 'widget',
                data: 'fetched',
            },
            metadata: {
                schema: undefined,
            },
        });

        const content = {
            croct: 'slot-id',
            fallbackTitle: 'Fallback',
            fallbackData: 123,
        };

        const {croct, ...expectedFallback} = content;

        await expect(resolveContent(content, fetcher)).resolves.toEqual(expectedFallback);

        expect(fetcher).toHaveBeenCalledWith('slot-id');
    });

    it('should remove croct property and return fallback properties when fetcher returns undefined', async () => {
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue(undefined);

        const content = {
            croct: 'slot-id',
            fallbackTitle: 'Fallback',
            fallbackData: 123,
        };

        const {croct, ...expectedFallback} = content;

        await expect(resolveContent(content, fetcher)).resolves.toEqual(expectedFallback);

        expect(fetcher).toHaveBeenCalledWith('slot-id');
    });

    it('should preserve a Storyblok field that the Croct content omits because it is optional', async () => {
        // Reproduces the customer-reported issue: the hero schema declares `tagline` as an
        // optional attribute. The Storyblok story authors a tagline, but the Croct experiment
        // variant leaves it unset, so the fetched content has no `tagline`. The resolved blok
        // ends up without the field the component expects.
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue({
            content: {
                _component: 'hero-section@2',
                cta: [
                    {
                        link: 'https://storyblok-next-personalization.vercel.app/catalog',
                        label: 'Some CTA label',
                    },
                ],
                image: 'https://a.storyblok.com/f/289964601464397/4240x2827/788dbcaf4d/fallback.png',
                headline: 'Some heading',
                // `tagline` is intentionally absent: it is optional and the variant did not set it.
            },
            metadata: {
                schema: {
                    root: {
                        type: 'structure',
                        attributes: {
                            cta: {
                                type: {
                                    type: 'list',
                                    items: {
                                        id: 'cta',
                                        type: 'reference',
                                    },
                                    maximumLength: 1,
                                    minimumLength: 1,
                                },
                                optional: false,
                                position: 2,
                            },
                            image: {
                                type: {
                                    id: '@croct/file',
                                    type: 'reference',
                                    properties: {
                                        allowedTypes: ['image/jpeg', 'image/jp2', 'image/png', 'image/webp'],
                                    },
                                },
                                optional: false,
                                position: 3,
                            },
                            tagline: {
                                type: {
                                    type: 'text',
                                    format: 'multiline',
                                    minimumLength: 1,
                                },
                                optional: true,
                                position: 1,
                            },
                            headline: {
                                type: {
                                    type: 'text',
                                    minimumLength: 1,
                                },
                                optional: false,
                                position: 0,
                            },
                        },
                    },
                    definitions: {
                        cta: {
                            type: 'structure',
                            attributes: {
                                link: {
                                    type: {
                                        type: 'text',
                                        format: 'url',
                                    },
                                    optional: false,
                                    position: 1,
                                },
                                label: {
                                    type: {
                                        type: 'text',
                                        minimumLength: 1,
                                    },
                                    optional: false,
                                    position: 0,
                                },
                            },
                        },
                        '@croct/file': {
                            type: 'text',
                            format: 'url',
                            template: true,
                            logicalType: 'file',
                            fullyOptional: true,
                        },
                    },
                },
            },
        });

        // The Storyblok blok authored by the customer, with a tagline the component renders.
        const content = {
            croct: 'home-hero',
            cta: [
                {
                    _uid: 'b9e354cf-1550-47eb-96e2-1db61e952158',
                    link: {
                        id: '9f09d0ab-b5d6-49ca-9f4b-4f46b87cd1c8',
                        url: '',
                        linktype: 'story',
                        fieldtype: 'multilink',
                        cached_url: 'catalog/',
                    },
                    label: 'Shop now',
                    component: 'cta',
                },
            ],
            image: {
                id: 144008140194699,
                alt: '',
                filename: 'https://a.storyblok.com/f/289964601464397/4240x2827/788dbcaf4d/fallback.png',
                fieldtype: 'asset',
            },
            tagline: 'Sporty or elegant, we got you covered.',
            headline: 'Effortless style for everyday moments',
            component: 'hero-section',
        };

        const result = await resolveContent(content, fetcher);

        // The optional field Croct omits falls back to the Storyblok-authored value so the
        // component keeps rendering, while Croct still overrides the attributes it does set.
        expect(result).toEqual({
            _uid: RANDOM_UUID,
            component: 'hero-section',
            cta: [
                {
                    _uid: RANDOM_UUID,
                    component: 'cta',
                    link: {
                        id: '',
                        url: 'https://storyblok-next-personalization.vercel.app/catalog',
                        linktype: 'url',
                        fieldtype: 'multilink',
                        cached_url: 'https://storyblok-next-personalization.vercel.app/catalog',
                    },
                    label: 'Some CTA label',
                },
            ],
            image: {
                id: null,
                alt: null,
                name: '',
                focus: '',
                title: null,
                filename: 'https://a.storyblok.com/f/289964601464397/4240x2827/788dbcaf4d/fallback.png',
                copyright: null,
                fieldtype: 'asset',
                meta_data: {},
                is_external_url: true,
            },
            tagline: 'Sporty or elegant, we got you covered.',
            headline: 'Some heading',
        });
    });

    it('should drop an optional field that neither Croct nor Storyblok provides', async () => {
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue({
            content: {
                _component: 'hero',
                headline: 'Fetched Headline',
                // `tagline` is optional and unset by the variant.
            },
            metadata: {
                schema: {
                    root: {
                        type: 'structure',
                        attributes: {
                            headline: {
                                type: {
                                    type: 'text',
                                },
                                optional: false,
                            },
                            tagline: {
                                type: {
                                    type: 'text',
                                },
                                optional: true,
                            },
                        },
                    },
                    definitions: {},
                },
            },
        });

        // The Storyblok blok does not author a tagline either, so there is nothing to fall back to.
        const content = {
            croct: 'slot-id',
            headline: 'Storyblok Headline',
        };

        await expect(resolveContent(content, fetcher)).resolves.toEqual({
            _uid: RANDOM_UUID,
            component: 'hero',
            headline: 'Fetched Headline',
        });
    });

    it('should not recover fallback fields when the schema root is not a structure', async () => {
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue({
            content: {
                title: 'Fetched Title',
            },
            metadata: {
                schema: {
                    root: {
                        type: 'reference',
                        id: 'widget',
                    },
                    definitions: {
                        widget: {
                            type: 'structure',
                            attributes: {
                                title: {
                                    type: {
                                        type: 'text',
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const content = {
            croct: 'slot-id',
            fallbackTitle: 'Fallback',
        };

        await expect(resolveContent(content, fetcher)).resolves.toEqual({
            _uid: RANDOM_UUID,
            component: 'widget',
            title: 'Fetched Title',
        });
    });

    it('should return fallback properties when the fetched content does not match the schema', async () => {
        const fetcher: ContentFetcher = jest.fn().mockResolvedValue({
            content: {
                _component: 'hero',
                unknownField: 'value',
            },
            metadata: {
                schema: {
                    root: {
                        type: 'structure',
                        attributes: {
                            headline: {
                                type: {
                                    type: 'text',
                                },
                            },
                        },
                    },
                    definitions: {},
                },
            },
        });

        const content = {
            croct: 'slot-id',
            fallbackTitle: 'Fallback',
        };

        const {croct, ...expectedFallback} = content;

        await expect(resolveContent(content, fetcher)).resolves.toEqual(expectedFallback);
    });
});
