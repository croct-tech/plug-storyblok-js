import type {JsonObject} from '@croct/json';
import type {MarkedToken, Token, Tokens} from 'marked';
import {Lexer, Tokenizer} from 'marked';

/**
 * A tokenizer that reads only the syntax the rich text sync produces.
 *
 * The sync escapes HTML and never produces tables or bare URLs, so the
 * GFM extensions for them are disabled to read that content as plain text.
 */
class RichTextTokenizer extends Tokenizer {
    public html(): undefined {
        return undefined;
    }

    public tag(): undefined {
        return undefined;
    }

    public table(): undefined {
        return undefined;
    }

    public url(): undefined {
        return undefined;
    }
}

/**
 * Converts Markdown into a Storyblok rich text document.
 *
 * It reads CommonMark with strikethrough, the format in which rich text is synced to Croct.
 */
export function parseRichText(markdown: string): JsonObject {
    const lexer = new Lexer({
        gfm: true,
        tokenizer: new RichTextTokenizer(),
    });

    return {
        type: 'doc',
        content: convertBlocks(lexer.lex(markdown)),
    };
}

function convertBlocks(tokens: Token[]): JsonObject[] {
    return tokens.flatMap(convertBlock);
}

function convertBlock(item: Token): JsonObject[] {
    // The generic token type prevents narrowing, although the lexer only produces built-in tokens
    const token = item as MarkedToken;

    switch (token.type) {
        case 'paragraph':
        case 'text':
            // Tight list items hold text rather than paragraphs, which Storyblok always expects
            return [{
                type: 'paragraph',
                content: convertInline((token as Tokens.Paragraph).tokens),
            }];

        case 'heading':
            return [{
                type: 'heading',
                attrs: {level: token.depth},
                content: convertInline(token.tokens),
            }];

        case 'blockquote':
            return [{
                type: 'blockquote',
                content: convertBlocks(token.tokens),
            }];

        case 'list':
            return [{
                type: token.ordered ? 'ordered_list' : 'bullet_list',
                ...(token.ordered ? {attrs: {order: token.start}} : {}),
                content: token.items.map(
                    listItem => ({
                        type: 'list_item',
                        content: convertBlocks(listItem.tokens),
                    }),
                ),
            }];

        case 'code':
            return [{
                type: 'code_block',
                attrs: {class: token.lang !== undefined && token.lang !== '' ? `language-${token.lang}` : null},
                content: token.text === '' ? [] : [{type: 'text', text: token.text}],
            }];

        case 'hr':
            return [{type: 'horizontal_rule'}];

        default:
            // Spacing, link definitions, and task list checkboxes, which Storyblok does not support
            return [];
    }
}

function convertInline(tokens: Token[], marks: JsonObject[] = [], nodes: JsonObject[] = []): JsonObject[] {
    for (const item of tokens) {
        const token = item as MarkedToken;

        switch (token.type) {
            case 'strong':
                convertInline(token.tokens, [...marks, {type: 'bold'}], nodes);

                break;

            case 'em':
                convertInline(token.tokens, [...marks, {type: 'italic'}], nodes);

                break;

            case 'del':
                convertInline(token.tokens, [...marks, {type: 'strike'}], nodes);

                break;

            case 'link':
                convertInline(token.tokens, [...marks, createLinkMark(token.href)], nodes);

                break;

            case 'codespan':
                appendText(nodes, token.text, [...marks, {type: 'code'}]);

                break;

            case 'image':
                nodes.push({
                    type: 'image',
                    attrs: {
                        id: null,
                        src: token.href,
                        alt: getPlainText(token.tokens),
                        title: token.title,
                        source: null,
                        copyright: null,
                        meta_data: {},
                    },
                });

                break;

            case 'br':
                nodes.push({type: 'hard_break'});

                break;

            default:
                // Plain and escaped text, as the tokenizer disables raw HTML
                appendText(nodes, (token as Tokens.Text | Tokens.Escape).text, marks);

                break;
        }
    }

    return nodes;
}

/**
 * Appends a text to the nodes, merging it with the last text node when it has the same marks.
 *
 * Line breaks within the text become hard breaks, since the text is written in a single paragraph.
 */
function appendText(nodes: JsonObject[], text: string, marks: JsonObject[]): void {
    for (const [index, line] of text.split('\n').entries()) {
        if (index > 0) {
            nodes.push({type: 'hard_break'});
        }

        if (line === '') {
            continue;
        }

        const last = nodes[nodes.length - 1];

        if (last?.type === 'text' && JSON.stringify(last.marks ?? []) === JSON.stringify(marks)) {
            last.text = `${last.text as string}${line}`;

            continue;
        }

        nodes.push({
            type: 'text',
            text: line,
            ...(marks.length > 0 ? {marks: marks} : {}),
        });
    }
}

function createLinkMark(href: string): JsonObject {
    const email = href.toLowerCase().startsWith('mailto:');

    return {
        type: 'link',
        attrs: {
            href: email ? href.slice('mailto:'.length) : href,
            uuid: null,
            anchor: null,
            target: null,
            linktype: email ? 'email' : 'url',
        },
    };
}

/**
 * Reads the text of inline content, such as an image description, without its formatting.
 */
function getPlainText(tokens: Token[]): string {
    // Hard breaks become spaces, since the text spans a single line
    return convertInline(tokens).map(node => (typeof node.text === 'string' ? node.text : ' '))
        .join('');
}
