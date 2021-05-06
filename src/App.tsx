import { Interpreter } from "./Interpreter/Interpreter"
import { Calculator } from "./Calculator"

import { useState, useMemo } from 'react'
import { createEditor, Descendant } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'

const interpreter = Interpreter
  .withBuiltins(bs =>
    bs
      .infix("^", 5, (left: number, right: number) => Math.pow(left, right))
      .infix("+", 4, (left, right) => left + right)
      .infix("*", 4, (left, right) => left * right)
      .infix("-", 3, (left, right) => left - right)
      .infix("/", 3, (left, right) => left / right)
  );

const App = () => {
  const [value, setValue] = useState<Descendant[]>(initialValue)
  const editor = useMemo(() => withReact(createEditor()), [])
  return (
    <Slate editor={editor} value={value} onChange={value => setValue(value)}>
      <Calculator interpreter={interpreter} />
      <Editable placeholder="Enter some plain text..." />
    </Slate>
  )
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [
      { text: '4 * 4' },
    ],
  },
]

export default App;
