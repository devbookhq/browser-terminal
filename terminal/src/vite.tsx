// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { render, h } from 'preact'
import Embed from './Embed'

const editorCode = 'console.log("4")'
const runCode = 'console.log("4")'
//const id = 'Nodejs'
const id = 'aaxcAiTn9XRX'
const title = 'new'
const template = 'Nodejs'

render(
  <Embed
    template={template}
    editorCode={editorCode}
    runCode={runCode}
    title={title}
    id={id}
    isReadOnly
  />,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  document.getElementById('app')!,
)
