import { Interpreter } from "./Interpreter"

import React, { useState, useMemo } from 'react'
import { createEditor, Descendant, Editor, Range } from 'slate'
import { Slate, Editable, withReact, useSlate, ReactEditor } from 'slate-react'

const createInterpreter = (): Interpreter => {
  const sum = (xs: number[]) => xs.reduce((acc, val) => acc + val, 0);
  return Interpreter
    .withBuiltins(bs =>
      bs.infix({
        op: "+",
        precedence: 4,
        interpret: (left, right) => left + right
      }).infix({
        op: "*",
        precedence: 4,
        interpret: (left, right) => left * right
      }).infix({
        op: "-",
        precedence: 4,
        interpret: (left, right) => left - right
      }).infix({
        op: "/",
        precedence: 4,
        interpret: (left, right) => left / right
      }).prefix({
        op: "sqrt",
        precedence: 5,
        interpret: (operand) => Math.sqrt(operand)
      }).define({
        op: "maximum",
        precedence: 6,
        interpret: (ops) => Math.max(...ops)
      }).define({
        op: "sum",
        precedence: 6,
        interpret: sum
      }).define({
        op: "avg",
        precedence: 6,
        interpret: (xs) => sum(xs) / xs.length
      })
    )
}

const Calculator = () => {
  // const interpreter = useMemo(() => createInterpreter, []);
  const editor = useSlate();
  const { selection } = editor;

  if (!selection
    || !ReactEditor.isFocused(editor)
    || Range.isCollapsed(selection)
    || Editor.string(editor, selection) == null
    || Editor.string(editor, selection) === ''
  ) {
    return <pre><i>empty selection</i></pre>
  } else {
    return <pre>{Editor.string(editor, selection)}</pre>
  }

}

const App = () => {
  const [value, setValue] = useState<Descendant[]>(initialValue)
  const editor = useMemo(() => withReact(createEditor()), [])
  return (
    <Slate editor={editor} value={value} onChange={value => setValue(value)}>
      <Calculator />
      <Editable placeholder="Enter some plain text..." />
    </Slate>
  )
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [
      { text: 'This is editable plain text, just like a <textarea>!' },
    ],
  },
]

export default App;
