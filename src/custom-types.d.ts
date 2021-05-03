import {
    Descendant,
    BaseEditor
} from 'slate'
import { ReactEditor } from 'slate-react'

export type ParagraphElement = { type: 'paragraph'; children: Descendant[] }

type CustomElement = ParagraphElement

declare module 'slate' {
    interface CustomTypes {
        Editor: BaseEditor & ReactEditor;
        Element: CustomElement;
    }
}
