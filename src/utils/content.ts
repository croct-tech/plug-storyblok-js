import type {JsonObject, JsonValue} from '@croct/json';
import type {ContentDefinition, ContentDefinitionBundle} from '@croct/content-model/definition';
import type {FetchResponse} from '@croct/plug';
import type {DynamicSlotId} from '@croct/plug/slot';

export type ContentFetcher = (id: string) => Promise<FetchResponse<DynamicSlotId> | undefined>;

type Story = JsonObject & {uuid: string};

export async function resolveContent(
    content: unknown,
    fetcher: ContentFetcher,
    stories: ReadonlyMap<string, JsonObject> = collectStories(content),
): Promise<unknown> {
    if (isObject(content)) {
        if (typeof content.croct === 'string' && content.croct.trim() !== '') {
            const {croct: slotId, ...rest} = content;

            return await fetcher(content.croct).then(
                response => {
                    if (response === undefined) {
                        return rest;
                    }

                    return createStoryblokContent(
                        response.content,
                        response.metadata?.schema,
                        rest as JsonObject,
                        stories,
                    ) ?? rest;
                },
            ).catch(() => rest);
        }

        return Object.fromEntries(
            await Promise.all(
                Object.entries(content).map(
                    async ([key, value]) => [
                        key,
                        value === undefined ? value : await resolveContent(value, fetcher, stories),
                    ],
                ),
            ),
        );
    }

    if (Array.isArray(content)) {
        return Promise.all(content.map(item => resolveContent(item, fetcher, stories)));
    }

    return content;
}

/**
 * @internal
 */
export function createStoryblokContent(
    content: JsonObject,
    schemas: ContentDefinitionBundle | undefined,
    original?: JsonValue,
    stories: ReadonlyMap<string, JsonObject> = collectStories(original),
): JsonObject | undefined {
    if (schemas === undefined) {
        return undefined;
    }

    return convertContent(content, schemas, schemas.root, stories, original) as JsonObject | undefined;
}

function collectStories(value: unknown, stories = new Map<string, JsonObject>()): ReadonlyMap<string, JsonObject> {
    if (Array.isArray(value)) {
        for (const item of value) {
            collectStories(item, stories);
        }
    } else if (isObject(value)) {
        if (isStory(value)) {
            stories.set(value.uuid, value);
        }

        for (const item of Object.values(value)) {
            collectStories(item, stories);
        }
    }

    return stories;
}

function convertContent(
    content: JsonValue,
    schemas: ContentDefinitionBundle,
    definition: ContentDefinition,
    stories: ReadonlyMap<string, JsonObject>,
    original?: JsonValue,
): JsonValue | undefined {
    if (typeof content === 'number') {
        return convertNumber(content, definition);
    }

    if (typeof content === 'boolean') {
        return convertBoolean(content, definition);
    }

    if (typeof content === 'string') {
        return convertString(content, definition, stories, original);
    }

    if (Array.isArray(content)) {
        return convertArray(content, schemas, definition, stories, original);
    }

    if (isObject(content)) {
        return convertObject(content, schemas, definition, stories, original);
    }

    return undefined;
}

function convertNumber(content: number, definition: ContentDefinition): string | undefined {
    if (definition.type === 'number') {
        return content.toString();
    }

    return undefined;
}

function convertBoolean(content: boolean, definition: ContentDefinition): boolean | undefined {
    if (definition.type === 'boolean') {
        return content;
    }

    return undefined;
}

function convertString(
    content: string,
    definition: ContentDefinition,
    stories: ReadonlyMap<string, JsonObject>,
    original?: JsonValue,
): JsonValue | undefined {
    if (definition.type === 'reference' && definition.id === '@croct/file') {
        return {
            id: null,
            alt: null,
            name: '',
            focus: '',
            title: null,
            filename: content,
            copyright: null,
            fieldtype: 'asset',
            meta_data: {},
            is_external_url: true,
        };
    }

    if (definition.type === 'text') {
        // Link fields may be synced as plain text since Storyblok allows relative URLs,
        // which the URL format does not. The original Storyblok content is the only
        // remaining signal that the field is a link rather than a text.
        if (definition.format === 'url' || isMultilink(original)) {
            // Links are synced as their cached URL, which for story links is a relative slug.
            // An unchanged value keeps the original link so it still points to the story.
            if (isMultilink(original) && original.cached_url === content) {
                return original;
            }

            return {
                id: '',
                linktype: 'url',
                fieldtype: 'multilink',
                url: content,
                cached_url: content,
            };
        }

        // Story relations are synced as UUIDs, which Storyblok resolves into the
        // related stories. A story in the original content indicates a resolved relation.
        if (isStory(original)) {
            return stories.get(content) ?? content;
        }

        return content;
    }

    return undefined;
}

function convertArray(
    content: JsonValue[],
    schemas: ContentDefinitionBundle,
    definition: ContentDefinition,
    stories: ReadonlyMap<string, JsonObject>,
    original?: JsonValue,
): JsonValue[] | undefined {
    if (definition.type !== 'list') {
        return undefined;
    }

    const relatedStory = Array.isArray(original) ? original.find(isStory) : undefined;
    const elements: JsonValue[] = [];

    for (const [index, item] of content.entries()) {
        const itemContent = convertContent(
            item,
            schemas,
            definition.items,
            stories,
            relatedStory ?? (Array.isArray(original) ? original[index] : undefined),
        );

        if (itemContent === undefined) {
            return undefined;
        }

        elements.push(itemContent);
    }

    return elements;
}

function convertObject(
    content: JsonObject,
    schemas: ContentDefinitionBundle,
    definition: ContentDefinition,
    stories: ReadonlyMap<string, JsonObject>,
    original?: JsonValue,
): JsonValue | undefined {
    switch (definition.type) {
        case 'structure':
            return convertStructure(content, schemas, definition, stories, original);

        case 'union':
            return convertUnion(content, schemas, definition, stories, original);

        case 'reference':
            return convertReference(content, schemas, definition, stories, original);

        default:
            return undefined;
    }
}

function convertStructure(
    content: JsonObject,
    schemas: ContentDefinitionBundle,
    definition: ContentDefinition<'structure'>,
    stories: ReadonlyMap<string, JsonObject>,
    original?: JsonValue,
): JsonObject | undefined {
    const componentName = typeof content._component === 'string' && content._component.trim() !== ''
        ? getComponentName(content._component)
        : null;

    if (componentName === null) {
        // Storyblok requires every structure to have an associated component. For root,
        // reference, and union types, the _component property is injected during conversion.
        // However, nested structures have no associated component, so a missing component
        // here indicates a schema mismatch. This should never occur in practice since
        // Storyblok doesn't support nested structures without components.
        return undefined;
    }

    const entries: JsonObject = {};

    for (const [key, value] of Object.entries(content)) {
        if (key === '_component' || key === '_type' || value === undefined) {
            continue;
        }

        if (definition.attributes[key] === undefined) {
            return undefined;
        }

        const attributeContent = convertContent(
            value,
            schemas,
            definition.attributes[key].type,
            stories,
            isObject(original) ? original[key] as JsonValue : undefined,
        );

        if (attributeContent === undefined) {
            return undefined;
        }

        entries[key] = attributeContent;
    }

    return {
        _uid: generateUid(),
        component: componentName,
        ...entries,
    };
}

function convertUnion(
    content: JsonObject,
    schemas: ContentDefinitionBundle,
    definition: ContentDefinition<'union'>,
    stories: ReadonlyMap<string, JsonObject>,
    original?: JsonValue,
): JsonValue | undefined {
    const memberDefinition = definition.types[content._type as string];

    if (memberDefinition === undefined) {
        return undefined;
    }

    return convertContent({...content, _component: content._type}, schemas, memberDefinition, stories, original);
}

function convertReference(
    content: JsonObject,
    schemas: ContentDefinitionBundle,
    definition: ContentDefinition<'reference'>,
    stories: ReadonlyMap<string, JsonObject>,
    original?: JsonValue,
): JsonValue | undefined {
    const referenceDefinition = schemas.definitions[definition.id];

    if (referenceDefinition === undefined) {
        return undefined;
    }

    return convertContent({...content, _component: definition.id}, schemas, referenceDefinition, stories, original);
}

function getComponentName(id: string): string | null {
    const name = id.replace(/@.*$/, '');

    if (name.trim() === '') {
        return null;
    }

    return name;
}

function generateUid(): string {
    return crypto.randomUUID();
}

function isMultilink(value: JsonValue | undefined): value is JsonObject {
    // The fieldtype property is present in every version of the link object,
    // see https://www.storyblok.com/faq/link-object-history
    return isObject(value) && value.fieldtype === 'multilink';
}

function isStory(value: unknown): value is Story {
    return isObject(value)
        && typeof value.uuid === 'string'
        && typeof value.full_slug === 'string'
        && isObject(value.content);
}

function isObject<T>(value: T): value is T & Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
